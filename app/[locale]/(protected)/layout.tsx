import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/lucia";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return <>{children}</>;
}