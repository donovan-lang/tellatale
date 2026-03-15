"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChroniclesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/read?tab=chronicles");
  }, [router]);
  return null;
}
