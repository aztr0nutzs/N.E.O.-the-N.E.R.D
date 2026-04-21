package com.ai.assistant;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.LinkAddress;
import android.net.LinkProperties;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.net.RouteInfo;
import android.os.Build;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import java.io.IOException;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@CapacitorPlugin(
        name = "NeoNetworkScanner",
        permissions = {
                @Permission(alias = "network", strings = { Manifest.permission.ACCESS_NETWORK_STATE })
        }
)
public class NeoNetworkScannerPlugin extends Plugin {
    private static final int DEFAULT_MAX_HOSTS = 24;
    private static final int MAX_HOSTS_LIMIT = 64;
    private static final int DEFAULT_PROBE_TIMEOUT_MS = 350;
    private static final int MAX_PROBE_TIMEOUT_MS = 2000;
    private static final int DEFAULT_PROXIMITY_RADIUS = 12;
    private static final int MAX_PROXIMITY_RADIUS = 32;
    private static final int MAX_CONCURRENT_PROBES = 8;

    @PluginMethod
    public void collectSubnetObservations(PluginCall call) {
        if (getPermissionState("network") != PermissionState.GRANTED) {
            call.reject("ACCESS_NETWORK_STATE permission is required for native Android network discovery.");
            return;
        }

        final int maxHosts = clamp(call.getInt("maxHosts", DEFAULT_MAX_HOSTS), 1, MAX_HOSTS_LIMIT);
        final int probeTimeoutMs = clamp(call.getInt("probeTimeoutMs", DEFAULT_PROBE_TIMEOUT_MS), 100, MAX_PROBE_TIMEOUT_MS);
        final int proximityRadius = clamp(call.getInt("proximityRadius", DEFAULT_PROXIMITY_RADIUS), 1, MAX_PROXIMITY_RADIUS);
        final boolean includeGateway = Boolean.TRUE.equals(call.getBoolean("includeGateway", true));

        final ConnectivityContext connectivityContext = resolveConnectivityContext();
        if (connectivityContext.errorMessage != null) {
            call.reject(connectivityContext.errorMessage);
            return;
        }
        if (connectivityContext.localAddress == null || connectivityContext.prefixLength < 0) {
            call.reject("Android native discovery could not determine a usable IPv4 subnet for the active network.");
            return;
        }

        final DiscoveryComputation computation = computeTargets(
                connectivityContext.localAddress,
                connectivityContext.gatewayAddress,
                connectivityContext.prefixLength,
                maxHosts,
                proximityRadius,
                includeGateway
        );

        final DiscoveryResult discoveryResult = probeTargets(computation.targets, probeTimeoutMs);
        final JSObject response = new JSObject();
        response.put("observations", buildObservationArray(discoveryResult.observations));
        response.put("limitationNotes", buildLimitationArray(connectivityContext, computation, probeTimeoutMs, includeGateway));
        response.put("networkContext", buildNetworkContext(connectivityContext, computation, discoveryResult.observations.size(), probeTimeoutMs, proximityRadius));
        call.resolve(response);
    }

    private ConnectivityContext resolveConnectivityContext() {
        final ConnectivityContext context = new ConnectivityContext();
        final Context androidContext = getContext();
        final ConnectivityManager connectivityManager = (ConnectivityManager) androidContext.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (connectivityManager == null) {
            context.errorMessage = "Android ConnectivityManager is unavailable in this build.";
            return context;
        }

        Network network = null;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            network = connectivityManager.getActiveNetwork();
        }

        LinkProperties linkProperties = null;
        NetworkCapabilities networkCapabilities = null;
        if (network != null) {
            linkProperties = connectivityManager.getLinkProperties(network);
            networkCapabilities = connectivityManager.getNetworkCapabilities(network);
        }

        if (network == null || linkProperties == null) {
            final NetworkInfo activeInfo = connectivityManager.getActiveNetworkInfo();
            if (activeInfo == null || !activeInfo.isConnected()) {
                context.errorMessage = "Android reports no connected active network for discovery.";
                return context;
            }
        }

