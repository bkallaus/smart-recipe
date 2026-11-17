import { forwardRef, type ReactNode, useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type FieldProps = {
  label?: string;
  id?: string;
  error?: string;
};

const errorClasses =
  'border-destructive border-b-2 focus-visible:border-destructive';

/**
 * Shared label + control + error layout. Always resolves an id (generating one
 * when the caller passes none) so the label is associated with its control and
 * the error text is linked through aria-describedby.
 */
const useFieldIds = (id: string | undefined) => {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return { fieldId, errorId: `${fieldId}-error` };
};

const FieldShell = ({
  fieldId,
  errorId,
  label,
  error,
  children,
}: {
  fieldId: string;
  errorId: string;
  label?: string;
  error?: string;
  children: ReactNode;
}) => (
  <div className='grid w-full max-w-2xl items-start gap-2'>
    {label ? (
      <Label
        htmlFor={fieldId}
        className='text-sm font-bold uppercase tracking-widest text-[hsl(var(--on-surface-variant))] pl-1'
      >
        {label}
      </Label>
    ) : null}
    {children}
    {error ? (
      <p id={errorId} className='text-xs font-medium text-destructive pl-1'>
        {error}
      </p>
    ) : null}
  </div>
);

const describedBy = (
  existing: string | undefined,
  errorId: string,
  error: string | undefined,
) => [existing, error ? errorId : undefined].filter(Boolean).join(' ') || undefined;

export const InputWithLabel = forwardRef<
  HTMLInputElement,
  FieldProps & React.InputHTMLAttributes<HTMLInputElement>
>(({ label, id, error, className, ...inputProps }, ref) => {
  const { fieldId, errorId } = useFieldIds(id);
  return (
    <FieldShell fieldId={fieldId} errorId={errorId} label={label} error={error}>
      <Input
        {...inputProps}
        id={fieldId}
        ref={ref}
        aria-invalid={error ? true : inputProps['aria-invalid']}
        aria-describedby={describedBy(
          inputProps['aria-describedby'],
          errorId,
          error,
        )}
        className={cn(className, error && errorClasses)}
      />
    </FieldShell>
  );
});
InputWithLabel.displayName = 'InputWithLabel';

export const TextareaWithLabel = forwardRef<
  HTMLTextAreaElement,
  FieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ label, id, error, className, ...textareaProps }, ref) => {
  const { fieldId, errorId } = useFieldIds(id);
  return (
    <FieldShell fieldId={fieldId} errorId={errorId} label={label} error={error}>
      <Textarea
        {...textareaProps}
        id={fieldId}
        ref={ref}
        aria-invalid={error ? true : textareaProps['aria-invalid']}
        aria-describedby={describedBy(
          textareaProps['aria-describedby'],
          errorId,
          error,
        )}
        className={cn(className, error && errorClasses)}
      />
    </FieldShell>
  );
});
TextareaWithLabel.displayName = 'TextareaWithLabel';
