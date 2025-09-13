"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@auth/services/auth.service";
import { Loading } from "@auth/components/ui/loading";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      authService.oauthExchange(code).then(() => {
        router.push("/dashboard");
      });
    }
  }, [searchParams, router]);

  return <Loading text="Đăng nhập thành công! Đang chuyển hướng" />;
}
