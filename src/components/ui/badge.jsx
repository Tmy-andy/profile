import * as React from "react"
import { cn } from "../../lib/utils"

export function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground"
  }
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", variants[variant], className)} {...props} />
  )
}
