import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forwardRef } from "react";

export const InputWithLabel = forwardRef(
  (
    props: {
      label?: string;
      id?: string;
    } & React.InputHTMLAttributes<HTMLInputElement>,
    ref: React.Ref<HTMLInputElement>
  ) => {
    return (
      <div className="grid w-full max-w-sm items-center gap-1.5">
        {props.label && <Label htmlFor={props.id}>{props.label}</Label>}
        <Input id={props.id} ref={ref} {...props} />
      </div>
    );
  }
);
