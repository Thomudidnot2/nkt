export interface Lead {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "New" | "Reviewed" | "Archived";
  timestamp: string;
}

export interface MaintenanceLog {
  date: string;
  issue: string;
  status: string;
}

export interface Property {
  id: string;
  name: string;
  location: string;
  type: string;
  tenant: string;
  areaSqFt: number;
  monthlyRent: string;
  occupancyStatus: "Occupied" | "Vacant";
  leaseExpiry: string;
  maintenanceLogs: MaintenanceLog[];
}

export interface ActiveSession {
  vehicle: string;
  soc: number;
  durationMinutes: number;
  energyEnergyKwh: number;
  tariffKwh: string;
}

export interface EvGun {
  id: number;
  connectorType: string;
  maxCapacityKw: number;
  currentDrawKw: number;
  status: "Available" | "Charging" | "Faulted";
  activeSession: ActiveSession | null;
}

export interface EvTelemetry {
  stationId: string;
  location: string;
  operator: string;
  ksebInputVoltage: number;
  ksebFrequencyHz: number;
  totalPowerDrawKw: number;
  introductoryRateKwh: string;
  activeSessionsCount: number;
  peakPowerCapacityKw: number;
  kwhDeliveredToday: number;
  guns: EvGun[];
  lastTelemetryUpdate: string;
}

export interface MediaAsset {
  id: string;
  title: string;
  description: string;
  duration: string;
  publishDate: string;
  views: number;
  embedUrl: string;
  resolution: string;
  tags: string[];
}

export interface AgenticLog {
  id: string;
  time: string;
  category: "TELEMETRY" | "SYNC" | "SECURITY" | "DATABASE" | "WEBHOOK";
  text: string;
}
