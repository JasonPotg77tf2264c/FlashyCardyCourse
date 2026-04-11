import { auth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminOverviewStats, getDeckStatsByUser } from "@/db/queries/admin";
import { Users, LayoutDashboard, CreditCard, Layers } from "lucide-react";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

function formatDate(date: Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const [{ data: clerkUsers, totalCount }, dbStats, deckStatsByUser] =
    await Promise.all([
      clerkClient.users.getUserList({ limit: 500, orderBy: "-created_at" }),
      getAdminOverviewStats(),
      getDeckStatsByUser(),
    ]);

  // Verify admin role from the live Clerk API — sessionClaims can lag after
  // publicMetadata is updated in the Dashboard until the JWT rotates.
  const currentUser = clerkUsers.find((u) => u.id === userId);
  const liveRole = (currentUser?.publicMetadata as { role?: string })?.role;
  if (liveRole !== "admin") redirect("/dashboard");

  const statsByUserId = new Map(
    deckStatsByUser.map((s) => [s.userId, s]),
  );

  const proUserCount = clerkUsers.filter(
    (u) =>
      (u.publicMetadata as { plan?: string })?.plan === "pro" ||
      (u.publicMetadata as { stripe_subscription_status?: string })
        ?.stripe_subscription_status === "active",
  ).length;

  const statsCards = [
    {
      label: "Total Users",
      value: totalCount,
      icon: Users,
      description: "Registered accounts",
    },
    {
      label: "Total Decks",
      value: dbStats.totalDecks,
      icon: Layers,
      description: "Across all users",
    },
    {
      label: "Total Cards",
      value: dbStats.totalCards,
      icon: CreditCard,
      description: "Flashcards created",
    },
    {
      label: "Pro Users",
      value: proUserCount,
      icon: LayoutDashboard,
      description: "Active subscriptions",
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage all users across FlashyCardy
        </p>
      </div>

      {/* Overview stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map(({ label, value, icon: Icon, description }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Decks</TableHead>
                <TableHead className="text-right">Cards</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Sign-in</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clerkUsers.map((user) => {
                const primaryEmail = user.emailAddresses.find(
                  (e) => e.id === user.primaryEmailAddressId,
                )?.emailAddress;

                const fullName =
                  [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                  user.username ||
                  "—";

                const userStats = statsByUserId.get(user.id);
                const deckCount = userStats?.deckCount ?? 0;
                const cardCount = userStats?.cardCount ?? 0;

                const isAdmin =
                  (user.publicMetadata as { role?: string })?.role === "admin";
                const isPro =
                  (user.publicMetadata as { plan?: string })?.plan === "pro";

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        {fullName}
                        {isAdmin && (
                          <Badge variant="destructive" className="text-xs py-0">
                            Admin
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {primaryEmail ?? "—"}
                    </TableCell>
                    <TableCell>
                      {isPro ? (
                        <Badge className="text-xs">Pro</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Free
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {deckCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {cardCount}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(new Date(user.createdAt))}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.lastSignInAt
                        ? formatDate(new Date(user.lastSignInAt))
                        : "Never"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