        if (linkProperties != null) {
            context.interfaceName = linkProperties.getInterfaceName();
            context.gatewayAddress = extractGatewayAddress(linkProperties);
            for (LinkAddress linkAddress : linkProperties.getLinkAddresses()) {
                final InetAddress inetAddress = linkAddress.getAddress();
                if (!(inetAddress instanceof Inet4Address) || inetAddress.isLoopbackAddress()) {
                    continue;
                }
                context.localAddress = (Inet4Address) inetAddress;
                context.prefixLength = linkAddress.getPrefixLength();
                break;
            }
        }

        if (context.localAddress == null) {
            final Enumeration<NetworkInterface> interfaces;
            try {
                interfaces = NetworkInterface.getNetworkInterfaces();
            } catch (Exception error) {
                context.errorMessage = "Android native discovery could not enumerate network interfaces.";
                return context;
            }
            if (interfaces != null) {
                while (interfaces.hasMoreElements()) {
                    final NetworkInterface networkInterface = interfaces.nextElement();
                    final boolean isUp;
                    try {
                        isUp = networkInterface.isUp();
                    } catch (Exception ignored) {
                        continue;
                    }
                    if (!isUp) {
                        continue;
                    }
                    if (context.interfaceName != null && !context.interfaceName.equals(networkInterface.getName())) {
                        continue;
                    }
                    for (InterfaceAddressCandidate candidate : listInterfaceAddresses(networkInterface)) {
                        context.interfaceName = networkInterface.getName();
                        context.localAddress = candidate.address;
                        context.prefixLength = candidate.prefixLength;
                        break;
                    }
                    if (context.localAddress != null) {
                        break;
                    }
                }
            }
        }

