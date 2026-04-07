import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { SignInBtn, SignUpBtn } from "@/components/auth-buttons";

export async function HeaderUserSection() {
  const { userId, has } = await auth();

  if (!userId) {
    return (
      <>
        <SignInBtn size="sm" />
        <SignUpBtn size="sm" />
      </>
    );
  }

  const isPro = has({ plan: "pro" });

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
