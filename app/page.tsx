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
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Threadbase CI Dashboard</CardTitle>
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
