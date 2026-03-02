import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function LandingPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/home");
  }

  redirect("/login");
}
