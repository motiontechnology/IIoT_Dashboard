import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Gauge,
  Eye,
  LockKeyhole,
  LogIn,
  LogOut,
  Languages,
  Moon,
  Pause,
  Play,
  Radio,
  ShieldCheck,
  Sun,
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

type UserRole = 'admin' | 'user';

interface AuthUser {
  id: number;
  username: string;
  password: string;
  role: UserRole;
  name: string;
}

interface SessionUser {
  id: number;
  username: string;
  role: UserRole;
  name: string;
}

type Language = 'es' | 'en';
type Theme = 'dark' | 'light';

interface Translations {
  loginTitle: string;
  loginSubtitle: string;
  username: string;
  password: string;
  login: string;
  loggingIn: string;
  wrongCredentials: string;
  loadError: string;
  loginError: string;
  showPassword: string;
  hidePassword: string;
  clearTheme: string;
  darkTheme: string;
  administrator: string;
  user: string;
  logout: string;
  monitor: string;
  unsNamespace: string;
  streaming: string;
  paused: string;
  stopFault: string;
  simulateFault: string;
  acknowledge: string;
  loading: string;
  languageTitle: string;
  lightThemeTitle: string;
  darkThemeTitle: string;
  roles: {
    admin: string;
    user: string;
  };
  rated: string;
  speed: string;
  nominal: string;
  tripThreshold: string;
  realTime: string;
  slidingWindow: string;
  eventLog: string;
  active: string;
  noFaults: string;
  acknowledgeAck: string;
  unsBrowser: string;
  payload: string;
  topic: string;
  register: string;
  description: string;
  value: string;
  quality: string;
  timestamp: string;
  metrics: Record<MetricKey, string>;
  kpis: {
    current: string;
    frequency: string;
    busVoltage: string;
    temperature: string;
  };
}

