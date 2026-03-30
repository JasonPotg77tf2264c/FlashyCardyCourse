import { db } from "@/db";
import { decks } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function getDecksByUser(userId: string) {
  return db.select().from(decks).where(eq(decks.userId, userId));
}

export async function getDeckById(deckId: number, userId: string) {
  const rows = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)));
  return rows[0] ?? null;
}

export async function createDeck(
  userId: string,
  name: string,
  description?: string,
) {
  return db.insert(decks).values({ userId, name, description });
}

export async function updateDeck(
  deckId: number,
  userId: string,
  name: string,
  description?: string,
) {
  return db
    .update(decks)
    .set({ name, description, updatedAt: new Date() })
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)));
}

export async function deleteDeck(deckId: number, userId: string) {
  return db
    .delete(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)));
}
