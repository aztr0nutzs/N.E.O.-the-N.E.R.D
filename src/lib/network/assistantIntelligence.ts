import { listDevices } from './devicesRepository';
import { fetchNetworkTimeline } from './changeTimeline';
import { fetchNetworkSummary } from './networkSummary';
import { getLastScanSnapshot } from './scansRepository';
import { evaluatePlatformCapabilities } from './scanService';
import type { PlatformCapabilities } from './scanService';
import type { NetworkTimelineSummary } from './changeTimeline';
import type {
  DeviceActionType,
  DeviceEvent,
  DeviceRecord,
  NetworkSummary,
  ScanSnapshot,
} from './types';

const RECENT_EVENT_LIMIT = 12;
const TIMELINE_ITEM_LIMIT = 18;
const MAX_RECOMMENDATIONS = 6;
const MAX_DEVICE_BRIEFS = 5;

export type AssistantRecommendationPriority = 'high' | 'normal' | 'low';

export interface AssistantDeviceBrief {
  id: string;
  title: string;
  ipAddress: string;
  hostname: string | null;
  status: DeviceRecord['status'];
  trusted: boolean;
  favorite: boolean;
  ignored: boolean;
  label: string | null;
  notes: string | null;
  candidateAdminUrl: string | null;
  availableActions: Array<{
    actionType: DeviceActionType;
    state: 'real' | 'partial' | 'unavailable';
    label: string;
    reason: string;
  }>;
}

export interface AssistantRecommendation {
  id: string;
  priority: AssistantRecommendationPriority;
  title: string;
  body: string;
  actionType?: DeviceActionType | 'scan' | 'review_limits';
  deviceId?: string;
}

export interface AssistantNetworkIntel {
  generatedAt: string;
  summary: NetworkSummary;
  devices: DeviceRecord[];
  deviceBriefs: AssistantDeviceBrief[];
  lastScan: ScanSnapshot | null;
  recentEvents: DeviceEvent[];
  timeline: NetworkTimelineSummary;
  capabilities: PlatformCapabilities;
  headline: string;
  networkSummaryText: string;
  changeSummaryText: string;
  limitationNotes: string[];
  recommendations: AssistantRecommendation[];
}

