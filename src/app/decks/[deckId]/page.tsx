import { redirect, notFound } from "next/navigation";
import { getAccessContext } from "@/lib/access";
import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDeckById } from "@/db/queries/decks";
import { getCardsByDeck } from "@/db/queries/cards";
import { AddCardDialog } from "./add-card-dialog";
import { EditCardDialog } from "./edit-card-dialog";
import { DeleteCardDialog } from "./delete-card-dialog";
import { EditDeckDialog } from "./edit-deck-dialog";
import { DeleteAllCardsDialog } from "./delete-all-cards-dialog";
import { StudyLink } from "./study-link";
import { GenerateCardsButton } from "./generate-cards-button";
import { getCardsPerDeckLimit } from "@/lib/deck-limits";

interface DeckPageProps {
  params: Promise<{ deckId: string }>;
}

export default async function DeckPage({ params }: DeckPageProps) {
  const { userId, hasUnlimitedDecks, hasAI } = await getAccessContext();
  if (!userId) redirect("/");

  const { deckId } = await params;
  const id = Number(deckId);
  if (isNaN(id)) notFound();

  const deck = await getDeckById(id, userId);
  if (!deck) notFound();

  const cards = await getCardsByDeck(id);

  const aiGeneratedCount = cards.filter((c) => c.aiGenerated).length;
  const isFreePlan = !hasUnlimitedDecks;
  const deckCardLimit = getCardsPerDeckLimit(hasUnlimitedDecks);
  const isAtCardLimit = cards.length >= deckCardLimit;

  return (
    <div className="flex flex-1 flex-col gap-8 p-8">
      {/* Deck section */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              ← Dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">{deck.name}</h1>
            {deck.description && (
              <p className="text-muted-foreground mt-1">{deck.description}</p>
            )}
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <GenerateCardsButton
              deckId={id}
              hasDescription={!!deck.description}
              totalCardCount={cards.length}
              aiGeneratedCount={aiGeneratedCount}
              hasAI={hasAI}
              hasUnlimitedDecks={hasUnlimitedDecks}
            />
            <div className="flex flex-wrap gap-2">
              <EditDeckDialog deck={deck} />
              {cards.length > 0 && (
                <DeleteAllCardsDialog deckId={id} cardCount={cards.length} />
              )}
              {cards.length > 0 ? (
                <StudyLink deckId={id} />
              ) : (
                <Button disabled>Study</Button>
              )}
            </div>
          </div>
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="text-foreground font-medium tabular-nums">
            {cards.length} / {deckCardLimit} cards
            <span className="text-muted-foreground font-normal">
              {" "}
              ({isFreePlan ? "Free plan" : "Pro plan"})
            </span>
          </span>
          <span aria-hidden className="select-none">
            ·
          </span>
          <span>
            Last updated{" "}
            {deck.updatedAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        {isAtCardLimit && (
          <p className="text-destructive text-xs">
            {isFreePlan ? (
              <>
                Card limit reached for this deck ({deckCardLimit} max on Free).{" "}
                <Link href="/pricing" className="underline underline-offset-3">
                  Upgrade to Pro
                </Link>{" "}
                for up to {getCardsPerDeckLimit(true)} cards per deck.
              </>
            ) : (
              <>
                Card limit reached for this deck ({deckCardLimit} max on Pro). Delete cards to add
                more.
              </>
            )}
          </p>
        )}
      </div>

      {/* Cards section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cards</h2>
          <AddCardDialog deckId={id} isAtLimit={isAtCardLimit} />
        </div>

        {cards.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-20 text-center">
            <p className="text-muted-foreground text-sm">
              This deck has no cards yet.
            </p>
            <AddCardDialog
              deckId={id}
              isAtLimit={isAtCardLimit}
              trigger={<Button>Add your first card</Button>}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <Card key={card.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Front
                    </p>
                    {card.aiGenerated && (
                      <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[10px] font-normal">
                        <Sparkles className="size-3 text-primary" />
                        AI
                      </Badge>
                    )}
                  </div>
                  {card.front && (
                    <p className="text-foreground font-medium">{card.front}</p>
                  )}
                  {card.frontImageUrl && (
                    <div className="mt-1 rounded-md overflow-hidden border border-border">
                      <Image
                        src={card.frontImageUrl}
                        alt="Front image"
                        width={400}
                        height={160}
                        className="w-full object-cover max-h-28"
                      />
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-1 pb-2">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Back
                  </p>
                  {card.back && (
                    <p className="text-foreground mt-1 text-sm">{card.back}</p>
                  )}
                  {card.backImageUrl && (
                    <div className="mt-2 rounded-md overflow-hidden border border-border">
                      <Image
                        src={card.backImageUrl}
                        alt="Back image"
                        width={400}
                        height={160}
                        className="w-full object-cover max-h-28"
                      />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-2">
                  <EditCardDialog card={card} deckId={id} />
                  <DeleteCardDialog cardId={card.id} deckId={id} />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
