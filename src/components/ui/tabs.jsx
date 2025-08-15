import * as React from "react"
import { cn } from "../../lib/utils"

export function Tabs({ defaultValue, children, className }) {
  const [value, setValue] = React.useState(defaultValue)
  return (
    <div className={cn("w-full", className)}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { value, setValue })
      )}
    </div>
  )
}

export function TabsList({ children, className, value, setValue }) {
  return (
    <div className={cn("flex", className)}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { value, setValue })
      )}
    </div>
  )
}

export function TabsTrigger({ children, value: tabValue, value: currentValue, setValue }) {
  const isActive = currentValue === tabValue
  return (
    <button onClick={() => setValue(tabValue)} className={cn(isActive && "bg-primary text-primary-foreground")}>
      {children}
    </button>
  )
}

export function TabsContent({ children, value, value: tabValue }) {
  if (value !== tabValue) return null
  return <div>{children}</div>
}
