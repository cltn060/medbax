"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { useUserSync } from "@/lib/use-user-sync"; // Import the hook

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function AuthWrapper({ children }: { children: ReactNode }) {
  useUserSync();
  return <>{children}</>;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      signInForceRedirectUrl="/onboarding"
      signUpForceRedirectUrl="/onboarding"
      appearance={{
        elements: {
          modalBackdrop: "items-center justify-center",
          modalContent: "mx-auto",
        }
      }}
    >
      <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
        <AuthWrapper>{children}</AuthWrapper>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}