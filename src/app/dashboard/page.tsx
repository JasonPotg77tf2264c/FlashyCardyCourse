import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getDecksByUser } from "@/db/queries/decks";
import { AddDeckDialog } from "@/components/add-deck-dialog";
import { DeleteDeckButton } from "@/components/delete-deck-button";

const DECK_LIMIT = 3;
const CARDS_PER_DECK_LIMIT = 15;

export default async function DashboardPage() {
  const { userId, has } = await auth();
  if (!userId) redirect("/");

  const decks = await getDecksByUser(userId);

  const hasUnlimitedDecks = has({ feature: "unlimited_decks" });
  const isPro = has({ plan: "pro" });
  const isFreePlan = !hasUnlimitedDecks;
  const isAtLimit = isFreePlan && decks.length >= DECK_LIMIT;
  const deckUsagePercent = isFreePlan
    ? Math.min((decks.length / DECK_LIMIT) * 100, 100)
    : 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your flashcard decks</p>
        </div>
        <AddDeckDialog isAtLimit={isAtLimit} />
      </div>

      {/* Free plan usage banner */}
      {isFreePlan && (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Usage card */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Free Plan Usage
                </CardTitle>
                <Badge variant="secondary" className="text-xs">Free</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Decks</span>
                  <span className="text-muted-foreground tabular-nums">
                    {decks.length} / {DECK_LIMIT}
                  </span>
                </div>
                <Progress value={deckUsagePercent} />
              </div>
              <p className="text-xs text-muted-foreground">
                Each deck is limited to{" "}
                <span className="text-foreground font-semibold">
                  {CARDS_PER_DECK_LIMIT} cards
                </span>{" "}
                on the Free plan.
              </p>
              {isAtLimit && (
                <p className="text-xs text-destructive font-medium">
                  You&apos;ve reached the 3-deck limit. Upgrade to add more.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Pro upgrade card */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Upgrade to Pro
                </CardTitle>
                <Badge className="text-xs">Pro</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1.5 text-sm">
                <li className="flex items-center gap-2 text-foreground">
                  <span className="text-primary">✓</span>
                  <span>Unlimited decks</span>
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <span className="text-primary">✓</span>
                  <span>Unlimited cards per deck</span>
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <span className="text-primary">✓</span>
                  <span>AI flashcard generation</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link
                href="/pricing"
                className={buttonVariants({ size: "sm" }) + " w-full justify-center"}
              >
                View Pro Plans
              </Link>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* At limit alert */}
      {isAtLimit && (
        <Alert>
          <AlertTitle>Deck limit reached</AlertTitle>
          <AlertDescription>
            Free plan allows up to{" "}
            <strong>{DECK_LIMIT} decks</strong> with{" "}
            <strong>{CARDS_PER_DECK_LIMIT} cards</strong> per deck.{" "}
            <Link href="/pricing" className="underline underline-offset-3 hover:text-foreground">
              Upgrade to Pro
            </Link>{" "}
            for unlimited decks and cards.
          </AlertDescription>
        </Alert>
      )}

      {/* Deck grid */}
      {decks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-20 text-center">
          <p className="text-muted-foreground text-sm">You have no decks yet.</p>
          <AddDeckDialog triggerLabel="Create your first deck" isAtLimit={isAtLimit} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <div key={deck.id} className="relative">
              <Link href={`/decks/${deck.id}`} className="block">
                <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
                  <CardHeader className="pr-12">
                    <CardTitle>{deck.name}</CardTitle>
                    <CardDescription>
                      {deck.description ?? "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent />
                  <CardFooter className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">
                      Updated{" "}
                      {deck.updatedAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {isFreePlan && (
                      <span className="text-muted-foreground text-xs">
                        Up to {CARDS_PER_DECK_LIMIT} cards
                      </span>
                    )}
                  </CardFooter>
                </Card>
              </Link>
              <div className="absolute top-3 right-3">
                <DeleteDeckButton deckId={deck.id} deckName={deck.name} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pro plan — already subscribed */}
      {isPro && (
        <p className="text-xs text-muted-foreground text-center">
          You&apos;re on the <span className="text-foreground font-medium">Pro plan</span> — enjoy unlimited decks and cards.
        </p>
      )}
    </div>
  );
}
