"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCardAction } from "@/actions/cards";

interface AddCardDialogProps {
  deckId: number;
  trigger?: React.ReactElement;
  isAtLimit?: boolean;
}

export function AddCardDialog({ deckId, trigger, isAtLimit = false }: AddCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (isAtLimit) {
    return (
      <Link href="/pricing" className={buttonVariants({ variant: "outline", size: "sm" })}>
        Upgrade for more cards
      </Link>
    );
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFront("");
      setBack("");
      setError(null);
    }
    setOpen(next);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await createCardAction({ deckId, front, back });
        setOpen(false);
        setFront("");
        setBack("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger !== undefined ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger render={<Button variant="outline" />}>
          + Add Card
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a new card</DialogTitle>
          <DialogDescription>
            Enter the front and back content for your flashcard.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="front">Front</Label>
            <Textarea
              id="front"
              placeholder="Question or term…"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              rows={3}
              disabled={isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="back">Back</Label>
            <Textarea
              id="back"
              placeholder="Answer or definition…"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={3}
              disabled={isPending}
            />
          </div>
          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !front.trim() || !back.trim()}
          >
            {isPending ? "Adding…" : "Add Card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
