"use client";

import { UserButton, useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { SignInBtn, SignUpBtn } from "@/components/auth-buttons";

export function HeaderUserSection() {
  const { userId, has } = useAuth();
  const { user } = useUser();

  const isPaidPro = has?.({ plan: "pro" }) ?? false;
  const adminGranted =
    (user?.publicMetadata as { adminGranted?: boolean } | undefined)
      ?.adminGranted === true;
  const isPro = isPaidPro || adminGranted;
  const isAdmin =
    (user?.publicMetadata as { role?: string } | undefined)?.role === "admin";

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
      {isAdmin && (
        <Link
          href="/admin"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Admin
        </Link>
      )}
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
