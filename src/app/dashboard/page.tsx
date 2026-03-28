import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your flashcard decks</p>
      </div>
      <div className="flex gap-3">
        <Button>Create Deck</Button>
        <Button variant="outline">Browse Decks</Button>
      </div>
    </div>
  );
}
