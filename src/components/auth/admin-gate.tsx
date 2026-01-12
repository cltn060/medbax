"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { Loader2 } from "lucide-react"; // install lucide-react if missing

export default function AdminGate({ children }: { children: ReactNode }) {
  const router = useRouter();

  // 1. Fetch the current user (this is the API we just wrote)
  const user = useQuery(api.users.current);

  // 2. Logic to handle redirects
  useEffect(() => {
    // If we finished loading (user !== undefined) AND the user is not an admin
    if (user !== undefined && user?.role !== "admin") {
      router.push("/dashboard"); // Kick them back to the patient dashboard
    }
  }, [user, router]);

  // 3. Loading State (Show a spinner while we check permissions)
  if (user === undefined) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 4. Access Denied State (Prevent flash of admin content)
  if (user?.role !== "admin") {
    return null;
  }

  // 5. Access Granted
  return <>{children}</>;
}