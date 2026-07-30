import { cn } from "@/lib/cn";

export function QuantumMark({ className }: { className?: string }) {
  return (
    <span className={cn("quantum-mark", className)} aria-hidden="true">
      <span className="quantum-mark__orbit quantum-mark__orbit--a" />
      <span className="quantum-mark__orbit quantum-mark__orbit--b" />
      <span className="quantum-mark__core" />
    </span>
  );
}
