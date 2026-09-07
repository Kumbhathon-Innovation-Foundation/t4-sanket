import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export interface LocationRecord {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'ghat' | 'temple' | 'parking' | 'facility';
}

export interface RouteStatusRecord {
  route_id: string;
  from_location: string;
  to_location: string;
  tier: number;
  crowd: string;
  message_hi: string | null;
  message_mr: string | null;
  message_en: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface ParkingRecord {
  id: string;
  name?: string;
  availability_pct: number;
  lat?: number;
  lng?: number;
}

export interface FacilityRecord {
  id: string;
  type: string;
  near_location: string;
  status: string;
  distance_m: number;
  queue_min: number;
  last_verified_at: string;
}

export interface FoodRecord {
  id: string;
  near_location: string;
  distance_m: number;
  queue: string;
  reference_price_inr: number;
}

export interface AdminUserRecord {
  id: string;
  username: string;
  password_hash: string;
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseServiceKey &&
  !supabaseUrl.includes('your-project')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: { persistSession: false }
    })
  : null;

// Initial in-memory data store for fallback / local development
const seedLocations: LocationRecord[] = [
  { id: 'P09', name: 'Modi Ground Parking', lat: 20.0061, lng: 73.8102, type: 'parking' },
  { id: 'RAMKUND', name: 'Ramkund Main Ghat', lat: 20.0085, lng: 73.7925, type: 'ghat' },
  { id: 'KALARAM', name: 'Kalaram Temple', lat: 20.0070, lng: 73.7952, type: 'temple' },
  { id: 'SITA_GUFA', name: 'Sita Gufa', lat: 20.0075, lng: 73.7961, type: 'temple' },
  { id: 'R21_end', name: 'Panchavati Ghat', lat: 20.0083, lng: 73.7914, type: 'ghat' },
  { id: 'R18_end', name: 'Tapovan Ghat', lat: 20.0000, lng: 73.8124, type: 'ghat' }
];

let memoryRouteStatus: RouteStatusRecord[] = [
  {
    route_id: 'R17',
    from_location: 'P09',
    to_location: 'RAMKUND',
    tier: 4,
    crowd: 'moderate',
    message_hi: 'सीधा नदी तट मार्ग। सामान्य प्रवाह। अनुमानित चलने का समय: १४ मिनट।',
    message_mr: 'थेट नदीकाठ मार्ग. सामान्य प्रवाह. चालण्याचा अंदाजे वेळ: १४ मिनिटे.',
    message_en: 'Direct riverside road. Normal flow. Estimated walk time: 14 minutes.',
    updated_by: 'Police Traffic Control HQ',
    updated_at: new Date().toISOString()
  },
  {
    route_id: 'R21',
    from_location: 'P09',
    to_location: 'R21_end',
    tier: 4,
    crowd: 'low',
    message_hi: 'आधिकारिक पुलिस डायवर्जन मार्ग। चौड़ा सुरक्षित पैदल पथ।',
    message_mr: 'अधिकृत पोलीस वळण मार्ग. रुंद व सुरक्षित पादचारी मार्ग.',
    message_en: 'Designated official police diversion route. Wide pedestrian walkway, clear flow.',
    updated_by: 'Crowd Safety Division',
    updated_at: new Date().toISOString()
  },
  {
    route_id: 'R18',
    from_location: 'P09',
    to_location: 'R18_end',
    tier: 4,
    crowd: 'low',
    message_hi: 'तपोवन घाट बाईपास (१.४ किमी)। कम भीड़ वाला सुगम मार्ग।',
    message_mr: 'तपोवन घाट बायपास (१.४ किमी). कमी गर्दीचा सुरक्षित मार्ग.',
    message_en: 'Bypass corridor to Tapovan Ghat (~1.4 km). Low crowd density.',
    updated_by: 'Tapovan Sector Police',
    updated_at: new Date().toISOString()
  }
];

const memoryParking: ParkingRecord[] = [
  { id: 'P09', availability_pct: 68 }
];

const memoryFacilities: FacilityRecord[] = [
  {
    id: 'FAC_1',
    type: 'toilet',
    near_location: 'RAMKUND',
    status: 'clean',
    distance_m: 140,
    queue_min: 3,
    last_verified_at: new Date(Date.now() - 4 * 60000).toISOString()
  },
  {
    id: 'FAC_2',
    type: 'toilet',
    near_location: 'R21_end',
    status: 'clean',
    distance_m: 210,
    queue_min: 2,
    last_verified_at: new Date(Date.now() - 5 * 60000).toISOString()
  }
];

