import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";

export function OrderTimeline({ steps }: { steps: { label: string; at: string; done: boolean }[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((step, index) => (
        <li key={step.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold",
                step.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {step.done ? <Check className="size-3.5" /> : index + 1}
            </span>
            {index < steps.length - 1 && <span className="h-full w-px flex-1 bg-border" />}
          </div>
          <div className="pb-4">
            <p className={cn("text-sm font-medium", !step.done && "text-muted-foreground")}>{step.label}</p>
            {step.at && <p className="text-xs text-muted-foreground">{formatDateTime(step.at)}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
