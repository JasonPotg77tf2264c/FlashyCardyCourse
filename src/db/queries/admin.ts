import { db } from "@/db";
import { decks, cards } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";

export async function getAdminOverviewStats() {
  const [deckStats] = await db
    .select({ totalDecks: count(decks.id) })
    .from(decks);

  const [cardStats] = await db
    .select({ totalCards: count(cards.id) })
    .from(cards);

  return {
    totalDecks: deckStats?.totalDecks ?? 0,
    totalCards: cardStats?.totalCards ?? 0,
  };
}

export async function getDeckStatsByUser(): Promise<
  { userId: string; deckCount: number; cardCount: number }[]
> {
  const rows = await db
    .select({
      userId: decks.userId,
      deckCount: count(decks.id),
      cardCount: sql<number>`cast(count(${cards.id}) as integer)`,
    })
    .from(decks)
    .leftJoin(cards, eq(cards.deckId, decks.id))
    .groupBy(decks.userId);

  return rows.map((r) => ({
    userId: r.userId,
    deckCount: r.deckCount,
    cardCount: Number(r.cardCount),
  }));
}
