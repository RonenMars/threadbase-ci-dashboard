"use client"
import { signOut } from "next-auth/react"
import { SignOutIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

type SignOutButtonProps = Readonly<{
  showLabel?: boolean
}>

export function SignOutButton({ showLabel = false }: SignOutButtonProps): React.JSX.Element {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-muted-foreground hover:text-foreground"
    >
      <SignOutIcon />
      <span className={showLabel ? "inline" : "hidden sm:inline"}>Sign out</span>
    </Button>
  )
}
