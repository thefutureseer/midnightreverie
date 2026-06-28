import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  hasTicket: boolean;
  isHost: boolean;
}

export interface Venue {
  id: string;
  hostId: string;
  venueName: string;
  capacitySeats: number;
  description: string | null;
  images: string[];
  ticketPriceChargedByHost: number;
  performerName: string | null;
  showDate: string | null;
  showTime: string | null;
  location: string | null;
  createdAt: string;
}

export interface WatchPartyTicket {
  id: string;
  venueId: string;
  guestName: string;
  guestEmail: string;
  purchasedAtPrice: number;
  hasAccess: boolean;
  createdAt: string;
}

// ── Tiers ───────────────────────────────────────────────────────────────────

export interface TierInfo {
  tierLabel: string;
  currentPrice: number;
  ticketsSold: number;
  nextTierAt: number | null;
  discount: number;
}

export function calculateTier(basePrice: number, ticketsSold: number): TierInfo {
  let discount: number;
  let tierLabel: string;
  let nextTierAt: number | null;

  if (ticketsSold >= 50) {
    discount = 30;
    tierLabel = "Tier 4 — Sold Out Deal";
    nextTierAt = null;
  } else if (ticketsSold >= 25) {
    discount = 20;
    tierLabel = "Tier 3 — Group Rate";
    nextTierAt = 50;
  } else if (ticketsSold >= 10) {
    discount = 10;
    tierLabel = "Tier 2 — Early Crowd";
    nextTierAt = 25;
  } else {
    discount = 0;
    tierLabel = "Tier 1 — Opening Night";
    nextTierAt = 10;
  }

  const currentPrice = parseFloat((basePrice * (1 - discount / 100)).toFixed(2));
  return { tierLabel, currentPrice, ticketsSold, nextTierAt, discount };
}

// ── In-memory stores ─────────────────────────────────────────────────────────

const users = new Map<string, User>();
const usersByEmail = new Map<string, User>();
const venues = new Map<string, Venue>();
const watchPartyTickets = new Map<string, WatchPartyTicket>();

// venueId → array of ticket IDs
const ticketsByVenue = new Map<string, string[]>();
// venueId+email → ticketId
const ticketByVenueEmail = new Map<string, string>();

// ── Platform revenue log ────────────────────────────────────────────────────

interface RevenueLog {
  timestamp: string;
  type: "license" | "guest_ticket";
  hostId: string;
  venueId?: string;
  amount: number;
  description: string;
}
const revenueLog: RevenueLog[] = [];

export const PLATFORM_TICKET_CUT = 0.03; // 3%
export const HOST_LICENSE_FEE = 15.0;

export function logRevenue(entry: RevenueLog) {
  revenueLog.push(entry);
}

// ── Database API ─────────────────────────────────────────────────────────────

export const db = {
  users: {
    findByEmail(email: string): User | undefined {
      return usersByEmail.get(email.toLowerCase());
    },
    findById(id: string): User | undefined {
      return users.get(id);
    },
    create(data: {
      name: string;
      email: string;
      passwordHash: string;
      hasTicket?: boolean;
      isHost?: boolean;
    }): User {
      const user: User = {
        id: randomUUID(),
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        hasTicket: data.hasTicket ?? false,
        isHost: data.isHost ?? false,
      };
      users.set(user.id, user);
      usersByEmail.set(user.email, user);
      return user;
    },
    grantTicket(id: string): User | undefined {
      const user = users.get(id);
      if (!user) return undefined;
      user.hasTicket = true;
      return user;
    },
    grantHostLicense(id: string): User | undefined {
      const user = users.get(id);
      if (!user) return undefined;
      user.isHost = true;
      return user;
    },
  },

  venues: {
    findById(id: string): Venue | undefined {
      return venues.get(id);
    },
    listByHost(hostId: string): Venue[] {
      return Array.from(venues.values()).filter((v) => v.hostId === hostId);
    },
    create(data: {
      hostId: string;
      venueName: string;
      capacitySeats: number;
      description?: string | null;
      images?: string[];
      ticketPriceChargedByHost: number;
      performerName?: string | null;
      showDate?: string | null;
      showTime?: string | null;
      location?: string | null;
    }): Venue {
      const venue: Venue = {
        id: randomUUID(),
        hostId: data.hostId,
        venueName: data.venueName,
        capacitySeats: data.capacitySeats,
        description: data.description ?? null,
        images: data.images ?? [],
        ticketPriceChargedByHost: data.ticketPriceChargedByHost,
        performerName: data.performerName ?? null,
        showDate: data.showDate ?? null,
        showTime: data.showTime ?? null,
        location: data.location ?? null,
        createdAt: new Date().toISOString(),
      };
      venues.set(venue.id, venue);
      ticketsByVenue.set(venue.id, []);
      return venue;
    },
  },

  watchPartyTickets: {
    findById(id: string): WatchPartyTicket | undefined {
      return watchPartyTickets.get(id);
    },
    findByVenueAndEmail(venueId: string, email: string): WatchPartyTicket | undefined {
      const key = `${venueId}:${email.toLowerCase()}`;
      const id = ticketByVenueEmail.get(key);
      return id ? watchPartyTickets.get(id) : undefined;
    },
    countByVenue(venueId: string): number {
      return (ticketsByVenue.get(venueId) ?? []).length;
    },
    listByVenue(venueId: string): WatchPartyTicket[] {
      return (ticketsByVenue.get(venueId) ?? [])
        .map((id) => watchPartyTickets.get(id))
        .filter(Boolean) as WatchPartyTicket[];
    },
    create(data: {
      venueId: string;
      guestName: string;
      guestEmail: string;
      purchasedAtPrice: number;
    }): WatchPartyTicket {
      const ticket: WatchPartyTicket = {
        id: randomUUID(),
        venueId: data.venueId,
        guestName: data.guestName,
        guestEmail: data.guestEmail.toLowerCase(),
        purchasedAtPrice: data.purchasedAtPrice,
        hasAccess: true,
        createdAt: new Date().toISOString(),
      };
      watchPartyTickets.set(ticket.id, ticket);
      const list = ticketsByVenue.get(data.venueId) ?? [];
      list.push(ticket.id);
      ticketsByVenue.set(data.venueId, list);
      const key = `${data.venueId}:${ticket.guestEmail}`;
      ticketByVenueEmail.set(key, ticket.id);
      return ticket;
    },
  },

  revenue: {
    log: revenueLog,
    totalForHost(hostId: string): { guestRevenue: number; platformRevenue: number } {
      let guestRevenue = 0;
      let platformRevenue = 0;
      for (const entry of revenueLog) {
        if (entry.hostId !== hostId) continue;
        if (entry.type === "license") {
          platformRevenue += entry.amount;
        } else if (entry.type === "guest_ticket") {
          guestRevenue += entry.amount;
          platformRevenue += parseFloat((entry.amount * PLATFORM_TICKET_CUT).toFixed(2));
        }
      }
      return { guestRevenue, platformRevenue };
    },
    summaryByVenue(venueId: string): { guestRevenue: number; platformCut: number } {
      let guestRevenue = 0;
      let platformCut = 0;
      for (const entry of revenueLog) {
        if (entry.venueId !== venueId || entry.type !== "guest_ticket") continue;
        guestRevenue += entry.amount;
        platformCut += parseFloat((entry.amount * PLATFORM_TICKET_CUT).toFixed(2));
      }
      return { guestRevenue, platformCut };
    },
  },
};

