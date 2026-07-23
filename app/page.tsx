import Image from "next/image"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SignInButton } from "@/components/sign-in-button"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect("/dashboard")

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm border-border bg-card/80 shadow-[0_14px_40px_rgba(0,0,0,0.55)] backdrop-blur">
        <CardHeader className="items-center text-center">
          <Image
            src="/threadbase-icon.svg"
            alt=""
            width={56}
            height={56}
            className="mb-2 rounded-[13px]"
            priority
          />
          <CardTitle className="text-lg tracking-[-0.01em]">Threadbase CI Dashboard</CardTitle>
          <CardDescription>
            Sign in to trigger and monitor threadbase-mobile deploys.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInButton />
        </CardContent>
      </Card>
    </main>
  )
}
