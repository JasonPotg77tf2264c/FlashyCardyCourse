"use client";

import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function SignInBtn({ size }: { size?: "default" | "sm" | "lg" | "xs" }) {
  const { openSignIn } = useClerk();
  return (
    <Button variant="outline" size={size} onClick={() => openSignIn({})}>
      Sign In
    </Button>
  );
}

export function SignUpBtn({ size }: { size?: "default" | "sm" | "lg" | "xs" }) {
  const { openSignUp } = useClerk();
  return (
    <Button size={size} onClick={() => openSignUp({})}>
      Sign Up
    </Button>
  );
}
