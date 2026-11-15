export type AssetStatus = 'ONLINE' | 'WARNING' | 'FAULT' | 'OFFLINE';

export type SignalQuality = 'GOOD' | 'BAD' | 'STALE';

export type MetricKey = 'frequencyHz' | 'currentA' | 'busVoltageV' | 'temperatureC' | 'rpm';

export interface TelemetryMetrics {
  frequencyHz: number;
  currentA: number;
  busVoltageV: number;
  temperatureC: number;
  rpm: number;
}

export interface TelemetryDataPoint extends TelemetryMetrics {
  timestamp: string;
}

export interface IndustrialAsset {
  id: string;
  name: string;
  model: string;
  protocol: 'Modbus TCP' | 'S7 Protocol' | 'OPC UA';
  unsTopic: string;
  status: AssetStatus;
  ratedCurrentA: number;
}

export interface UnsTagRow {
  topic: string;
  register: string;
  key: MetricKey;
  label: string;
  unit: string;
  value: number;
  quality: SignalQuality;
  lastUpdated: string;
}

export interface ActiveAlarm {
  id: string;
  assetId: string;
  assetName: string;
  severity: 'CRITICAL' | 'WARNING';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}