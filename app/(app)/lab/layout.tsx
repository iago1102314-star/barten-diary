import { isProd } from "@/lib/env/app-env";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export default function LabLayout({ children }: { children: ReactNode }) {
  if (isProd) {
    notFound();
  }

  return children;
}
