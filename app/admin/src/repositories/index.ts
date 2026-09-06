// Repository Registry & Factory for PRAVAH (Anubhav)
// Dispatches to Demo or Supabase repository implementations based on DATA_MODE.

import { DATA_MODE, type DataMode } from "@/lib/config";
import type {
  AdvisoryRepository,
  CrowdRepository,
  EventRepository,
  FacilityRepository,
  FoodRepository,
  GuidanceRepository,
  ParkingRepository,
  PlaceRepository,
  RouteRepository,
  VolunteerRepository,
} from "./interfaces";

import {
  DemoAdvisoryRepository,
  DemoCrowdRepository,
  DemoEventRepository,
  DemoFacilityRepository,
  DemoFoodRepository,
  DemoGuidanceRepository,
  DemoParkingRepository,
  DemoPlaceRepository,
  DemoRouteRepository,
  DemoVolunteerRepository,
} from "./demo";

import {
  SupabaseAdvisoryRepository,
  SupabaseCrowdRepository,
  SupabaseEventRepository,
  SupabaseFacilityRepository,
  SupabaseFoodRepository,
  SupabaseGuidanceRepository,
  SupabaseParkingRepository,
  SupabasePlaceRepository,
  SupabaseRouteRepository,
  SupabaseVolunteerRepository,
} from "./supabase";

// Singleton instances for Demo
const demoCrowd = new DemoCrowdRepository();
const demoFood = new DemoFoodRepository();
const demoParking = new DemoParkingRepository();
const demoFacility = new DemoFacilityRepository();
const demoRoute = new DemoRouteRepository();
const demoPlace = new DemoPlaceRepository();
const demoEvent = new DemoEventRepository();
const demoAdvisory = new DemoAdvisoryRepository();
const demoVolunteer = new DemoVolunteerRepository();
const demoGuidance = new DemoGuidanceRepository();

// Singleton instances for Supabase
const supabaseCrowd = new SupabaseCrowdRepository();
const supabaseFood = new SupabaseFoodRepository();
const supabaseParking = new SupabaseParkingRepository();
const supabaseFacility = new SupabaseFacilityRepository();
const supabaseRoute = new SupabaseRouteRepository();
const supabasePlace = new SupabasePlaceRepository();
const supabaseEvent = new SupabaseEventRepository();
const supabaseAdvisory = new SupabaseAdvisoryRepository();
const supabaseVolunteer = new SupabaseVolunteerRepository();
const supabaseGuidance = new SupabaseGuidanceRepository();

let currentMode: DataMode = DATA_MODE;

export const getDataMode = (): DataMode => currentMode;

export const setDataMode = (mode: DataMode): void => {
  currentMode = mode;
  console.log(`[PRAVAH Repository] Switched DATA_MODE to: ${mode}`);
};

export const getCrowdRepository = (): CrowdRepository =>
  currentMode === "supabase" ? supabaseCrowd : demoCrowd;

export const getFoodRepository = (): FoodRepository =>
  currentMode === "supabase" ? supabaseFood : demoFood;

export const getParkingRepository = (): ParkingRepository =>
  currentMode === "supabase" ? supabaseParking : demoParking;

export const getFacilityRepository = (): FacilityRepository =>
  currentMode === "supabase" ? supabaseFacility : demoFacility;

export const getRouteRepository = (): RouteRepository =>
  currentMode === "supabase" ? supabaseRoute : demoRoute;

export const getPlaceRepository = (): PlaceRepository =>
  currentMode === "supabase" ? supabasePlace : demoPlace;

export const getEventRepository = (): EventRepository =>
  currentMode === "supabase" ? supabaseEvent : demoEvent;

export const getAdvisoryRepository = (): AdvisoryRepository =>
  currentMode === "supabase" ? supabaseAdvisory : demoAdvisory;

export const getVolunteerRepository = (): VolunteerRepository =>
  currentMode === "supabase" ? supabaseVolunteer : demoVolunteer;

export const getGuidanceRepository = (): GuidanceRepository =>
  currentMode === "supabase" ? supabaseGuidance : demoGuidance;

export * from "./interfaces";
