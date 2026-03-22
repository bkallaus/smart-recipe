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
      <div className="grid w-full max-w-md items-center gap-1.5">
        {props.label && <Label htmlFor={props.id}>{props.label}</Label>}
        <Input 
          id={props.id} 
          ref={ref} 
          {...props} 
          className={cn(props.className, props.error && "border-destructive focus-visible:ring-destructive")}
        />
        {props.error && <p className="text-xs text-destructive">{props.error}</p>}
      </div>
    );
  }
);
