import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ExternalLink, EyeOff, Radar, ShieldCheck, Sparkles, Tag } from 'lucide-react';
import { useNeuralAuth } from '../../context/NeuralContext';
import {
  fetchAssistantNetworkIntel,
  fetchNetworkTimeline,
  getLastScanSnapshot,
  listDevices,
  openDeviceInterface,
  setDeviceIgnored,
  setDeviceTrusted,
  startNetworkScan,
  updateDeviceLabelAction,
  type AssistantNetworkIntel,
  type DeviceRecord,
  type NetworkTimelineItem,
  type NetworkTimelineSummary,
  type ScanSnapshot,
} from '../../lib/network';

const REVIEW_LABELS = ['Attention', 'Review', 'Info', 'Unavailable'] as const;
type ReviewLabel = typeof REVIEW_LABELS[number];

type ReviewAction = 'trust' | 'ignore' | 'label' | 'scan' | 'open';

interface ReviewItem {
  id: string;
  label: ReviewLabel;
  title: string;
  body: string;
  deviceId: string | null;
  actionHint: ReviewAction[];
  source: 'device' | 'timeline' | 'scan';
  occurredAt: string;
}

interface MissionTriageScreenProps {
  selectedDeviceId?: string | null;
  onSelectDevice?: (deviceId: string | null) => void;
}