        context.hasTransportWifi = networkCapabilities != null && networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI);
        context.hasTransportCellular = networkCapabilities != null && networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR);
        return context;
    }

    private List<InterfaceAddressCandidate> listInterfaceAddresses(NetworkInterface networkInterface) {
        final List<InterfaceAddressCandidate> addresses = new ArrayList<>();
        for (java.net.InterfaceAddress interfaceAddress : networkInterface.getInterfaceAddresses()) {
            final InetAddress inetAddress = interfaceAddress.getAddress();
            if (inetAddress instanceof Inet4Address && !inetAddress.isLoopbackAddress()) {
                addresses.add(new InterfaceAddressCandidate((Inet4Address) inetAddress, interfaceAddress.getNetworkPrefixLength()));
            }
        }
        return addresses;
    }

    private Inet4Address extractGatewayAddress(LinkProperties linkProperties) {
        for (RouteInfo routeInfo : linkProperties.getRoutes()) {
            final InetAddress gateway = routeInfo.getGateway();
            if (gateway instanceof Inet4Address && !gateway.isAnyLocalAddress()) {
                return (Inet4Address) gateway;
            }
        }
        return null;
    }

    private DiscoveryComputation computeTargets(
            Inet4Address localAddress,
            Inet4Address gatewayAddress,
            int prefixLength,
            int maxHosts,
            int proximityRadius,
            boolean includeGateway
    ) {
        final DiscoveryComputation computation = new DiscoveryComputation();
        final long local = ipv4ToLong(localAddress);
        final long mask = prefixLength <= 0 ? 0L : 0xffffffffL << (32 - prefixLength);
        final long network = local & mask;
        final long broadcast = network | (~mask & 0xffffffffL);
        final long firstUsable = prefixLength >= 31 ? network : network + 1L;
        final long lastUsable = prefixLength >= 31 ? broadcast : broadcast - 1L;

        computation.networkBase = longToIpv4(network);
        computation.usableHostCount = firstUsable > lastUsable ? 0 : (int) Math.min(Integer.MAX_VALUE, (lastUsable - firstUsable + 1L));

        final Map<String, Inet4Address> dedupedTargets = new LinkedHashMap<>();
        if (includeGateway && gatewayAddress != null) {
            dedupedTargets.put(gatewayAddress.getHostAddress(), gatewayAddress);
        }

        final int boundedRadius = Math.max(1, proximityRadius);
        final List<Long> candidates = new ArrayList<>();
        candidates.add(local);
        for (int offset = 1; offset <= boundedRadius; offset++) {
            candidates.add(local - offset);
            candidates.add(local + offset);
        }

        Collections.sort(candidates, Comparator.comparingLong(value -> Math.abs(value - local)));
        for (long candidate : candidates) {
            if (dedupedTargets.size() >= maxHosts) {
                break;
            }
            if (candidate < firstUsable || candidate > lastUsable || candidate == local) {
                continue;
            }
            final Inet4Address address = longToIpv4(candidate);
            if (address != null) {
                dedupedTargets.put(address.getHostAddress(), address);
            }
        }

        if (includeGateway && gatewayAddress != null && dedupedTargets.size() < maxHosts) {
            dedupedTargets.put(gatewayAddress.getHostAddress(), gatewayAddress);
        }

        computation.targets = new ArrayList<>(dedupedTargets.values());
        return computation;
    }

    private DiscoveryResult probeTargets(List<Inet4Address> targets, int probeTimeoutMs) {
        final DiscoveryResult result = new DiscoveryResult();
        if (targets.isEmpty()) {
            return result;
        }

        final ExecutorService executor = Executors.newFixedThreadPool(Math.min(MAX_CONCURRENT_PROBES, Math.max(1, targets.size())));
        final CountDownLatch latch = new CountDownLatch(targets.size());
        final AtomicInteger sequence = new AtomicInteger(0);

        for (Inet4Address target : targets) {
            executor.execute(() -> {
                try {
                    final ReachabilityObservation observation = probeSingleHost(target, probeTimeoutMs, sequence.incrementAndGet());
                    if (observation != null) {
                        synchronized (result.observations) {
                            result.observations.add(observation);
                        }
                    }
                } finally {
                    latch.countDown();
                }
            });
        }

        executor.shutdown();
        try {
            latch.await((long) probeTimeoutMs * Math.max(1, targets.size()) + 2000L, TimeUnit.MILLISECONDS);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
        }
        executor.shutdownNow();
        result.observations.sort(Comparator.comparing(observation -> observation.ipAddress));
        return result;
    }

    private ReachabilityObservation probeSingleHost(Inet4Address address, int probeTimeoutMs, int sequence) {
        final long started = System.nanoTime();
        final boolean reachable;
        try {
            reachable = address.isReachable(probeTimeoutMs);
        } catch (IOException ignored) {
            return null;
        }
        if (!reachable) {
            return null;
        }

        final ReachabilityObservation observation = new ReachabilityObservation();
        observation.ipAddress = address.getHostAddress();
        observation.observedAt = Instant.now().toString();
        observation.hostname = deriveHostname(address);
        observation.nativeObservationId = String.format(Locale.US, "android-%d-%s", sequence, observation.ipAddress.replace('.', '-'));
        observation.latencyMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started);
        observation.probeTimeoutMs = probeTimeoutMs;
        return observation;
    }

    private String deriveHostname(Inet4Address address) {
        final String canonical = address.getCanonicalHostName();
        if (canonical == null) {
            return null;
        }
        final String ip = address.getHostAddress();
        if (canonical.equals(ip)) {
            return null;
        }
        final String trimmed = canonical.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private JSArray buildObservationArray(List<ReachabilityObservation> observations) {
        final JSArray array = new JSArray();
        for (ReachabilityObservation observation : observations) {
            final JSObject item = new JSObject();
            item.put("nativeObservationId", observation.nativeObservationId);
            item.put("ipAddress", observation.ipAddress);
            item.put("observedAt", observation.observedAt);
            item.put("hostname", observation.hostname);
            item.put("status", "online");

            final JSObject fieldProvenance = new JSObject();
            fieldProvenance.put("ipAddress", "reported");
            fieldProvenance.put("hostname", observation.hostname == null ? "absent" : "reported");
            fieldProvenance.put("status", "inferred");
            item.put("fieldProvenance", fieldProvenance);

            final JSObject metadata = new JSObject();
            metadata.put("sourceKind", "android_reachability_probe");
            metadata.put("probeTimeoutMs", observation.probeTimeoutMs);
            metadata.put("latencyMs", observation.latencyMs);
            item.put("metadata", metadata);
            array.put(item);
        }
        return array;
    }

    private JSArray buildLimitationArray(
            ConnectivityContext context,
            DiscoveryComputation computation,
            int probeTimeoutMs,
            boolean includeGateway
    ) {
        final JSArray notes = new JSArray();
        notes.put("Android native discovery performs bounded IPv4 reachability probes only; it does not enumerate every LAN device.");
        notes.put("Android does not guarantee MAC addresses, vendor identifiers, router inventory, or hidden-device visibility from this probe path.");
        notes.put(String.format(Locale.US,
                "Probe window limited to %d candidate host(s) with %d ms per-host reachability timeout.",
                computation.targets.size(),
                probeTimeoutMs));
        if (includeGateway && context.gatewayAddress == null) {
            notes.put("Gateway IP could not be resolved from Android LinkProperties for this active network.");
        }
        if (context.hasTransportCellular) {
            notes.put("Active transport appears cellular; subnet reachability results may be sparse or unavailable.");
        }
        return notes;
    }

    private JSObject buildNetworkContext(
            ConnectivityContext context,
            DiscoveryComputation computation,
            int reachableHostCount,
            int probeTimeoutMs,
            int proximityRadius
    ) {
        final JSObject networkContext = new JSObject();
        networkContext.put("interfaceName", context.interfaceName);
        networkContext.put("localIpAddress", context.localAddress != null ? context.localAddress.getHostAddress() : null);
        networkContext.put("gatewayIpAddress", context.gatewayAddress != null ? context.gatewayAddress.getHostAddress() : null);
        networkContext.put("subnetPrefixLength", context.prefixLength >= 0 ? context.prefixLength : null);
        networkContext.put("networkPrefixAddress", computation.networkBase != null ? computation.networkBase.getHostAddress() : null);
        networkContext.put("usableHostCount", computation.usableHostCount);
        networkContext.put("probedHostCount", computation.targets.size());
        networkContext.put("reachableHostCount", reachableHostCount);
        networkContext.put("probeTimeoutMs", probeTimeoutMs);
        networkContext.put("proximityRadius", proximityRadius);
        return networkContext;
    }

    private int clamp(Integer value, int min, int max) {
        if (value == null) {
            return min;
        }
        return Math.max(min, Math.min(max, value));
    }

    private long ipv4ToLong(Inet4Address address) {
        final byte[] octets = address.getAddress();
        long value = 0L;
        for (byte octet : octets) {
            value = (value << 8) | (octet & 0xffL);
        }
        return value & 0xffffffffL;
    }

    private Inet4Address longToIpv4(long value) {
        final byte[] normalized = new byte[] {
                (byte) ((value >> 24) & 0xff),
                (byte) ((value >> 16) & 0xff),
                (byte) ((value >> 8) & 0xff),
                (byte) (value & 0xff)
        };
        try {
            return (Inet4Address) InetAddress.getByAddress(normalized);
        } catch (Exception ignored) {
            return null;
        }
    }

    private static final class ConnectivityContext {
        String interfaceName;
        Inet4Address localAddress;
        Inet4Address gatewayAddress;
        int prefixLength = -1;
        boolean hasTransportWifi;
        boolean hasTransportCellular;
        String errorMessage;
    }

    private static final class InterfaceAddressCandidate {
        final Inet4Address address;
        final short prefixLength;

        InterfaceAddressCandidate(Inet4Address address, short prefixLength) {
            this.address = address;
            this.prefixLength = prefixLength;
        }
    }

    private static final class DiscoveryComputation {
        Inet4Address networkBase;
        int usableHostCount;
        List<Inet4Address> targets = new ArrayList<>();
    }

    private static final class DiscoveryResult {
        final List<ReachabilityObservation> observations = new ArrayList<>();
    }

    private static final class ReachabilityObservation {
        String nativeObservationId;
        String ipAddress;
        String observedAt;
        String hostname;
        long latencyMs;
        int probeTimeoutMs;
    }
}