function formatTime(value: string | null | undefined): string {
  if (!value) return 'never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function metadataString(device: DeviceRecord, key: string): string | null {
  const value = device.metadata[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function validateHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function bracketIpv6Host(host: string): string {
  if (host.includes(':') && !host.startsWith('[') && !host.endsWith(']')) {
    return `[${host}]`;
  }
  return host;
}

function candidateAdminUrl(device: DeviceRecord): string | null {
  const explicit = metadataString(device, 'adminUrl');
  if (explicit) {
    const valid = validateHttpUrl(explicit);
    if (valid) return valid;
  }

  const host = device.hostname?.trim() || device.ipAddress.trim();
  if (!host) return null;
  return validateHttpUrl(`http://${bracketIpv6Host(host)}/`);
}

function titleForDevice(device: DeviceRecord): string {
  return device.label ?? device.hostname ?? device.ipAddress;
}

function buildDeviceBrief(device: DeviceRecord): AssistantDeviceBrief {
  const adminUrl = candidateAdminUrl(device);

  return {
    id: device.id,
    title: titleForDevice(device),
    ipAddress: device.ipAddress,
    hostname: device.hostname,
    status: device.status,
    trusted: device.trusted,
    favorite: device.favorite,
    ignored: device.ignored,
    label: device.label,
    notes: device.notes,
    candidateAdminUrl: adminUrl,
    availableActions: [
      {
        actionType: 'trust',
        state: 'real',
        label: device.trusted ? 'Clear trust' : 'Trust device',
        reason: 'Persists to the Supabase device record.',
      },
      {
        actionType: 'favorite',
        state: 'real',
        label: device.favorite ? 'Remove favorite' : 'Favorite device',
        reason: 'Persists to the Supabase device record.',
      },
      {
        actionType: 'ignore',
        state: 'real',
        label: device.ignored ? 'Stop ignoring' : 'Ignore device',
        reason: 'Persists to the Supabase device record.',
      },
      {
        actionType: 'label',
        state: 'real',
        label: device.label ? 'Edit label' : 'Add label',
        reason: 'Persists to the Supabase device record.',
      },
      {
        actionType: 'notes',
        state: 'real',
        label: device.notes ? 'Edit notes' : 'Add notes',
        reason: 'Persists to the Supabase device record.',
      },
      {
        actionType: 'open_interface',
        state: adminUrl ? 'partial' : 'unavailable',
        label: 'Open candidate interface',
        reason: adminUrl
          ? 'Can open a candidate HTTP(S) URL, but cannot verify it is an admin panel.'
          : 'No usable HTTP(S) URL can be derived.',
      },
      {
        actionType: 'ping',
        state: adminUrl ? 'partial' : 'unavailable',
        label: 'Check reachability',
        reason: adminUrl
          ? 'Browser HTTP probe only; not ICMP ping.'
          : 'No usable HTTP(S) URL can be derived.',
      },
      {
        actionType: 'wake_on_lan',
        state: 'unavailable',
        label: 'Wake-on-LAN',
        reason: 'Requires a native or server-side packet sender.',
      },
    ],
  };
}

function buildNetworkSummaryText(summary: NetworkSummary, lastScan: ScanSnapshot | null): string {
  const scanText = lastScan
    ? `${lastScan.status} scan at ${formatTime(lastScan.finishedAt ?? lastScan.startedAt)}`
    : 'no scan snapshot yet';

  return [
    `${summary.totalDevices} known device(s): ${summary.onlineDevices} online, ${summary.offlineDevices} offline, ${summary.unknownDevices} unknown.`,
    `${summary.trustedDevices} trusted, ${summary.favoriteDevices} favorite, ${summary.ignoredDevices} ignored, ${summary.unclassifiedDevices} unclassified.`,
    `Most recent scan: ${scanText}.`,
  ].join(' ');
}

function buildChangeSummaryText(timeline: NetworkTimelineSummary, summary: NetworkSummary): string {
  if (timeline.items.length === 0) {
    return summary.totalDevices === 0
      ? 'No scan snapshots or device events are stored yet.'
      : 'No recent scan snapshots or device events are stored.';
  }

  const topItems = timeline.items
    .slice(0, 4)
    .map((item) => `${formatTime(item.occurredAt)} - ${item.title}: ${item.body}`);
  const attentionText = timeline.attentionItems.length > 0
    ? `${timeline.attentionItems.length} item(s) deserve review. `
    : '';
  return `Recent changes: ${attentionText}${topItems.join(' | ')}`;
}

function buildLimitations(capabilities: PlatformCapabilities, lastScan: ScanSnapshot | null): string[] {
  const notes = new Set<string>(capabilities.limitationNotes);
  notes.add('No ICMP ping or raw TCP port scanning is available from the browser/WebView path.');
  notes.add('Wake-on-LAN requires future native or server-side packet sending support.');

  if (lastScan?.status === 'limited') {
    notes.add('The last scan was explicitly limited by platform constraints.');
  }
  if (!capabilities.canEnumerateLanDevices) {
    notes.add('Broad LAN discovery is not available in the current web client.');
  }
  if (!capabilities.canReadMacAddresses) {
    notes.add('MAC/vendor inference is unavailable unless a real scanner supplies those fields.');
  }

  return Array.from(notes);
}

function buildRecommendations(
  summary: NetworkSummary,
  devices: readonly DeviceRecord[],
  lastScan: ScanSnapshot | null,
  limitations: readonly string[],
  timeline: NetworkTimelineSummary,
): AssistantRecommendation[] {
  const recommendations: AssistantRecommendation[] = [];

  if (timeline.attentionItems.length > 0) {
    const latest = timeline.attentionItems[0];
    recommendations.push({
      id: `review-${latest.sourceId}`,
      priority: 'normal',
      title: 'Review recent network changes',
      body: `${latest.title}: ${latest.body}`,
      actionType: 'review_limits',
      deviceId: latest.deviceId ?? undefined,
    });
  }

  if (!lastScan) {
    recommendations.push({
      id: 'run-first-scan',
      priority: 'high',
      title: 'Run a truthful scan',
      body: 'No scan snapshot exists yet. Run the browser-safe scan to persist the current capability-limited baseline.',
      actionType: 'scan',
    });
  } else if (lastScan.status === 'limited') {
    recommendations.push({
      id: 'review-limited-scan',
      priority: 'normal',
      title: 'Review limited scan constraints',
      body: 'The most recent scan completed with limited visibility. Treat device counts as persisted inventory, not full LAN coverage.',
      actionType: 'review_limits',
    });
  }

  const unlabeled = devices.find((device) => !device.label && !device.ignored);
  if (unlabeled) {
    recommendations.push({
      id: `label-${unlabeled.id}`,
      priority: 'normal',
      title: 'Add a device label',
      body: `${titleForDevice(unlabeled)} has no label. Labeling known devices improves future summaries and action guidance.`,
      actionType: 'label',
      deviceId: unlabeled.id,
    });
  }

  const unclassified = devices.find((device) => !device.trusted && !device.ignored);
  if (unclassified) {
    recommendations.push({
      id: `classify-${unclassified.id}`,
      priority: 'normal',
      title: 'Classify known device',
      body: `${titleForDevice(unclassified)} is neither trusted nor ignored. Mark it trusted if recognized, or ignore it if not relevant.`,
      actionType: 'trust',
      deviceId: unclassified.id,
    });
  }

  const notFavorite = devices.find((device) => !device.favorite && !device.ignored);
  if (notFavorite) {
    recommendations.push({
      id: `favorite-${notFavorite.id}`,
      priority: 'low',
      title: 'Favorite key infrastructure',
      body: `If ${titleForDevice(notFavorite)} is important, favorite it so future assistant summaries prioritize it.`,
      actionType: 'favorite',
      deviceId: notFavorite.id,
    });
  }

  const withAdminUrl = devices.find((device) => candidateAdminUrl(device) !== null);
  if (withAdminUrl) {
    recommendations.push({
      id: `open-${withAdminUrl.id}`,
      priority: 'low',
      title: 'Open candidate device interface',
      body: `${titleForDevice(withAdminUrl)} has a candidate HTTP interface URL. Opening it is partial: the app cannot verify it is an admin panel.`,
      actionType: 'open_interface',
      deviceId: withAdminUrl.id,
    });
  }

  if (summary.totalDevices === 0 && limitations.length > 0) {
    recommendations.push({
      id: 'native-scanner-needed',
      priority: 'normal',
      title: 'Plan native/server discovery',
      body: 'No devices are stored yet. Broad LAN discovery needs a native Android scanner or server-side network path.',
      actionType: 'review_limits',
    });
  }

  return recommendations.slice(0, MAX_RECOMMENDATIONS);
}

export async function fetchAssistantNetworkIntel(userId: string): Promise<AssistantNetworkIntel> {
  if (!userId) {
    throw new Error('assistant network intelligence requires an authenticated user id');
  }

  const [summary, devices, lastScan, timeline] = await Promise.all([
    fetchNetworkSummary(userId),
    listDevices(userId),
    getLastScanSnapshot(userId),
    fetchNetworkTimeline(userId, { limit: TIMELINE_ITEM_LIMIT, eventLimit: RECENT_EVENT_LIMIT }),
  ]);
  const recentEvents = timeline.recentEvents;
  const capabilities = evaluatePlatformCapabilities();
  const limitationNotes = buildLimitations(capabilities, lastScan);
  const recommendations = buildRecommendations(summary, devices, lastScan, limitationNotes, timeline);

  return {
    generatedAt: new Date().toISOString(),
    summary,
    devices,
    deviceBriefs: devices.slice(0, MAX_DEVICE_BRIEFS).map(buildDeviceBrief),
    lastScan,
    recentEvents,
    timeline,
    capabilities,
    headline:
      summary.totalDevices === 0
        ? 'No stored device inventory yet.'
        : `${summary.totalDevices} stored device(s), ${summary.unclassifiedDevices} unclassified.`,
    networkSummaryText: buildNetworkSummaryText(summary, lastScan),
    changeSummaryText: buildChangeSummaryText(timeline, summary),
    limitationNotes,
    recommendations,
  };
}

export function formatAssistantNetworkResponse(intel: AssistantNetworkIntel, prompt = ''): string {
  const lower = prompt.toLowerCase();
  const wantsLimits = lower.includes('limit') || lower.includes('cannot') || lower.includes("can't");
  const wantsChanges =
    lower.includes('change')
    || lower.includes('recent')
    || lower.includes('event')
    || lower.includes('alert')
    || lower.includes('history')
    || lower.includes('timeline')
    || lower.includes('review');
  const wantsActions = lower.includes('recommend') || lower.includes('action') || lower.includes('next');
  const wantsDevices = lower.includes('device') || lower.includes('host');

  const sections = [
    `Network summary: ${intel.networkSummaryText}`,
  ];

  if (wantsChanges || !prompt) {
    sections.push(intel.changeSummaryText);
    if (intel.timeline.attentionItems.length > 0) {
      sections.push(
        `Review items: ${intel.timeline.attentionItems
          .slice(0, 4)
          .map((item) => `${item.title}: ${item.body}`)
          .join(' ')}`,
      );
    } else {
      sections.push('Review items: no recent attention-worthy changes are stored.');
    }
  }

  if (wantsDevices && intel.deviceBriefs.length > 0) {
    sections.push(
      `Device context: ${intel.deviceBriefs
        .map((device) => `${device.title} (${device.ipAddress}, ${device.status}, trusted=${device.trusted}, ignored=${device.ignored})`)
        .join('; ')}`,
    );
  } else if (wantsDevices) {
    sections.push('Device context: no persisted device records are available yet.');
  }

  if (wantsActions || !prompt) {
    const actionText = intel.recommendations.length > 0
      ? intel.recommendations.map((rec) => `${rec.title}: ${rec.body}`).join(' ')
      : 'No action recommendation is available until there is stored device or scan data.';
    sections.push(`Recommended next actions: ${actionText}`);
  }

  if (wantsLimits || !prompt) {
    sections.push(`Current limits: ${intel.limitationNotes.slice(0, 4).join(' ')}`);
  }

  return sections.join('\n\n');
}

export function isNetworkAssistantPrompt(prompt: string): boolean {
  const normalized = prompt.toLowerCase();
  return [
    'network',
    'device',
    'scan',
    'lan',
    'router',
    'host',
    'wake-on-lan',
    'wake on lan',
    'port',
    'ping',
    'alert',
    'alerts',
    'history',
    'timeline',
    'recent',
    'change',
    'changed',
    'favorite',
    'trusted',
    'ignored',
    'review',
  ].some((keyword) => normalized.includes(keyword));
}