function formatAgo(value: string | null | undefined): string {
  if (!value) return 'never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const deltaMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(deltaMs / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function eventTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}


function candidateUrl(device: DeviceRecord): string | null {
  const explicit = typeof device.metadata.adminUrl === 'string' ? device.metadata.adminUrl.trim() : '';
  if (explicit) {
    try {
      const u = new URL(explicit);
      if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
    } catch {
      // noop
    }
  }

  const host = (device.hostname ?? device.ipAddress).trim();
  if (!host) return null;
  try {
    const normalized = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
    return new URL(`http://${normalized}/`).toString();
  } catch {
    return null;
  }
}

function scoreLabelPriority(label: ReviewLabel): number {
  switch (label) {
    case 'Attention':
      return 4;
    case 'Review':
      return 3;
    case 'Unavailable':
      return 2;
    case 'Info':
    default:
      return 1;
  }
}

function sortReviewItems(items: ReviewItem[]): ReviewItem[] {
  return [...items].sort((a, b) => {
    const labelDelta = scoreLabelPriority(b.label) - scoreLabelPriority(a.label);
    if (labelDelta !== 0) return labelDelta;
    return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
  });
}

function buildReviewItems(devices: DeviceRecord[], timeline: NetworkTimelineSummary | null, lastScan: ScanSnapshot | null): ReviewItem[] {
  const items: ReviewItem[] = [];

  for (const device of devices) {
    const title = device.label ?? device.hostname ?? device.ipAddress;
    if (!device.trusted && !device.ignored) {
      items.push({
        id: `review-trust-${device.id}`,
        label: 'Review',
        title,
        body: 'Device is neither trusted nor ignored yet. Review and choose a state.',
        deviceId: device.id,
        actionHint: ['trust', 'ignore'],
        source: 'device',
        occurredAt: device.lastSeenAt,
      });
    }

    if (!device.label) {
      items.push({
        id: `review-label-${device.id}`,
        label: 'Review',
        title,
        body: 'Device is unlabeled. Add a label to improve later triage summaries.',
        deviceId: device.id,
        actionHint: ['label'],
        source: 'device',
        occurredAt: device.lastSeenAt,
      });
    }

    if (!device.notes) {
      items.push({
        id: `info-notes-${device.id}`,
        label: 'Info',
        title,
        body: 'Device has no notes. Consider documenting owner, role, or maintenance details.',
        deviceId: device.id,
        actionHint: ['label'],
        source: 'device',
        occurredAt: device.lastSeenAt,
      });
    }

    if (candidateUrl(device)) {
      items.push({
        id: `info-open-${device.id}`,
        label: 'Info',
        title,
        body: 'Candidate interface URL is available. Opening is supported but URL correctness is not guaranteed.',
        deviceId: device.id,
        actionHint: ['open'],
        source: 'device',
        occurredAt: device.lastSeenAt,
      });
    }
  }

  if (timeline) {
    for (const item of timeline.items.slice(0, 10)) {
      const label: ReviewLabel = item.category === 'scan_limited'
        ? 'Unavailable'
        : item.attention === 'attention'
          ? 'Attention'
          : 'Info';
      const actionHint: ReviewAction[] = [];
      if (item.deviceId) {
        actionHint.push('trust', 'ignore');
      }
      if (item.category.startsWith('scan_')) {
        actionHint.push('scan');
      }

      items.push({
        id: `timeline-${item.id}`,
        label,
        title: item.title,
        body: item.body,
        deviceId: item.deviceId,
        actionHint,
        source: 'timeline',
        occurredAt: item.occurredAt,
      });
    }
  }

  if (lastScan?.status === 'limited') {
    items.push({
      id: `scan-limited-${lastScan.id}`,
      label: 'Unavailable',
      title: 'Last scan completed with limits',
      body: 'Current platform constraints reduced scan visibility. Results are truthful but not full-network exhaustive.',
      deviceId: null,
      actionHint: ['scan'],
      source: 'scan',
      occurredAt: lastScan.finishedAt ?? lastScan.startedAt,
    });
  }

  return sortReviewItems(items).slice(0, 18);
}

function itemAccent(label: ReviewLabel): string {
  switch (label) {
    case 'Attention':
      return 'border-orange-400/55 bg-orange-500/10 text-orange-300';
    case 'Review':
      return 'border-cyan-400/50 bg-cyan-500/10 text-cyan-200';
    case 'Unavailable':
      return 'border-red-500/45 bg-red-500/10 text-red-300';
    case 'Info':
    default:
      return 'border-zinc-500/50 bg-zinc-600/10 text-zinc-200';
  }
}

export function MissionTriageScreen({ selectedDeviceId = null, onSelectDevice }: MissionTriageScreenProps) {
  const { user } = useNeuralAuth();
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [timeline, setTimeline] = useState<NetworkTimelineSummary | null>(null);
  const [intel, setIntel] = useState<AssistantNetworkIntel | null>(null);
  const [lastScan, setLastScan] = useState<ScanSnapshot | null>(null);
  const [busyAction, setBusyAction] = useState<ReviewAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === selectedDeviceId) ?? null,
    [devices, selectedDeviceId],
  );

  const load = useCallback(async () => {
    if (!user) {
      setDevices([]);
      setTimeline(null);
      setIntel(null);
      setLastScan(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [nextDevices, nextTimeline, nextIntel, nextLastScan] = await Promise.all([
        listDevices(user.id),
        fetchNetworkTimeline(user.id, { limit: 16, scanLimit: 6, eventLimit: 24 }),
        fetchAssistantNetworkIntel(user.id, { selectedDeviceId: selectedDeviceId ?? undefined }),
        getLastScanSnapshot(user.id),
      ]);
      setDevices(nextDevices);
      setTimeline(nextTimeline);
      setIntel(nextIntel);
      setLastScan(nextLastScan);
      if (!selectedDeviceId && nextDevices[0]) {
        onSelectDevice?.(nextDevices[0].id);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  }, [onSelectDevice, selectedDeviceId, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const items = useMemo(() => buildReviewItems(devices, timeline, lastScan), [devices, timeline, lastScan]);

  const summaryCounts = useMemo(() => {
    return {
      attention: items.filter((item) => item.label === 'Attention').length,
      review: items.filter((item) => item.label === 'Review').length,
      unavailable: items.filter((item) => item.label === 'Unavailable').length,
      unlabeled: devices.filter((device) => !device.label).length,
      trusted: devices.filter((device) => device.trusted).length,
    };
  }, [devices, items]);

  const selectFromItem = useCallback((item: ReviewItem) => {
    if (!item.deviceId) return;
    onSelectDevice?.(item.deviceId);
  }, [onSelectDevice]);

  const runAction = useCallback(async (action: ReviewAction) => {
    if (!user) {
      setError('Sign in is required to run triage actions.');
      return;
    }

    if (action !== 'scan' && !selectedDevice) {
      setError('Select a review item tied to a device before running that action.');
      return;
    }

    setBusyAction(action);
    setError(null);
    try {
      if (action === 'scan') {
        await startNetworkScan(user.id);
      } else if (action === 'trust' && selectedDevice) {
        await setDeviceTrusted(user.id, selectedDevice.id, true);
      } else if (action === 'ignore' && selectedDevice) {
        await setDeviceIgnored(user.id, selectedDevice.id, true);
      } else if (action === 'label' && selectedDevice) {
        const fallbackLabel = selectedDevice.hostname ?? selectedDevice.ipAddress;
        await updateDeviceLabelAction(user.id, selectedDevice.id, selectedDevice.label ?? fallbackLabel);
      } else if (action === 'open' && selectedDevice) {
        await openDeviceInterface(user.id, selectedDevice.id, { device: selectedDevice });
      }
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setBusyAction(null);
    }
  }, [load, selectedDevice, user]);

  const assistantNotes = intel?.limitationNotes.slice(0, 3) ?? [];
  const assistantRecommendations = intel?.recommendations.slice(0, 3) ?? [];
  const assistantTimeline = intel?.timeline.items.slice(0, 3) ?? [];
  const whyThisMatters = useMemo(() => {
    const notes: string[] = [];
    if (summaryCounts.review > 0) {
      notes.push(`${summaryCounts.review} review item(s) are unresolved across trust/label workflow.`);
    }
    if (summaryCounts.unlabeled > 0) {
      notes.push(`${summaryCounts.unlabeled} device(s) are unlabeled, reducing triage clarity in later scans.`);
    }
    if (summaryCounts.unavailable > 0) {
      notes.push(`${summaryCounts.unavailable} item(s) are constrained by platform scan limits and need operator confirmation.`);
    }
    if (!notes.length) {
      notes.push('Current queue has no unresolved review blockers. Continue periodic scans for fresh changes.');
    }
    return notes;
  }, [summaryCounts.review, summaryCounts.unavailable, summaryCounts.unlabeled]);

  const selectedCardId = selectedDeviceId ? `device-${selectedDeviceId}` : null;

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#0b0b0b] text-white">
      <div className="pointer-events-none absolute inset-0 z-[1] opacity-[0.035]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")` }} />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,145,89,0.10),transparent_28%),radial-gradient(circle_at_84%_20%,rgba(0,210,255,0.08),transparent_24%),linear-gradient(180deg,#0b0b0b,#000000_55%,#040404)]" />

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-4 custom-scrollbar">
        <section className="mb-4 rounded-xl border-l-4 border-orange-400 bg-zinc-900/80 p-4 shadow-[0_8px_24px_rgba(255,145,89,0.15)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              <SummaryMetric label="Attention" value={`${summaryCounts.attention} items`} valueClass="text-orange-300" />
              <SummaryMetric label="Last scan" value={formatAgo(lastScan?.finishedAt ?? lastScan?.startedAt)} valueClass="text-lime-300" />
              <SummaryMetric label="Trusted" value={String(summaryCounts.trusted)} valueClass="text-white" />
              <SummaryMetric label="Unlabeled" value={String(summaryCounts.unlabeled)} valueClass="text-cyan-300" />
            </div>
            <div className="flex items-center gap-2 border border-red-500/35 bg-red-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08rem] text-red-300">
              <AlertTriangle className="h-4 w-4" />
              {summaryCounts.unavailable > 0
                ? `${summaryCounts.unavailable} limited/blocked item(s) require platform-aware review`
                : 'No platform limitation alerts in the latest queue window'}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
          <section className="md:col-span-8">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-black italic uppercase tracking-[0.12rem] text-orange-300">
              <span className="h-5 w-1.5 bg-orange-400" />
              Active review stack
            </h2>

            <div className="space-y-3">
              {items.length === 0 && (
                <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-5 text-sm text-zinc-300">
                  {loading ? 'Loading review queue from stored devices/events...' : 'No review items yet. Run a scan to refresh the queue.'}
                </div>
              )}

              {items.map((item) => {
                const isSelected = Boolean(item.deviceId) && selectedCardId === `device-${item.deviceId}`;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectFromItem(item)}
                    className={`group relative block w-full rounded-xl border-l-2 bg-zinc-900/70 p-4 text-left transition hover:bg-zinc-800/70 ${
                      isSelected ? 'border-cyan-400 ring-1 ring-cyan-400/30' : 'border-zinc-600/40'
                    }`}
                    disabled={!item.deviceId}
                    title={item.deviceId ? 'Select device for quick actions' : 'Timeline-only item'}
                  >
                    <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(45deg,#111_25%,transparent_25%),linear-gradient(-45deg,#111_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#111_75%),linear-gradient(-45deg,transparent_75%,#111_75%)] [background-size:4px_4px]" />
                    <div className="relative z-10 flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <span className={`rounded border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12rem] ${itemAccent(item.label)}`}>
                            {item.label}
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.1rem] text-zinc-500">{item.source}</span>
                          <span className="text-[10px] uppercase tracking-[0.1rem] text-zinc-500">{eventTime(item.occurredAt)}</span>
                        </div>
                        <h3 className="text-sm font-black italic uppercase tracking-[0.08rem] text-white">{item.title}</h3>
                        <p className="mt-1 text-xs text-zinc-300">{item.body}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="md:col-span-4 space-y-4">
            <section className="rounded-xl border-t-4 border-cyan-400 bg-zinc-900/80 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-black italic uppercase tracking-[0.12rem] text-cyan-300">
                <Sparkles className="h-4 w-4" />
                Assistant intel
              </h3>

              <div className="space-y-3 text-xs">
                <div className="rounded-lg border border-zinc-700 bg-zinc-950/70 p-3 text-zinc-300">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12rem] text-cyan-300">Recent changes</p>
                  <p>{intel?.changeSummaryText ?? 'No assistant change summary available yet.'}</p>
                </div>

                <div className="rounded-lg border border-zinc-700 bg-zinc-950/70 p-3 text-zinc-300">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12rem] text-cyan-300">Recommendations</p>
                  <ul className="space-y-1.5">
                    {assistantRecommendations.length ? assistantRecommendations.map((rec) => (
                      <li key={rec.id}>• {rec.title}</li>
                    )) : <li>• No recommendation rows available.</li>}
                  </ul>
                </div>

                <div className="rounded-lg border border-zinc-700 bg-zinc-950/70 p-3 text-zinc-300">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12rem] text-cyan-300">Platform limits</p>
                  <ul className="space-y-1.5">
                    {assistantNotes.length ? assistantNotes.map((note) => (
                      <li key={note}>• {note}</li>
                    )) : <li>• No active limitation notes.</li>}
                  </ul>
                </div>

                <div className="rounded-lg border border-zinc-700 bg-zinc-950/70 p-3 text-zinc-300">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12rem] text-cyan-300">Why this matters</p>
                  <ul className="space-y-1.5">
                    {whyThisMatters.map((note) => (
                      <li key={note}>• {note}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-zinc-700 bg-zinc-950/70 p-3 text-zinc-300">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12rem] text-cyan-300">Next best actions</p>
                  <ul className="space-y-1.5">
                    {assistantTimeline.length ? assistantTimeline.map((item: NetworkTimelineItem) => (
                      <li key={item.id}>• {item.title}</li>
                    )) : <li>• Scan to generate fresh next-step guidance.</li>}
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-dashed border-zinc-600 bg-zinc-900/70 p-4 text-xs text-zinc-300">
              <p className="font-black uppercase tracking-[0.12rem] text-zinc-100">Selected device</p>
              <p className="mt-1">{selectedDevice ? (selectedDevice.label ?? selectedDevice.hostname ?? selectedDevice.ipAddress) : 'None selected from review stack.'}</p>
              <p className="mt-2 text-zinc-500">Status: {selectedDevice?.status ?? 'unavailable'}</p>
            </section>
          </aside>
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-20 left-0 z-[120] w-full px-4">
        <div className="pointer-events-auto mx-auto flex max-w-[430px] flex-wrap items-center gap-2">
          <ActionButton label="Trust selected" icon={<ShieldCheck className="h-3.5 w-3.5" />} busy={busyAction === 'trust'} onClick={() => void runAction('trust')} />
          <ActionButton label="Ignore selected" icon={<EyeOff className="h-3.5 w-3.5" />} busy={busyAction === 'ignore'} onClick={() => void runAction('ignore')} secondary />
          <ActionButton label="Add label" icon={<Tag className="h-3.5 w-3.5" />} busy={busyAction === 'label'} onClick={() => void runAction('label')} secondary />
          <ActionButton label="Run scan" icon={<Radar className="h-3.5 w-3.5" />} busy={busyAction === 'scan'} onClick={() => void runAction('scan')} success />
          <span className="flex-1" />
          <ActionButton label="Open device" icon={<ExternalLink className="h-3.5 w-3.5" />} busy={busyAction === 'open'} onClick={() => void runAction('open')} tertiary />
          <button
            type="button"
            disabled
            className="rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-[10px] font-black uppercase tracking-[0.08rem] text-zinc-500"
            title="Reviewed-state persistence is not implemented yet, so this control is intentionally disabled."
          >
            Mark reviewed (unavailable)
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      </div>
    </div>
  );
}

function SummaryMetric({ label, value, valueClass }: { label: string; value: string; valueClass: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.14rem] text-zinc-500">{label}</p>
      <p className={`text-lg font-black italic uppercase tracking-[0.08rem] ${valueClass}`}>{value}</p>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  busy,
  secondary = false,
  success = false,
  tertiary = false,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  secondary?: boolean;
  success?: boolean;
  tertiary?: boolean;
}) {
  const className = success
    ? 'bg-lime-400 text-black shadow-[0_0_14px_rgba(50,255,0,0.2)]'
    : tertiary
      ? 'bg-cyan-200 text-cyan-950'
      : secondary
        ? 'border border-zinc-600 bg-zinc-900/80 text-zinc-100'
        : 'bg-orange-400 text-black shadow-[0_0_14px_rgba(255,145,89,0.2)]';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-[0.08rem] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      <span className="inline-flex items-center gap-1.5">{icon}{busy ? 'Working...' : label}</span>
    </button>
  );
}
