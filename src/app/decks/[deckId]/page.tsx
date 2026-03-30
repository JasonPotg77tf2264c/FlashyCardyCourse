import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
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
import { StudyLink } from "./study-link";

interface DeckPageProps {
  params: Promise<{ deckId: string }>;
}

export default async function DeckPage({ params }: DeckPageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const { deckId } = await params;
  const id = Number(deckId);
  if (isNaN(id)) notFound();

  const [deck, cards] = await Promise.all([
    getDeckById(id, userId),
    getCardsByDeck(id),
  ]);

  if (!deck) notFound();

  return (
    <div className="flex flex-1 flex-col gap-8 p-8">
      {/* Deck section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
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
          <div className="flex gap-2">
            <EditDeckDialog deck={deck} />
            {cards.length > 0 ? (
              <StudyLink deckId={id} />
            ) : (
              <Button disabled>Study</Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {cards.length} card{cards.length !== 1 ? "s" : ""}
          </Badge>
          <span className="text-muted-foreground text-xs">
            Last updated{" "}
            {deck.updatedAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Cards section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cards</h2>
          <AddCardDialog deckId={id} />
        </div>

        {cards.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-20 text-center">
            <p className="text-muted-foreground text-sm">
              This deck has no cards yet.
            </p>
            <AddCardDialog
              deckId={id}
              trigger={<Button>Add your first card</Button>}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <Card key={card.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Front
                  </p>
                  <p className="text-foreground font-medium">{card.front}</p>
                </CardHeader>
                <CardContent className="flex-1 pb-2">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Back
                  </p>
                  <p className="text-foreground mt-1 text-sm">{card.back}</p>
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
