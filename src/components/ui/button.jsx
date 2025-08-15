import * as React from "react"
import { cn } from "../../lib/utils"

export function Button({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
  }
  return (
    <button
      className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2", variants[variant], className)}
      {...props}
    />
  )
}