// ── Public projections ───────────────────────────────────────────────────────

export function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    hasTicket: user.hasTicket,
    isHost: user.isHost,
  };
}

export function toVenuePublic(venue: Venue): object {
  const ticketsSold = db.watchPartyTickets.countByVenue(venue.id);
  const seatsRemaining = Math.max(0, venue.capacitySeats - ticketsSold);
  const tierInfo = calculateTier(venue.ticketPriceChargedByHost, ticketsSold);
  return {
    id: venue.id,
    hostId: venue.hostId,
    venueName: venue.venueName,
    capacitySeats: venue.capacitySeats,
    description: venue.description,
    images: venue.images,
    ticketPriceChargedByHost: venue.ticketPriceChargedByHost,
    performerName: venue.performerName,
    showDate: venue.showDate,
    showTime: venue.showTime,
    location: venue.location,
    createdAt: venue.createdAt,
    ticketsSold,
    seatsRemaining,
    tierInfo,
  };
}

// ── Seed data ────────────────────────────────────────────────────────────────

async function seed() {
  const hash = await bcrypt.hash("password123", 10);

  // Regular ticket holder
  db.users.create({ name: "Viewer", email: "viewer@test.com", passwordHash: hash, hasTicket: true });

  // No ticket yet
  db.users.create({ name: "Window Shopper", email: "windowshopper@test.com", passwordHash: hash, hasTicket: false });

  // Licensed host
  const host = db.users.create({
    name: "Demo Host",
    email: "host@test.com",
    passwordHash: hash,
    hasTicket: false,
    isHost: true,
  });

  // Log the $15 license fee for Demo Host
  logRevenue({
    timestamp: new Date().toISOString(),
    type: "license",
    hostId: host.id,
    amount: HOST_LICENSE_FEE,
    description: `Host license purchased by ${host.email}`,
  });

  // Pre-configured venue: Gary Owen at Bob Hope Theatre
  const venue = db.venues.create({
    hostId: host.id,
    venueName: "Gary Owen Live — Watch Party",
    capacitySeats: 200,
    description:
      "Watch Gary Owen bring the house down at the historic Bob Hope Theatre in Stockton, CA — streamed live, exclusively for ticketed watch party guests.",
    images: [
      "https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=800&q=80",
      "https://images.unsplash.com/photo-1516307365426-bea591f05011?w=800&q=80",
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
    ],
    ticketPriceChargedByHost: 25.0,
    performerName: "Gary Owen",
    showDate: "Thursday, August 28, 2026",
    showTime: "7:00 PM PST",
    location: "Bob Hope Theatre, Stockton, CA",
  });

  // 3 pre-sold tickets (puts us at Tier 1, approaching Tier 2 threshold)
  const seedGuests = [
    { name: "Alice Johnson", email: "alice@example.com" },
    { name: "Marcus Webb",   email: "marcus@example.com" },
    { name: "Priya Sharma",  email: "priya@example.com" },
  ];

  for (const guest of seedGuests) {
    const tierInfo = calculateTier(venue.ticketPriceChargedByHost, db.watchPartyTickets.countByVenue(venue.id));
    const ticket = db.watchPartyTickets.create({
      venueId: venue.id,
      guestName: guest.name,
      guestEmail: guest.email,
      purchasedAtPrice: tierInfo.currentPrice,
    });
    logRevenue({
      timestamp: new Date().toISOString(),
      type: "guest_ticket",
      hostId: host.id,
      venueId: venue.id,
      amount: ticket.purchasedAtPrice,
      description: `Ticket sold to ${guest.email} at $${ticket.purchasedAtPrice} — Midnight Reverie receives 3% ($${(ticket.purchasedAtPrice * PLATFORM_TICKET_CUT).toFixed(2)})`,
    });
  }
}

seed().catch(() => {});
