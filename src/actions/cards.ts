"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDeckById } from "@/db/queries/decks";
import { createCard, updateCard, deleteCard, getCardsByDeck } from "@/db/queries/cards";

const CARDS_PER_DECK_LIMIT = 15;

const createCardSchema = z.object({
  deckId: z.number().int().positive(),
  front: z.string().min(1, "Front is required"),
  back: z.string().min(1, "Back is required"),
});

const updateCardSchema = z.object({
  cardId: z.number().int().positive(),
  deckId: z.number().int().positive(),
  front: z.string().min(1, "Front is required"),
  back: z.string().min(1, "Back is required"),
});

const deleteCardSchema = z.object({
  cardId: z.number().int().positive(),
  deckId: z.number().int().positive(),
});

type CreateCardInput = z.infer<typeof createCardSchema>;
type UpdateCardInput = z.infer<typeof updateCardSchema>;
type DeleteCardInput = z.infer<typeof deleteCardSchema>;

export async function createCardAction(data: CreateCardInput) {
  const { userId, has } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = createCardSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input");

  const { deckId, front, back } = parsed.data;

  const deck = await getDeckById(deckId, userId);
  if (!deck) throw new Error("Deck not found");

  const hasUnlimitedDecks = has({ feature: "unlimited_decks" });
  if (!hasUnlimitedDecks) {
    const existingCards = await getCardsByDeck(deckId);
    if (existingCards.length >= CARDS_PER_DECK_LIMIT) {
      throw new Error(
        `Free plan limit: ${CARDS_PER_DECK_LIMIT} cards per deck. Upgrade to Pro for unlimited cards.`,
      );
    }
  }

  await createCard(deckId, front, back);

  revalidatePath(`/decks/${deckId}`);
}

export async function updateCardAction(data: UpdateCardInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = updateCardSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input");

  const { cardId, deckId, front, back } = parsed.data;

  const deck = await getDeckById(deckId, userId);
  if (!deck) throw new Error("Deck not found");

  await updateCard(cardId, deckId, front, back);

  revalidatePath(`/decks/${deckId}`);
}

export async function deleteCardAction(data: DeleteCardInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = deleteCardSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input");

  const { cardId, deckId } = parsed.data;

  const deck = await getDeckById(deckId, userId);
  if (!deck) throw new Error("Deck not found");

  await deleteCard(cardId, deckId);

  revalidatePath(`/decks/${deckId}`);
}
