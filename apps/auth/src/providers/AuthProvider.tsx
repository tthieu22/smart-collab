"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@auth/hooks/useAuth";
import { Loading } from "@auth/components/ui/loading";
import { ROUTES } from "@auth/lib/constants";
import { useUserStore } from "@auth/store/user";
import { useAuthStore } from "@auth/store/auth";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const { isUserInitialized } = useUserStore();
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (isInitialized ) {
      if (!accessToken) {
        router.replace(ROUTES.LOGIN);
      } else if (isUserInitialized) {
        if ( !user) {
          router.replace(ROUTES.LOGIN);
        }
      }
    }
  }, [isInitialized, isUserInitialized, accessToken, user, router]);

  if (!isInitialized) {
    return <Loading text=" " />;
  }

  return <>{children}</>;
};
