export type EnquiryStatus = "new" | "handoff" | "contacted" | "closed";

export type MessageRole = "guest" | "assistant" | "staff";

/** The branch names used on guest enquiries. */
export type BranchName =
  | "Zim Harris"
  | "London"
  | "Silver Sands"
  | "Northend"
  | "Clark"
  | "Park 2"
  | "Executive"
  | "Prime Harris"
  | "Park Guesthouse"
  | "Qatha"
  | "Sunone";

/** The room types guests can enquire about. */
export type RoomType =
  | "Standard"
  | "Upper Standard"
  | "Executive"
  | "Deluxe"
  | "Executive Deluxe"
  | "Double Deluxe";

export interface Message {
  id: string;
  role: MessageRole;
  author?: string;
  text: string;
  time: string;
}

export interface Enquiry {
  id: string;
  ref: string;
  guest: string;
  initials: string;
  channel: "Web chat";
  branch: BranchName;
  room: RoomType;
  arrival: string;
  departure: string;
  nights: number;
  guests: number;
  /** Nightly rate in USD, or null when the room type has no confirmed price yet. */
  rate: number | null;
  /** Quoted total in USD, or null when the rate is unconfirmed. */
  total: number | null;
  status: EnquiryStatus;
  handoffReason?: string;
  updated: string;
  unread: boolean;
  preview: string;
  summary: string;
  messages: Message[];
}

export const STATUS_META: Record<EnquiryStatus, { label: string; tone: string }> = {
  new: { label: "New", tone: "gold" },
  handoff: { label: "Handed off", tone: "rose" },
  contacted: { label: "Contacted", tone: "mint" },
  closed: { label: "Closed", tone: "slate" },
};

export interface RoomCatalogEntry {
  name: string;
  sleeps: string;
  rate: number;
  unit: string;
  branches: number;
  occupancy: number;
  note: string;
}

export const ROOMS: RoomCatalogEntry[] = [
  {
    name: "Standard Room",
    sleeps: "2 adults",
    rate: 65,
    unit: "per night",
    branches: 11,
    occupancy: 72,
    note: "Rainfall shower · Wi-Fi · DSTV",
  },
  {
    name: "Deluxe Room",
    sleeps: "2 adults",
    rate: 95,
    unit: "per night",
    branches: 9,
    occupancy: 84,
    note: "Garden view · lounge · marble bath",
  },
  {
    name: "Executive Room",
    sleeps: "2 adults",
    rate: 135,
    unit: "per night",
    branches: 6,
    occupancy: 68,
    note: "Private study · VIP concierge",
  },
  {
    name: "Conference Room",
    sleeps: "Up to 80",
    rate: 480,
    unit: "per day",
    branches: 4,
    occupancy: 41,
    note: "4K display · AV · banquet catering",
  },
];

export interface Branch {
  name: string;
  area: string;
  rooms: number;
  open: number;
  occupancy: number;
  is_open: boolean;
}

export const BRANCHES: Branch[] = [
  { name: "Northend", area: "Northend, Bulawayo", rooms: 24, open: 1, occupancy: 78, is_open: true },
  { name: "Sunone", area: "Sunone, Bulawayo", rooms: 18, open: 1, occupancy: 71, is_open: true },
  {
    name: "Prime Harris",
    area: "City centre, Bulawayo",
    rooms: 32,
    open: 1,
    occupancy: 86,
    is_open: true,
  },
  { name: "Zim Harris", area: "Belmont, Bulawayo", rooms: 16, open: 0, occupancy: 64, is_open: true },
  { name: "Qatha", area: "Qatha, Bulawayo", rooms: 20, open: 1, occupancy: 69, is_open: true },
  { name: "Clark", area: "Clark, Bulawayo", rooms: 22, open: 0, occupancy: 81, is_open: true },
  {
    name: "Romney Park",
    area: "Romney Park, Bulawayo",
    rooms: 14,
    open: 1,
    occupancy: 74,
    is_open: true,
  },
  {
    name: "Silver Sands",
    area: "Silver Sands, Bulawayo",
    rooms: 26,
    open: 1,
    occupancy: 66,
    is_open: true,
  },
  { name: "Villa", area: "Villa, Bulawayo", rooms: 12, open: 1, occupancy: 58, is_open: true },
  { name: "Executive", area: "Executive, Bulawayo", rooms: 16, open: 1, occupancy: 77, is_open: true },
  { name: "London", area: "London, United Kingdom", rooms: 14, open: 0, occupancy: 62, is_open: true },
];
