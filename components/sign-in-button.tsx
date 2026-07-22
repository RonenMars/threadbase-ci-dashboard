"use client"
import { signIn } from "next-auth/react"
import { GithubLogoIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

export function SignInButton(): React.JSX.Element {
  return (
    <Button
      className="w-full"
      onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
    >
      <GithubLogoIcon weight="fill" />
      Sign in with GitHub
    </Button>
  )
}
