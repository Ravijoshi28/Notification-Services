import dotenv from "dotenv";
import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

dotenv.config({ quiet: true });

export function createDatabase(url = process.env.DATABASE_URL) {
    if (!url) throw new Error("Set DATABASE_URL in server/.env first.");
    const adapter = new PrismaPg({ connectionString: url, connectionTimeoutMillis: 5000 });
    return new PrismaClient({ adapter });
}

export const prisma = createDatabase();
