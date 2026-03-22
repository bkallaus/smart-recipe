import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export const InputWithLabel = forwardRef(
  (
    props: {
      label?: string;
      id?: string;
      error?: string;
    } & React.InputHTMLAttributes<HTMLInputElement>,
    ref: React.Ref<HTMLInputElement>
  ) => {
    return (
      <div className="grid w-full max-w-2xl items-start gap-2">
        {props.label && (
          <Label 
            htmlFor={props.id} 
            className="text-sm font-bold uppercase tracking-widest text-[hsl(var(--on-surface-variant))] pl-1"
          >
            {props.label}
          </Label>
        )}
        <Input 
          id={props.id} 
          ref={ref} 
          {...props} 
          className={cn(props.className, props.error && "border-destructive border-b-2 focus-visible:border-destructive")}
        />
        {props.error && <p className="text-xs font-medium text-destructive pl-1">{props.error}</p>}
      </div>
    );
  }
);
