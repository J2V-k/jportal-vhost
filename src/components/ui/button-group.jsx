import * as React from "react"
import { cn } from "@/lib/utils"

export function ButtonGroup({ children, className, orientation = "horizontal", ...props }) {
  return (
    <div
      role="group"
      className={cn(
        "inline-flex items-center rounded-md overflow-hidden",
        orientation === "vertical" ? "flex flex-col" : "",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function ButtonGroupSeparator({ className }) {
  return <div className={cn("w-px h-6 bg-border", className)} aria-hidden />
}

export function ButtonGroupText({ children, className }) {
  return <span className={cn("px-2 text-sm font-medium", className)}>{children}</span>
}

export default ButtonGroup
