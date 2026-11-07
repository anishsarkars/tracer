"use client";

import { usePathname } from "next/navigation";
import { Shell } from "./Shell";

/** Home uses the full-bleed descent landing; all other routes keep the app shell. */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") {
    return <>{children}</>;
  }
  return <Shell>{children}</Shell>;
}
