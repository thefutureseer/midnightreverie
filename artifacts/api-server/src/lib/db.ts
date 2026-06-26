import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  hasTicket: boolean;
}

const users = new Map<string, User>();
const usersByEmail = new Map<string, User>();

export const db = {
  users: {
    findByEmail(email: string): User | undefined {
      return usersByEmail.get(email.toLowerCase());
    },
    findById(id: string): User | undefined {
      return users.get(id);
    },
    create(data: { name: string; email: string; passwordHash: string; hasTicket?: boolean }): User {
      const user: User = {
        id: randomUUID(),
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        hasTicket: data.hasTicket ?? false,
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
  },
};

export function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    hasTicket: user.hasTicket,
  };
}

async function seed() {
  const SALT = await bcrypt.genSalt(10);
  const hash123 = await bcrypt.hash("password123", SALT);

  db.users.create({
    name: "Viewer",
    email: "viewer@test.com",
    passwordHash: hash123,
    hasTicket: true,
  });

  db.users.create({
    name: "Window Shopper",
    email: "windowshopper@test.com",
    passwordHash: hash123,
    hasTicket: false,
  });
}

seed().catch(() => {});
