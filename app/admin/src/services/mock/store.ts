// In-memory mock store. Phase 2 replaces this module with real API/Supabase calls
// behind the same service functions in src/services.
import * as seed from "@/data/mock";
import type {
  ActivityEntry,
  AppUser,
  AuditEntry,
  Facility,
  Kitchen,
  KumbhEvent,
  OpsAlert,
  ParkingLot,
  Place,
  RouteLink,
  Shortage,
  Volunteer,
  Zone,
} from "@/types";

export interface OpsState {
  zones: Zone[];
  kitchens: Kitchen[];
  shortages: Shortage[];
  parkingLots: ParkingLot[];
  facilities: Facility[];
  places: Place[];
  routeLinks: RouteLink[];
  events: KumbhEvent[];
  volunteers: Volunteer[];
  alerts: OpsAlert[];
  users: AppUser[];
  auditEntries: AuditEntry[];
  activityEntries: ActivityEntry[];
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

let state: OpsState = {
  zones: clone(seed.zones),
  kitchens: clone(seed.kitchens),
  shortages: clone(seed.shortages),
  parkingLots: clone(seed.parkingLots),
  facilities: clone(seed.facilities),
  places: clone(seed.places),
  routeLinks: clone(seed.routeLinks),
  events: clone(seed.events),
  volunteers: clone(seed.volunteers),
  alerts: clone(seed.alerts),
  users: clone(seed.users),
  auditEntries: clone(seed.auditEntries),
  activityEntries: clone(seed.activityEntries),
};

const listeners = new Set<() => void>();
let version = 0;

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getVersion = () => version;

export const getState = () => state;

export const mutate = (updater: (current: OpsState) => OpsState) => {
  state = updater(state);
  version += 1;
  listeners.forEach((listener) => listener());
};

/** Simulated network latency so loading states are real in Phase 1. */
export const delay = <T,>(value: T, ms = 240): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

export const resetStore = () => {
  state = {
    zones: clone(seed.zones),
    kitchens: clone(seed.kitchens),
    shortages: clone(seed.shortages),
    parkingLots: clone(seed.parkingLots),
    facilities: clone(seed.facilities),
    places: clone(seed.places),
    routeLinks: clone(seed.routeLinks),
    events: clone(seed.events),
    volunteers: clone(seed.volunteers),
    alerts: clone(seed.alerts),
    users: clone(seed.users),
    auditEntries: clone(seed.auditEntries),
    activityEntries: clone(seed.activityEntries),
  };
  version += 1;
  listeners.forEach((listener) => listener());
};
