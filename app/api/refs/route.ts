import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getRefs } from "@/lib/github"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const refs = await getRefs(session.user.id)
    return NextResponse.json(refs)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch refs" },
      { status: 500 }
    )
  }
}
