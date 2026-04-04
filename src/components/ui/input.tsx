import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full border-0 border-b border-[hsl(var(--outline-variant)/0.2)] bg-[hsl(var(--surface-container-highest))] px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[hsl(var(--on-surface-variant)/0.5)] focus-visible:outline-none focus-visible:border-b-2 focus-visible:border-[hsl(var(--primary))] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
