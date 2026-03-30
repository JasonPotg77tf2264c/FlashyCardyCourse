"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function StudyLink({ deckId }: { deckId: number }) {
  return (
    <Link
      href={`/decks/${deckId}/study`}
      className={buttonVariants({ variant: "default" })}
    >
      Study
    </Link>
  );
}
