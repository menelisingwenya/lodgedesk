import { supabase } from "./supabase";

export interface Property {
  id: string;
  name: string;
  created_at?: string;
}

export interface Branch {
  id: string;
  property_id: string;
  slug: string;
  name: string;
  address: string | null;
  directions: string | null;
  is_open: boolean;
  created_at?: string;
}

export interface RoomType {
  id: string;
  property_id: string;
  slug: string;
  name: string;
  description: string | null;
}

export interface BranchRoomType {
  branch_id: string;
  room_type_id: string;
  room_count: number;
  price_usd: number | null;
  price_confirmed: boolean;
  price_note: string | null;
  updated_at?: string;
}

export interface LodgeData {
  properties: Property[];
  branches: Branch[];
  roomTypes: RoomType[];
  branchRoomTypes: BranchRoomType[];
}

export async function loadProperties(): Promise<Property[]> {
  const { data, error } = await supabase.from("properties").select("*");
  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function loadBranches(): Promise<Branch[]> {
  const { data, error } = await supabase.from("branches").select("*").order("name");
  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function loadRoomTypes(): Promise<RoomType[]> {
  const { data, error } = await supabase.from("room_types").select("*").order("name");
  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function loadBranchRoomTypes(): Promise<BranchRoomType[]> {
  const { data, error } = await supabase.from("branch_room_types").select("*");
  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function loadLodgeData(): Promise<LodgeData> {
  const [propertiesRes, branchesRes, roomTypesRes, branchRoomTypesRes] = await Promise.all([
    supabase.from("properties").select("*"),
    supabase.from("branches").select("*").order("name"),
    supabase.from("room_types").select("*").order("name"),
    supabase.from("branch_room_types").select("*"),
  ]);

  if (propertiesRes.error) {
    console.error(propertiesRes.error.message);
    throw new Error(propertiesRes.error.message);
  }
  if (branchesRes.error) {
    console.error(branchesRes.error.message);
    throw new Error(branchesRes.error.message);
  }
  if (roomTypesRes.error) {
    console.error(roomTypesRes.error.message);
    throw new Error(roomTypesRes.error.message);
  }
  if (branchRoomTypesRes.error) {
    console.error(branchRoomTypesRes.error.message);
    throw new Error(branchRoomTypesRes.error.message);
  }

  return {
    properties: propertiesRes.data ?? [],
    branches: branchesRes.data ?? [],
    roomTypes: roomTypesRes.data ?? [],
    branchRoomTypes: branchRoomTypesRes.data ?? [],
  };
}

export async function getSinglePropertyId(): Promise<string> {
  const properties = await loadProperties();
  if (properties.length === 0) {
    const msg = "No property found in database.";
    console.error(msg);
    throw new Error(msg);
  }
  return properties[0].id;
}

export async function addBranch(params: {
  name: string;
  slug: string;
  address?: string | null;
  directions?: string | null;
  is_open?: boolean;
  property_id?: string;
}): Promise<Branch> {
  const propertyId = params.property_id || (await getSinglePropertyId());
  const { data, error } = await supabase
    .from("branches")
    .insert({
      property_id: propertyId,
      name: params.name.trim(),
      slug: params.slug.trim(),
      address: params.address?.trim() || null,
      directions: params.directions?.trim() || null,
      is_open: params.is_open ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function updateBranchIsOpen(branchId: string, isOpen: boolean): Promise<void> {
  const { error } = await supabase
    .from("branches")
    .update({ is_open: isOpen })
    .eq("id", branchId);

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }
}

export async function addRoomType(params: {
  name: string;
  slug: string;
  description?: string | null;
  property_id?: string;
}): Promise<RoomType> {
  const propertyId = params.property_id || (await getSinglePropertyId());
  const { data, error } = await supabase
    .from("room_types")
    .insert({
      property_id: propertyId,
      name: params.name.trim(),
      slug: params.slug.trim(),
      description: params.description?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function saveBranchRoomType(params: {
  branch_id: string;
  room_type_id: string;
  room_count: number;
  price_usd?: number | null;
  price_confirmed?: boolean;
  price_note?: string | null;
}): Promise<void> {
  const priceUsd =
    params.price_usd !== undefined && params.price_usd !== null && !isNaN(params.price_usd)
      ? Number(params.price_usd)
      : null;
  const priceConfirmed = priceUsd !== null ? Boolean(params.price_confirmed) : false;

  const { error } = await supabase.from("branch_room_types").upsert(
    {
      branch_id: params.branch_id,
      room_type_id: params.room_type_id,
      room_count: Math.max(1, Math.floor(params.room_count)),
      price_usd: priceUsd,
      price_confirmed: priceConfirmed,
      price_note: params.price_note?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "branch_id,room_type_id" }
  );

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }
}

