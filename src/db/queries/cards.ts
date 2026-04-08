import { db } from "@/db";
import { cards } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function getCardsByDeck(deckId: number) {
  return db
    .select()
    .from(cards)
    .where(eq(cards.deckId, deckId))
    .orderBy(desc(cards.updatedAt));
}

export async function createCard(deckId: number, front: string, back: string) {
  return db.insert(cards).values({ deckId, front, back });
}

export async function updateCard(cardId: number, deckId: number, front: string, back: string) {
  return db
    .update(cards)
    .set({ front, back, updatedAt: new Date() })
    .where(and(eq(cards.id, cardId), eq(cards.deckId, deckId)));
}

export async function deleteCard(cardId: number, deckId: number) {
  return db
    .delete(cards)
    .where(and(eq(cards.id, cardId), eq(cards.deckId, deckId)));
}

export async function bulkCreateCards(
  deckId: number,
  cardList: { front: string; back: string }[],
) {
  return db.insert(cards).values(cardList.map((c) => ({ deckId, ...c })));
}
