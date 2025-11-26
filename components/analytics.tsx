"use client";

import { Analytics } from "@vercel/analytics/next";

export function ClientAnalytics() {
  // Solo renderizar en producción
  if (process.env.NODE_ENV !== "production") {
    return null;
  }
  
  return <Analytics />;
}