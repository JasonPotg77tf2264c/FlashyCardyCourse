"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { put, del } from "@vercel/blob";
import { getDeckById } from "@/db/queries/decks";
import { createCard, updateCard, deleteCard, getCardById, getCardsByDeck, bulkCreateCards, deleteAllCards } from "@/db/queries/cards";

const CARDS_PER_DECK_LIMIT = 15;

const createCardSchema = z
  .object({
    deckId: z.number().int().positive(),
    front: z.string(),
    frontImageUrl: z.string().url().nullable().optional(),
    back: z.string(),
    backImageUrl: z.string().url().nullable().optional(),
  })
  .refine((d) => d.front.trim().length > 0 || !!d.frontImageUrl, {
    message: "Front must have text or an image",
    path: ["front"],
  })
  .refine((d) => d.back.trim().length > 0 || !!d.backImageUrl, {
    message: "Back must have text or an image",
    path: ["back"],
  });

const updateCardSchema = z
  .object({
    cardId: z.number().int().positive(),
    deckId: z.number().int().positive(),
    front: z.string(),
    frontImageUrl: z.string().url().nullable().optional(),
    back: z.string(),
    backImageUrl: z.string().url().nullable().optional(),
    oldFrontImageUrl: z.string().url().nullable().optional(),
    oldBackImageUrl: z.string().url().nullable().optional(),
  })
  .refine((d) => d.front.trim().length > 0 || !!d.frontImageUrl, {
    message: "Front must have text or an image",
    path: ["front"],
  })
  .refine((d) => d.back.trim().length > 0 || !!d.backImageUrl, {
    message: "Back must have text or an image",
    path: ["back"],
  });

const uploadCardImageSchema = z.object({
  deckId: z.number().int().positive(),
});

const deleteCardSchema = z.object({
  cardId: z.number().int().positive(),
  deckId: z.number().int().positive(),
});

const generateCardsSchema = z.object({
  deckId: z.number().int().positive(),
});

type CreateCardInput = {
  deckId: number;
  front: string;
  frontImageUrl?: string | null;
  back: string;
  backImageUrl?: string | null;
};
type UpdateCardInput = {
  cardId: number;
  deckId: number;
  front: string;
  frontImageUrl?: string | null;
  back: string;
  backImageUrl?: string | null;
  oldFrontImageUrl?: string | null;
  oldBackImageUrl?: string | null;
};
type DeleteCardInput = z.infer<typeof deleteCardSchema>;
type GenerateCardsInput = z.infer<typeof generateCardsSchema>;
type UploadCardImageInput = z.infer<typeof uploadCardImageSchema>;

export async function uploadCardImageAction(
  data: UploadCardImageInput,
  formData: FormData,
): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = uploadCardImageSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input");

  const { deckId } = parsed.data;

  const deck = await getDeckById(deckId, userId);
  if (!deck) throw new Error("Deck not found");

  const file = formData.get("image");
  if (!(file instanceof File)) throw new Error("No image file provided");

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be under 5 MB");
  }

  const blob = await put(`card-images/${userId}/${deckId}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return blob.url;
}

export async function createCardAction(data: CreateCardInput) {
  const { userId, has } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = createCardSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    throw new Error(firstError?.message ?? "Invalid input");
  }

  const { deckId, front, frontImageUrl, back, backImageUrl } = parsed.data;

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

  await createCard(
    deckId,
    front.trim() || null,
    frontImageUrl ?? null,
    back.trim() || null,
    backImageUrl ?? null,
  );

  revalidatePath(`/decks/${deckId}`);
}

export async function updateCardAction(data: UpdateCardInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = updateCardSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    throw new Error(firstError?.message ?? "Invalid input");
  }

  const {
    cardId,
    deckId,
    front,
    frontImageUrl,
    back,
    backImageUrl,
    oldFrontImageUrl,
    oldBackImageUrl,
  } = parsed.data;

  const deck = await getDeckById(deckId, userId);
  if (!deck) throw new Error("Deck not found");

  if (oldFrontImageUrl && oldFrontImageUrl !== frontImageUrl) {
    try {
      await del(oldFrontImageUrl);
    } catch {
      // Silently ignore deletion errors — card update should still succeed
    }
  }

  if (oldBackImageUrl && oldBackImageUrl !== backImageUrl) {
    try {
      await del(oldBackImageUrl);
    } catch {
      // Silently ignore deletion errors — card update should still succeed
    }
  }

  await updateCard(
    cardId,
    deckId,
    front.trim() || null,
    frontImageUrl ?? null,
    back.trim() || null,
    backImageUrl ?? null,
  );

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

  const card = await getCardById(cardId, deckId);
  if (card?.frontImageUrl) {
    try {
      await del(card.frontImageUrl);
    } catch {
      // Silently ignore deletion errors
    }
  }
  if (card?.backImageUrl) {
    try {
      await del(card.backImageUrl);
    } catch {
      // Silently ignore deletion errors
    }
  }

  await deleteCard(cardId, deckId);

  revalidatePath(`/decks/${deckId}`);
}

const deleteAllCardsSchema = z.object({
  deckId: z.number().int().positive(),
});

type DeleteAllCardsInput = z.infer<typeof deleteAllCardsSchema>;

export async function deleteAllCardsAction(data: DeleteAllCardsInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = deleteAllCardsSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input");

  const { deckId } = parsed.data;

  const deck = await getDeckById(deckId, userId);
  if (!deck) throw new Error("Deck not found");

  await deleteAllCards(deckId);

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
    system: `You are a flashcard generation assistant. Infer the subject matter and purpose of the deck from its name and description, then generate cards in the format that best suits the topic.

For **problem-solving, mathematical, or computational topics** (e.g. algebra, calculus, geometry, trigonometry, statistics, physics, chemistry, programming algorithms, logic puzzles, financial calculations):
- Put a clear problem or question on the front
- On the back, show the complete step-by-step working out using EXACTLY this uniform format (use plain newlines between each element, no markdown, no bullet points):

Step 1: [Brief label describing the action]
[The computation or reasoning for this step]
Step 2: [Brief label describing the action]
[The computation or reasoning for this step]
(continue for as many steps as needed)
Answer: [The final result]

For **non-problem-solving topics** (vocabulary, definitions, historical facts, concepts, language learning):
- A term or concept on the front with a concise definition or explanation on the back
- Keep both sides brief and direct

Rules:
- NEVER use markdown formatting (no **, no *, no #, no backticks) in any card
- NEVER use bullet points or dashes in step-by-step cards
- Use the step-by-step format ONLY when the topic genuinely requires working through a process
- Let the deck name and description determine which format to use`,
    prompt: `Generate 20 flashcards for the following deck: ${topic}`,
  });

  await bulkCreateCards(deckId, output.cards);

  revalidatePath(`/decks/${deckId}`);
}
