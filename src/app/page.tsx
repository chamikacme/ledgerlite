import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4 text-center">
      <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-blue-900 sm:text-6xl">
        LedgerLite
      </h1>
      <p className="mb-8 max-w-lg text-lg text-gray-600">
        Master your finances with our simple, double-entry budgeting tool.
        Track every penny, set goals, and achieve financial freedom.
      </p>
      <div className="flex gap-4">
        <Link href="/sign-in">
          <Button size="lg">Get Started</Button>
        </Link>
        <Link href="/sign-up">
          <Button variant="outline" size="lg">
            Create Account
          </Button>
        </Link>
      </div>
    </div>
  );
}