const memoryFood: FoodRecord[] = [
  {
    id: 'FOOD_1',
    near_location: 'RAMKUND',
    distance_m: 160,
    queue: '5 min',
    reference_price_inr: 0
  },
  {
    id: 'FOOD_2',
    near_location: 'RAMKUND',
    distance_m: 290,
    queue: '4 min',
    reference_price_inr: 30
  }
];

import bcrypt from 'bcryptjs';

const memoryAdminUsers: AdminUserRecord[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    username: 'admin',
    password_hash: bcrypt.hashSync('pravah2026', 10)
  }
];

// Unified Data Access Layer
export const db = {
  async getLocations(): Promise<LocationRecord[]> {
    if (supabase) {
      const { data, error } = await supabase.from('locations').select('*');
      if (!error && data) return data as LocationRecord[];
    }
    return seedLocations;
  },

  async getLocationById(id: string): Promise<LocationRecord | undefined> {
    const list = await this.getLocations();
    return list.find((loc) => loc.id === id);
  },

  async getRouteStatuses(): Promise<RouteStatusRecord[]> {
    if (supabase) {
      const { data, error } = await supabase.from('route_status').select('*');
      if (!error && data) return data as RouteStatusRecord[];
    }
    return memoryRouteStatus;
  },

  async getRouteStatusById(routeId: string): Promise<RouteStatusRecord | undefined> {
    if (supabase) {
      const { data, error } = await supabase
        .from('route_status')
        .select('*')
        .eq('route_id', routeId)
        .single();
      if (!error && data) return data as RouteStatusRecord;
    }
    return memoryRouteStatus.find((r) => r.route_id === routeId);
  },

  async updateRouteStatus(
    routeId: string,
    tier: number,
    crowd: string,
    messages: { hi?: string; mr?: string; en?: string },
    updatedBy: string
  ): Promise<RouteStatusRecord> {
    const updatedAt = new Date().toISOString();

    if (supabase) {
      const updatePayload: Partial<RouteStatusRecord> = {
        tier,
        crowd,
        message_hi: messages.hi,
        message_mr: messages.mr,
        message_en: messages.en,
        updated_by: updatedBy,
        updated_at: updatedAt
      };

      const { data, error } = await supabase
        .from('route_status')
        .update(updatePayload)
        .eq('route_id', routeId)
        .select()
        .single();

      if (!error && data) return data as RouteStatusRecord;
      console.warn('Supabase update failed, falling back to in-memory store:', error);
    }

    const idx = memoryRouteStatus.findIndex((r) => r.route_id === routeId);
    if (idx === -1) {
      throw new Error(`Route with id ${routeId} not found`);
    }

    memoryRouteStatus[idx] = {
      ...memoryRouteStatus[idx],
      tier,
      crowd,
      message_hi: messages.hi || memoryRouteStatus[idx].message_hi,
      message_mr: messages.mr || memoryRouteStatus[idx].message_mr,
      message_en: messages.en || memoryRouteStatus[idx].message_en,
      updated_by: updatedBy,
      updated_at: updatedAt
    };

    return memoryRouteStatus[idx];
  },

  async resetAllRoutes(): Promise<RouteStatusRecord[]> {
    const updatedAt = new Date().toISOString();
    if (supabase) {
      const { data, error } = await supabase
        .from('route_status')
        .update({
          tier: 4,
          crowd: 'low',
          updated_by: 'PRAVAH Police Control Command (Reset)',
          updated_at: updatedAt
        })
        .neq('route_id', '')
        .select();

      if (!error && data) return data as RouteStatusRecord[];
    }

    memoryRouteStatus = memoryRouteStatus.map((r) => ({
      ...r,
      tier: 4,
      crowd: 'low',
      updated_by: 'PRAVAH Police Control Command (Reset)',
      updated_at: updatedAt
    }));

    return memoryRouteStatus;
  },

  async getParking(): Promise<ParkingRecord[]> {
    if (supabase) {
      const { data, error } = await supabase.from('parking').select('*');
      if (!error && data) return data as ParkingRecord[];
    }
    return memoryParking;
  },

  async getFacilities(): Promise<FacilityRecord[]> {
    if (supabase) {
      const { data, error } = await supabase.from('facilities').select('*');
      if (!error && data) return data as FacilityRecord[];
    }
    return memoryFacilities;
  },

  async getFood(): Promise<FoodRecord[]> {
    if (supabase) {
      const { data, error } = await supabase.from('food').select('*');
      if (!error && data) return data as FoodRecord[];
    }
    return memoryFood;
  },

  async getAdminUser(username: string): Promise<AdminUserRecord | undefined> {
    if (supabase) {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .single();
      if (!error && data) return data as AdminUserRecord;
    }
    return memoryAdminUsers.find((u) => u.username === username);
  }
};
