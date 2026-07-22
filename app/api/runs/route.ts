import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getRuns } from "@/lib/github"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const runs = await getRuns(session.user.id)
    return NextResponse.json({ runs })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch runs" },
      { status: 500 }
    )
  }
}
