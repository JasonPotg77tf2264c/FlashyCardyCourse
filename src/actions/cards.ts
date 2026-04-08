"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { getDeckById } from "@/db/queries/decks";
import { createCard, updateCard, deleteCard, getCardsByDeck, bulkCreateCards } from "@/db/queries/cards";

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

const generateCardsSchema = z.object({
  deckId: z.number().int().positive(),
});

type CreateCardInput = z.infer<typeof createCardSchema>;
type UpdateCardInput = z.infer<typeof updateCardSchema>;
type DeleteCardInput = z.infer<typeof deleteCardSchema>;
type GenerateCardsInput = z.infer<typeof generateCardsSchema>;

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

export async function generateCardsAction(data: GenerateCardsInput) {
  const { userId, has } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const canUseAI = has({ feature: "ai_flashcard_generation" });
  if (!canUseAI) throw new Error("AI flashcard generation requires a Pro plan.");

  const parsed = generateCardsSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input");

  const { deckId } = parsed.data;

  const deck = await getDeckById(deckId, userId);
  if (!deck) throw new Error("Deck not found");

  const topic = deck.description
    ? `${deck.name}: ${deck.description}`
    : deck.name;

  const { output } = await generateText({
    model: openai("gpt-4o"),
    output: Output.object({
      schema: z.object({
        cards: z.array(
          z.object({
            front: z.string(),
            back: z.string(),
          }),
        ),
      }),
    }),
    system: `You are a flashcard generation assistant. Infer the subject matter and purpose of the deck from its name and description, then generate cards in the format that best serves that topic. Always use the simplest, most direct format for the content — for example:
- A question on the front with a concise answer on the back
- A term or concept on the front with its definition or explanation on the back
- A problem or prompt on the front with the solution or key point on the back

Do not assume any particular subject area or card style. Let the deck name and description guide you. Never pad cards with unnecessary context or elaboration. Keep both sides as brief and direct as the subject allows.`,
    prompt: `Generate 20 flashcards for the following deck: ${topic}`,
  });

  await bulkCreateCards(deckId, output.cards);

  revalidatePath(`/decks/${deckId}`);
}
