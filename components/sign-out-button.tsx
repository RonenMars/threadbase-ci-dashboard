"use client"
import { signOut } from "next-auth/react"
import { SignOutIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

export function SignOutButton(): React.JSX.Element {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-muted-foreground hover:text-foreground"
    >
      <SignOutIcon />
      <span className="hidden sm:inline">Sign out</span>
    </Button>
  )
}