export function App() {
  const [language, setLanguage] = useState<Language>(() =>
    localStorage.getItem('iiot-language') === 'en' ? 'en' : 'es',
  );
  const [text, setText] = useState<Translations | null>(null);
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem('iiot-theme') === 'light' ? 'light' : 'dark',
  );
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(() => {
    const storedUser = sessionStorage.getItem('iiot-session-user');
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser) as SessionUser;
    } catch {
      sessionStorage.removeItem('iiot-session-user');
      return null;
    }
  });
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

  useEffect(() => {
    let active = true;

    fetch(`/locales/${language}.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`Translation file not found: ${language}`);
        return response.json() as Promise<Translations>;
      })
      .then((translations) => {
        if (active) setText(translations);
      })
      .catch((error) => console.error(error));

    return () => {
      active = false;
    };
  }, [language]);

  const isFaulted = latest.currentA > selectedAsset.ratedCurrentA * 1.15;

  const unsTags: UnsTagRow[] = useMemo(() => {
    return (Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => ({
      topic: `${selectedAsset.unsTopic}/${key}`,
      register: METRIC_CONFIG[key].register,
      key,
      label: text?.metrics[key] ?? METRIC_CONFIG[key].label,
      unit: METRIC_CONFIG[key].unit,
      value: latest[key],
      quality: isStreaming ? 'GOOD' : 'STALE',
      lastUpdated: latest.timestamp,
    }));
  }, [selectedAsset.unsTopic, latest, isStreaming, text]);

  const activeMetricMeta = METRIC_CONFIG[selectedMetric];
  const isAdmin = sessionUser?.role === 'admin';

  if (!text) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-sm text-slate-400">...</div>
      </main>
    );
  }

  if (!sessionUser) {
    return (
      <LoginPage
        onLogin={setSessionUser}
        text={text}
        language={language}
        theme={theme}
        setLanguage={setLanguage}
        setTheme={setTheme}
      />
    );
  }

  return (
    <div
      data-theme={theme}
      className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans app-theme"
    >
      {/* Top Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold tracking-tight">
              MotionTech <span className="text-slate-400 font-normal">| {text.monitor}</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            {text.unsNamespace}: {selectedAsset.unsTopic} ({selectedAsset.protocol})
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const nextLanguage = language === 'es' ? 'en' : 'es';
              setLanguage(nextLanguage);
              localStorage.setItem('iiot-language', nextLanguage);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-300 hover:border-slate-500"
            title={text.languageTitle}
          >
            <Languages className="w-3.5 h-3.5" />
            {language === 'es' ? 'ES' : 'EN'}
          </button>

          <button
            type="button"
            onClick={() => {
              const nextTheme = theme === 'dark' ? 'light' : 'dark';
              setTheme(nextTheme);
              localStorage.setItem('iiot-theme', nextTheme);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-300 hover:border-slate-500"
            title={theme === 'dark' ? text.lightThemeTitle : text.darkThemeTitle}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {theme === 'dark' ? text.clearTheme : text.darkTheme}
          </button>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800">
            {isAdmin ? (
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            ) : (
              <Eye className="w-4 h-4 text-slate-400" />
            )}
            <div className="leading-tight">
              <div className="text-xs font-semibold text-slate-200">{sessionUser.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                {text.roles[sessionUser.role]}
              </div>
            </div>
          </div>

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

          {isAdmin && (
            <>
              <button
                onClick={() => setIsOvercurrentSimulated((prev) => !prev)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  isOvercurrentSimulated
                    ? 'bg-red-500/20 border-red-500 text-red-300'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                {isOvercurrentSimulated ? text.stopFault : text.simulateFault}
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
                {isStreaming ? text.streaming : text.paused}
              </button>
            </>
          )}

          <button
            onClick={() => {
              sessionStorage.removeItem('iiot-session-user');
              setSessionUser(null);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-300 hover:border-slate-500"
          >
            <LogOut className="w-3.5 h-3.5" />
            {text.logout}
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title={text.kpis.current}
          value={`${latest.currentA} A`}
          subtitle={`${text.rated}: ${selectedAsset.ratedCurrentA} A`}
          icon={<Zap className="w-4 h-4 text-blue-400" />}
          alert={isFaulted}
        />
        <KpiCard
          title={text.kpis.frequency}
          value={`${latest.frequencyHz} Hz`}
          subtitle={`${text.speed}: ${latest.rpm} RPM`}
          icon={<Activity className="w-4 h-4 text-emerald-400" />}
        />
        <KpiCard
          title={text.kpis.busVoltage}
          value={`${latest.busVoltageV} V`}
          subtitle={`${text.nominal}: 540 V DC`}
          icon={<Gauge className="w-4 h-4 text-purple-400" />}
        />
        <KpiCard
          title={text.kpis.temperature}
          value={`${latest.temperatureC} °C`}
          subtitle={`${text.tripThreshold}: 85.0 °C`}
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
                {text.realTime} ({text.metrics[selectedMetric]})
              </h2>
              <p className="text-xs text-slate-400">{text.slidingWindow}</p>
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
              {text.eventLog}
            </h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
              {alarms.filter((a) => !a.acknowledged).length} {text.active}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-64 pr-1">
            {alarms.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-10">
                <CheckCircle2 className="w-6 h-6 mb-2 text-emerald-500/60" />
                {text.noFaults}
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
                  {!alarm.acknowledged && isAdmin && (
                    <button
                      onClick={() => acknowledgeAlarm(alarm.id)}
                      className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded text-[11px] font-medium"
                    >
                      {text.acknowledgeAck}
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
              {text.unsBrowser}
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">{text.payload}: Sparkplug B / JSON</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono">
              <tr>
                <th className="py-3 px-5">{text.topic}</th>
                <th className="py-3 px-4">{text.register}</th>
                <th className="py-3 px-4">{text.description}</th>
                <th className="py-3 px-4">{text.value}</th>
                <th className="py-3 px-4">{text.quality}</th>
                <th className="py-3 px-5 text-right">{text.timestamp}</th>
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

interface LoginPageProps {
  onLogin: (user: SessionUser) => void;
  text: Translations;
  language: Language;
  theme: Theme;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
}

function LoginPage({ onLogin, text, language, theme, setLanguage, setTheme }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/users.json');
      if (!response.ok) throw new Error(text.loadError);

      const users = (await response.json()) as AuthUser[];
      const matchedUser = users.find(
        (user) =>
          user.username.toLowerCase() === username.trim().toLowerCase() &&
          user.password === password,
      );

      if (!matchedUser) {
        setError(text.wrongCredentials);
        return;
      }

      const sessionUser: SessionUser = {
        id: matchedUser.id,
        username: matchedUser.username,
        role: matchedUser.role,
        name: matchedUser.name,
      };
      sessionStorage.setItem('iiot-session-user', JSON.stringify(sessionUser));
      onLogin(sessionUser);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : text.loginError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      data-theme={theme}
      className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans app-theme"
    >
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              const nextLanguage = language === 'es' ? 'en' : 'es';
              setLanguage(nextLanguage);
              localStorage.setItem('iiot-language', nextLanguage);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-300"
          >
            <Languages className="w-3.5 h-3.5" />
            {language === 'es' ? 'ES' : 'EN'}
          </button>
          <button
            type="button"
            onClick={() => {
              const nextTheme = theme === 'dark' ? 'light' : 'dark';
              setTheme(nextTheme);
              localStorage.setItem('iiot-theme', nextTheme);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-300"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {theme === 'dark' ? text.clearTheme : text.darkTheme}
          </button>
        </div>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center">
            <Cpu className="w-7 h-7 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{text.loginTitle}</h1>
          <p className="text-sm text-slate-400 mt-1">{text.loginSubtitle}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-black/20"
        >
          <div className="space-y-4">
            <label className="block">
              <span className="block text-xs font-medium text-slate-400 mb-2">{text.username}</span>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  required
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 pl-10 pr-3 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500"
                  placeholder={text.username}
                />
              </div>
            </label>

            <label className="block">
              <span className="block text-xs font-medium text-slate-400 mb-2">{text.password}</span>
              <div className="relative">
                <LockKeyhole className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 pl-10 pr-16 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500"
                  placeholder={text.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-2.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? text.hidePassword : text.showPassword}
                </button>
              </div>
            </label>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            <LogIn className="w-4 h-4" />
            {isSubmitting ? text.loggingIn : text.login}
          </button>
        </form>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="font-semibold text-slate-300">{text.administrator}</div>
            <div className="mt-1 font-mono text-slate-500">admin / admin123</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="font-semibold text-slate-300">{text.user}</div>
            <div className="mt-1 font-mono text-slate-500">user / user123</div>
          </div>
        </div>
      </div>
    </main>
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