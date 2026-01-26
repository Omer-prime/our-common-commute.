"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "@/src/lib/authStorage"; // adjust if your path differs

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();

    const isAdmin =
      auth?.user?.role === "ADMIN" && !!auth?.accessToken;

    router.replace(isAdmin ? "/admin/dashboard" : "/admin/login");
  }, [router]);

  return null; // or a small loader UI
}
