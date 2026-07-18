import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  currentStep: number; // 0-indexed
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <ol className="flex items-center gap-1 overflow-x-auto pb-1">
        {steps.map((label, index) => {
          const done = index < currentStep;
          const active = index === currentStep;
          return (
            <li key={label} className="flex items-center gap-1 shrink-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold shrink-0",
                    done && "bg-primary text-primary-foreground",
                    active && !done && "bg-secondary text-secondary-foreground ring-2 ring-primary",
                    !done && !active && "bg-muted text-muted-foreground"
                  )}
                >
                  {done ? <Check className="size-3.5" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "text-xs whitespace-nowrap hidden sm:inline",
                    active ? "font-medium text-foreground" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <span className="mx-1 h-px w-6 bg-border shrink-0" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
