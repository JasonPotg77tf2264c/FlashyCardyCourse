"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { SignInBtn, SignUpBtn } from "@/components/auth-buttons";

export function HeaderUserSection() {
  const { userId, has } = useAuth();
  const isPro = has?.({ plan: "pro" }) ?? false;

  if (!userId) {
    return (
      <>
        <SignInBtn size="sm" />
        <SignUpBtn size="sm" />
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={isPro ? "default" : "secondary"}
        className="text-xs font-semibold tracking-wide"
      >
        {isPro ? "Pro" : "Free"}
      </Badge>
      <UserButton />
    </div>
  );
}
