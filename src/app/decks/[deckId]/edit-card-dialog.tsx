"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
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
import { updateCardAction } from "@/actions/cards";

interface EditCardDialogProps {
  card: { id: number; front: string; back: string };
  deckId: number;
}

export function EditCardDialog({ card, deckId }: EditCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFront(card.front);
      setBack(card.back);
      setError(null);
    }
    setOpen(next);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await updateCardAction({ cardId: card.id, deckId, front, back });
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit card</DialogTitle>
          <DialogDescription>
            Update the front and back content of this flashcard.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`front-${card.id}`}>Front</Label>
            <Textarea
              id={`front-${card.id}`}
              placeholder="Question or term…"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              rows={3}
              disabled={isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`back-${card.id}`}>Back</Label>
            <Textarea
              id={`back-${card.id}`}
              placeholder="Answer or definition…"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={3}
              disabled={isPending}
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
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
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
