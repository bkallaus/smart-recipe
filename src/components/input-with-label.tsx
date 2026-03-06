import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forwardRef, useId } from "react";

export const InputWithLabel = forwardRef(
  (
    props: {
      label?: string;
      id?: string;
    } & React.InputHTMLAttributes<HTMLInputElement>,
    ref: React.Ref<HTMLInputElement>
  ) => {
    const generatedId = useId();
    const id = props.id || props.name || generatedId;

    return (
      <div className="grid w-full max-w-md items-center gap-1.5">
        {props.label && <Label htmlFor={id}>{props.label}</Label>}
        <Input id={id} ref={ref} {...props} />
      </div>
    );
  }
);
