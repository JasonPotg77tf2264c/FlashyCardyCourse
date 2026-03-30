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
import { getDecksByUser } from "@/db/queries/decks";
import { AddDeckDialog } from "@/components/add-deck-dialog";
import { DeleteDeckButton } from "@/components/delete-deck-button";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const decks = await getDecksByUser(userId);

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your flashcard decks</p>
        </div>
        <AddDeckDialog />
      </div>

      {decks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-20 text-center">
          <p className="text-muted-foreground text-sm">You have no decks yet.</p>
          <AddDeckDialog triggerLabel="Create your first deck" />
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
                  <CardFooter className="text-muted-foreground text-xs">
                    Updated {deck.updatedAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
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
    </div>
  );
}
