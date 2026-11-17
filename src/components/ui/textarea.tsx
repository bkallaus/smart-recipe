import * as React from 'react';

import { cn } from '@/lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

// Matches <Input>: solid surface-container-highest fill with a ghost bottom
// border that turns primary on focus. `field-sizing-content` grows the box with
// its text where supported; elsewhere it falls back to `rows` + manual resize.
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 4, ...props }, ref) => {
    return (
      <textarea
        rows={rows}
        className={cn(
          'flex min-h-24 max-h-[70vh] w-full resize-y field-sizing-content border-0 border-b border-[hsl(var(--outline-variant)/0.2)] bg-[hsl(var(--surface-container-highest))] px-4 py-3 text-base leading-relaxed ring-offset-background placeholder:text-[hsl(var(--on-surface-variant)/0.5)] focus-visible:outline-none focus-visible:border-b-2 focus-visible:border-[hsl(var(--primary))] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
