import type { Metadata } from "next";

import { ProgressDashboard } from "@/components/progress-dashboard";

export const metadata: Metadata = { title: "Meu progresso" };

export default function ProgressPage() {
  return <ProgressDashboard />;
}
