// src/components/ui/loader-button.tsx
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "./spinner";
import { type VariantProps } from "class-variance-authority"

// Instead of importing ButtonProps, we define it here using React standard types
// and the variant props from your button config.
interface LoaderButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof Button> {
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const LoaderButton = React.forwardRef<HTMLButtonElement, LoaderButtonProps>(
  ({ isLoading, icon, children, disabled, className, variant, size, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={isLoading || disabled}
        variant={variant}
        size={size}
        className={className}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Spinner />
            <span>Please wait</span>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            {icon && <span className="mr-2">{icon}</span>}
            {children}
          </div>
        )}
      </Button>
    )
  }
)
LoaderButton.displayName = "LoaderButton"

export { LoaderButton }