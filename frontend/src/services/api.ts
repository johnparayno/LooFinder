/**
 * API client for LooFinder backend
 */

export type ToiletCategory = 'free' | 'code_required' | 'purchase_required';
export type ToiletType = 'handicap' | 'pissoir' | 'unisex' | 'changingplace' | null;
export type VenueType =
  | 'supermarket'
  | 'library'
  | 'museum'
  | 'cafe_restaurant'
  | 'shopping_centre'
  | 'train_station'
  | 'bus_station'
  | 'gym'
  | 'swimming_pool'
  | 'sports_hall'
  | 'other'
  | null;
export type SourceType = 'public_dataset' | 'user_submitted';
export type VerificationStatus = 'verified' | 'unverified' | 'needs_review';

export interface Toilet {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: ToiletCategory;
  access_notes: string | null;
  access_code: string | null;
  opening_hours: string | null;
  source_type: SourceType;
  verification_status: VerificationStatus;
  last_verified_at: string | null;
  temporary_closed: boolean;
  findtoilet_nid?: string | null;
  toilet_type?: ToiletType;
  payment?: boolean;
  manned?: boolean;
  changing_table?: boolean;
  tap?: boolean;
  needle_container?: boolean;
  contact?: string | null;
  image_url?: string | null;
  placement?: string | null;
  year_round?: boolean;
  round_the_clock?: boolean;
  venue_type?: VenueType;
}

export type VenueTypeFilter = Exclude<VenueType, null>;

export interface ListToiletsParams {
  bbox?: string;
  category?: ToiletCategory;
  verification_status?: VerificationStatus;
  venue_type?: VenueTypeFilter;
  search?: string;
}

const API_BASE = '/api';

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? 'Request failed');
  }
  return data as T;
}

export async function countToilets(params: { bbox?: string } = {}): Promise<number> {
  const searchParams = new URLSearchParams();
  if (params.bbox) searchParams.set('bbox', params.bbox);
  const qs = searchParams.toString();
  const path = qs ? `/toilets/count?${qs}` : '/toilets/count';
  const { count } = await fetchApi<{ count: number }>(path);
  return count;
}

export async function listToilets(params: ListToiletsParams = {}): Promise<Toilet[]> {
  const searchParams = new URLSearchParams();
  if (params.bbox) searchParams.set('bbox', params.bbox);
  if (params.category) searchParams.set('category', params.category);
  if (params.verification_status) searchParams.set('verification_status', params.verification_status);
  if (params.venue_type) searchParams.set('venue_type', params.venue_type);
  if (params.search) searchParams.set('search', params.search);
  const qs = searchParams.toString();
  const path = qs ? `/toilets?${qs}` : '/toilets';
  const { toilets } = await fetchApi<{ toilets: Toilet[] }>(path);
  return toilets;
}

export async function getToiletById(id: string): Promise<Toilet> {
  return fetchApi<Toilet>(`/toilets/${id}`);
}

export interface FindNearestParams {
  lat: number;
  lng: number;
  category?: ToiletCategory;
  verification_status?: VerificationStatus;
}

export async function findNearestToilet(params: FindNearestParams): Promise<Toilet> {
  const search = new URLSearchParams();
  search.set('lat', String(params.lat));
  search.set('lng', String(params.lng));
  if (params.category) search.set('category', params.category);
  if (params.verification_status) search.set('verification_status', params.verification_status);
  return fetchApi<Toilet>(`/toilets/nearest?${search.toString()}`);
}

export interface SubmitToiletInput {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: ToiletCategory;
  access_notes?: string | null;
  access_code?: string | null;
  opening_hours?: string | null;
  venue_type?: VenueTypeFilter | null;
  toilet_type?: ToiletType | null;
  payment?: boolean;
  manned?: boolean;
  changing_table?: boolean;
  tap?: boolean;
  needle_container?: boolean;
  contact?: string | null;
  image_url?: string | null;
  placement?: string | null;
  year_round?: boolean;
  round_the_clock?: boolean;
  temporary_closed?: boolean;
}

export interface SubmitToiletResponse {
  id: string;
  status: string;
  message: string;
}

export async function submitToilet(input: SubmitToiletInput): Promise<SubmitToiletResponse> {
  return fetchApi<SubmitToiletResponse>('/submissions', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      category: input.category,
      access_notes: input.access_notes ?? null,
      access_code: input.access_code ?? null,
      opening_hours: input.opening_hours ?? null,
      venue_type: input.venue_type ?? null,
      toilet_type: input.toilet_type ?? null,
      payment: input.payment ?? false,
      manned: input.manned ?? false,
      changing_table: input.changing_table ?? false,
      tap: input.tap ?? false,
      needle_container: input.needle_container ?? false,
      contact: input.contact ?? null,
      image_url: input.image_url ?? null,
      placement: input.placement ?? null,
      year_round: input.year_round !== false,
      round_the_clock: input.round_the_clock ?? false,
      temporary_closed: input.temporary_closed ?? false,
    }),
  });
}

export interface UpdateToiletInput {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  category?: ToiletCategory;
  access_notes?: string | null;
  access_code?: string | null;
  opening_hours?: string | null;
  temporary_closed?: boolean;
  venue_type?: VenueTypeFilter | null;
  toilet_type?: ToiletType | null;
  payment?: boolean;
  manned?: boolean;
  changing_table?: boolean;
  tap?: boolean;
  needle_container?: boolean;
  contact?: string | null;
  image_url?: string | null;
  placement?: string | null;
  year_round?: boolean;
  round_the_clock?: boolean;
}

export async function updateToilet(id: string, input: UpdateToiletInput): Promise<Toilet> {
  return fetchApi<Toilet>(`/toilets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export interface SubmitReportInput {
  toilet_id: string;
  description: string;
}

export interface SubmitReportResponse {
  id: string;
  message: string;
}

export async function submitReport(input: SubmitReportInput): Promise<SubmitReportResponse> {
  return fetchApi<SubmitReportResponse>('/reports', {
    method: 'POST',
    body: JSON.stringify({
      toilet_id: input.toilet_id,
      description: input.description,
    }),
  });
}

export interface SubmitEditSuggestionInput {
  toilet_id: string;
  suggested_fields: Record<string, unknown>;
}

export interface SubmitEditSuggestionResponse {
  id: string;
  message: string;
}

export async function submitEditSuggestion(
  input: SubmitEditSuggestionInput
): Promise<SubmitEditSuggestionResponse> {
  return fetchApi<SubmitEditSuggestionResponse>('/edit-suggestions', {
    method: 'POST',
    body: JSON.stringify({
      toilet_id: input.toilet_id,
      suggested_fields: input.suggested_fields,
    }),
  });
}

export interface DonationInput {
  amount: number;
  currency: 'DKK';
}

export interface DonationResponse {
  success: boolean;
  message: string;
}

export async function submitDonation(input: DonationInput): Promise<DonationResponse> {
  return fetchApi<DonationResponse>('/donation', {
    method: 'POST',
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
    }),
  });
}
