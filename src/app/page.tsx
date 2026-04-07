import { Show } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInBtn, SignUpBtn } from "@/components/auth-buttons";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-5xl font-bold tracking-tight">FlashyCardy</h1>
        <p className="text-lg text-muted-foreground">
          Supercharge your learning with flashcards
        </p>
        <Show when="signed-out">
          <div className="flex gap-3 mt-4">
            <SignInBtn />
            <SignUpBtn />
          </div>
        </Show>
      </div>
    </div>
  );
}
