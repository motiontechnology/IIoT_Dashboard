import { useState, useEffect, useCallback } from 'react';
import type {
  IndustrialAsset,
  TelemetryDataPoint,
  TelemetryMetrics,
  ActiveAlarm,
} from '../types/telemetry';

const MAX_WINDOW_SIZE = 30;

export const INITIAL_ASSETS: IndustrialAsset[] = [
  {
    id: 'vfd-veikong-01',
    name: 'Main Conveyor Drive',
    model: 'Veikong VFD500',
    protocol: 'Modbus TCP',
    unsTopic: 'motiontech/monterrey/line1/vfd01',
    status: 'ONLINE',
    ratedCurrentA: 18.5,
  },
  {
    id: 'plc-s7-1200',
    name: 'Packaging Cell Controller',
    model: 'Siemens S7-1214C',
    protocol: 'S7 Protocol',
    unsTopic: 'motiontech/monterrey/line1/plc01',
    status: 'ONLINE',
    ratedCurrentA: 12.0,
  },
  {
    id: 'vfd-veikong-02',
    name: 'Exhaust Blower VFD',
    model: 'Veikong VFD500-M',
    protocol: 'Modbus TCP',
    unsTopic: 'motiontech/monterrey/hvac/vfd02',
    status: 'ONLINE',
    ratedCurrentA: 24.0,
  },
];

export function useTelemetryStream(selectedAsset: IndustrialAsset) {
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [isOvercurrentSimulated, setIsOvercurrentSimulated] = useState<boolean>(false);
  const [history, setHistory] = useState<TelemetryDataPoint[]>([]);
  const [alarms, setAlarms] = useState<ActiveAlarm[]>([]);

  const generateNextMetrics = useCallback((): TelemetryMetrics => {
    const baseFreq = 60.0 + (Math.random() - 0.5) * 0.4;
    const baseCurrent = isOvercurrentSimulated
      ? selectedAsset.ratedCurrentA * 1.35 + Math.random() * 1.5
      : selectedAsset.ratedCurrentA * 0.72 + (Math.random() - 0.5) * 0.8;

    return {
      frequencyHz: Number(baseFreq.toFixed(2)),
      currentA: Number(baseCurrent.toFixed(2)),
      busVoltageV: Number((540 + (Math.random() - 0.5) * 4).toFixed(1)),
      temperatureC: Number((isOvercurrentSimulated ? 78.5 : 46.2 + (Math.random() - 0.5) * 1.2).toFixed(1)),
      rpm: Math.round((baseFreq / 60) * 1750),
    };
  }, [isOvercurrentSimulated, selectedAsset.ratedCurrentA]);

  useEffect(() => {
    setHistory([]);
    setIsOvercurrentSimulated(false);
  }, [selectedAsset.id]);

  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const metrics = generateNextMetrics();
      const now = new Date();
      const timestamp = now.toTimeString().split(' ')[0];

      const newPoint: TelemetryDataPoint = {
        timestamp,
        ...metrics,
      };

      setHistory((prev) => [...prev.slice(-(MAX_WINDOW_SIZE - 1)), newPoint]);

      // Trigger fault alarm if current exceeds 115% of rated current
      if (metrics.currentA > selectedAsset.ratedCurrentA * 1.15) {
        setAlarms((prev) => {
          const hasUnacked = prev.some(
            (a) => a.assetId === selectedAsset.id && !a.acknowledged
          );
          if (hasUnacked) return prev;

          return [
            {
              id: crypto.randomUUID(),
              assetId: selectedAsset.id,
              assetName: selectedAsset.name,
              severity: 'CRITICAL',
              message: `Overcurrent fault detected: ${metrics.currentA} A (Rated: ${selectedAsset.ratedCurrentA} A)`,
              timestamp,
              acknowledged: false,
            },
            ...prev,
          ];
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isStreaming, generateNextMetrics, selectedAsset]);

  const acknowledgeAlarm = (alarmId: string) => {
    setAlarms((prev) =>
      prev.map((alarm) =>
        alarm.id === alarmId ? { ...alarm, acknowledged: true } : alarm
      )
    );
  };

  const latest: TelemetryDataPoint = history[history.length - 1] ?? {
    timestamp: '--:--:--',
    frequencyHz: 60.0,
    currentA: 0,
    busVoltageV: 540.0,
    temperatureC: 45.0,
    rpm: 1750,
  };

  return {
    latest,
    history,
    alarms,
    isStreaming,
    setIsStreaming,
    isOvercurrentSimulated,
    setIsOvercurrentSimulated,
    acknowledgeAlarm,
  };
}