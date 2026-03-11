import { forwardRef, useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const InputWithLabel = forwardRef(
  (
    props: {
      label?: string;
      id?: string;
    } & React.InputHTMLAttributes<HTMLInputElement>,
    ref: React.Ref<HTMLInputElement>,
  ) => {
    const generatedId = useId();
    const inputId = props.id || props.name || generatedId;

    return (
      <div className='grid w-full max-w-md items-center gap-1.5'>
        {props.label && <Label htmlFor={inputId}>{props.label}</Label>}
        <Input {...props} id={inputId} ref={ref} />
      </div>
    );
  },
);
