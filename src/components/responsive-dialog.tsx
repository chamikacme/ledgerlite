"use client"

import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"

export function ResponsiveDialog({
  children,
  ...props
}: React.ComponentProps<typeof Dialog>) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return <Dialog {...props}>{children}</Dialog>
  }

  return <Drawer {...props}>{children}</Drawer>
}

export function ResponsiveDialogTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogTrigger>) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return <DialogTrigger className={className} {...props}>{children}</DialogTrigger>
  }

  return <DrawerTrigger className={className} {...props}>{children}</DrawerTrigger>
}

export function ResponsiveDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <DialogContent className={className} {...props}>
        {children}
      </DialogContent>
    )
  }

  return (
    <DrawerContent className={className} {...props}>
      <div className="w-full mt-4 p-4 pb-8">
        {children}
      </div>
    </DrawerContent>
  )
}

export function ResponsiveDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return <DialogHeader className={className} {...props} />
  }

  return <DrawerHeader className={className} {...props} />
}

export function ResponsiveDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogTitle>) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return <DialogTitle className={className} {...props} />
  }

  return <DrawerTitle className={className} {...props} />
}

export function ResponsiveDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return <DialogDescription className={className} {...props} />
  }

  return <DrawerDescription className={className} {...props} />
}

export function ResponsiveDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return <DialogFooter className={className} {...props} />
  }

  return <DrawerFooter className={className} {...props} />
}

export function ResponsiveDialogClose({
    ...props
  }: React.ComponentProps<typeof DialogClose>) {
    const isDesktop = useMediaQuery("(min-width: 768px)")
  
    if (isDesktop) {
      return <DialogClose {...props} />
    }
  
    return <DrawerClose {...props} />
  }
