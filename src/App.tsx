import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Gauge,
  Pause,
  Play,
  Radio,
  Thermometer,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { INITIAL_ASSETS, useTelemetryStream } from './hooks/useTelemetryStream';
// import { IndustrialAsset, MetricKey, UnsTagRow } from './types/telemetry';
import type { IndustrialAsset, MetricKey, UnsTagRow } from './types/telemetry';
const METRIC_CONFIG: Record<
  MetricKey,
  { label: string; unit: string; color: string; register: string }
> = {
  currentA: { label: 'Output Current', unit: 'A', color: '#3b82f6', register: '40001' },
  frequencyHz: { label: 'Output Frequency', unit: 'Hz', color: '#10b981', register: '40002' },
  busVoltageV: { label: 'DC Bus Voltage', unit: 'V', color: '#8b5cf6', register: '40003' },
  temperatureC: { label: 'IGBT Temp', unit: '°C', color: '#f59e0b', register: '40004' },
  rpm: { label: 'Motor Speed', unit: 'RPM', color: '#06b6d4', register: '40005' },
};

export function App() {
  const [selectedAsset, setSelectedAsset] = useState<IndustrialAsset>(INITIAL_ASSETS[0]);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('currentA');

  const {
    latest,
    history,
    alarms,
    isStreaming,
    setIsStreaming,
    isOvercurrentSimulated,
    setIsOvercurrentSimulated,
    acknowledgeAlarm,
  } = useTelemetryStream(selectedAsset);

  const isFaulted = latest.currentA > selectedAsset.ratedCurrentA * 1.15;

  const unsTags: UnsTagRow[] = useMemo(() => {
    return (Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => ({
      topic: `${selectedAsset.unsTopic}/${key}`,
      register: METRIC_CONFIG[key].register,
      key,
      label: METRIC_CONFIG[key].label,
      unit: METRIC_CONFIG[key].unit,
      value: latest[key],
      quality: isStreaming ? 'GOOD' : 'STALE',
      lastUpdated: latest.timestamp,
    }));
  }, [selectedAsset.unsTopic, latest, isStreaming]);

  const activeMetricMeta = METRIC_CONFIG[selectedMetric];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold tracking-tight">
              MotionTech <span className="text-slate-400 font-normal">| IIoT Edge Monitor</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            UNS Namespace: {selectedAsset.unsTopic} ({selectedAsset.protocol})
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedAsset.id}
            onChange={(e) => {
              const found = INITIAL_ASSETS.find((a) => a.id === e.target.value);
              if (found) setSelectedAsset(found);
            }}
            className="bg-slate-900 border border-slate-700 text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            {INITIAL_ASSETS.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name} ({asset.model})
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsOvercurrentSimulated((prev) => !prev)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              isOvercurrentSimulated
                ? 'bg-red-500/20 border-red-500 text-red-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            {isOvercurrentSimulated ? 'Stop Fault Injection' : 'Simulate Overcurrent'}
          </button>

          <button
            onClick={() => setIsStreaming((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              isStreaming
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-amber-600/20 text-amber-400 border border-amber-500/40'
            }`}
          >
            {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isStreaming ? 'STREAMING' : 'PAUSED'}
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Output Current"
          value={`${latest.currentA} A`}
          subtitle={`Rated: ${selectedAsset.ratedCurrentA} A`}
          icon={<Zap className="w-4 h-4 text-blue-400" />}
          alert={isFaulted}
        />
        <KpiCard
          title="Output Frequency"
          value={`${latest.frequencyHz} Hz`}
          subtitle={`Speed: ${latest.rpm} RPM`}
          icon={<Activity className="w-4 h-4 text-emerald-400" />}
        />
        <KpiCard
          title="DC Bus Voltage"
          value={`${latest.busVoltageV} V`}
          subtitle="Nominal: 540 V DC"
          icon={<Gauge className="w-4 h-4 text-purple-400" />}
        />
        <KpiCard
          title="IGBT Temperature"
          value={`${latest.temperatureC} °C`}
          subtitle="Trip Threshold: 85.0 °C"
          icon={<Thermometer className="w-4 h-4 text-amber-400" />}
          alert={latest.temperatureC > 75}
        />
      </section>

      {/* Main Grid: Chart + Alarms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Live Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">
                Real-Time Telemetry ({activeMetricMeta.label})
              </h2>
              <p className="text-xs text-slate-400">30-second sliding window @ 1Hz</p>
            </div>

            <div className="flex gap-1.5">
              {(Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedMetric(key)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    selectedMetric === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {METRIC_CONFIG[key].unit}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeMetricMeta.color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={activeMetricMeta.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke={activeMetricMeta.color}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#metricGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Alarms Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Event & Fault Log
            </h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
              {alarms.filter((a) => !a.acknowledged).length} Active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-64 pr-1">
            {alarms.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-10">
                <CheckCircle2 className="w-6 h-6 mb-2 text-emerald-500/60" />
                No faults recorded in current session
              </div>
            ) : (
              alarms.map((alarm) => (
                <div
                  key={alarm.id}
                  className={`p-3 rounded-lg border text-xs ${
                    alarm.acknowledged
                      ? 'bg-slate-950/50 border-slate-800 text-slate-500'
                      : 'bg-red-950/30 border-red-500/40 text-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold mb-1">
                    <span>{alarm.assetName}</span>
                    <span className="font-mono text-[11px]">{alarm.timestamp}</span>
                  </div>
                  <p className="mb-2">{alarm.message}</p>
                  {!alarm.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlarm(alarm.id)}
                      className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded text-[11px] font-medium"
                    >
                      Acknowledge (ACK)
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Unified Namespace / Sparkplug B Tag Table */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              Unified Namespace (UNS) — Live Tag Browser
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Payload: Sparkplug B / JSON</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono">
              <tr>
                <th className="py-3 px-5">MQTT Topic</th>
                <th className="py-3 px-4">Register</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Value</th>
                <th className="py-3 px-4">Quality</th>
                <th className="py-3 px-5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono">
              {unsTags.map((tag) => (
                <tr key={tag.topic} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-5 text-blue-400">{tag.topic}</td>
                  <td className="py-3 px-4 text-slate-400">{tag.register}</td>
                  <td className="py-3 px-4 font-sans text-slate-200">{tag.label}</td>
                  <td className="py-3 px-4 font-semibold text-slate-100">
                    {tag.value} {tag.unit}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tag.quality === 'GOOD'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {tag.quality}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right text-slate-400">{tag.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  alert?: boolean;
}

function KpiCard({ title, value, subtitle, icon, alert = false }: KpiCardProps) {
  return (
    <div
      className={`p-4 rounded-xl border transition-colors ${
        alert
          ? 'bg-red-950/25 border-red-500/60'
          : 'bg-slate-900 border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        {icon}
      </div>
      <div className={`text-2xl font-bold font-mono ${alert ? 'text-red-400' : 'text-slate-100'}`}>
        {value}
      </div>
      <div className="text-[11px] text-slate-500 mt-1">{subtitle}</div>
    </div>
  );
}

export default App;