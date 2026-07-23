import Image from "next/image"
import Link from "next/link"
import { SignOutButton } from "@/components/sign-out-button"
import { canDeploy, isAdmin } from "@/lib/roles"
import type { Role } from "@/lib/roles"

type AppHeaderProps = Readonly<{
  role: Role
  name: string | null
  image: string | null
}>

export function AppHeader({ role, name, image }: AppHeaderProps): React.JSX.Element {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-(--tb-ink-4)/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-6">
        <Link href="/history" className="flex items-center gap-2.5">
          <Image src="/threadbase-icon.svg" alt="" width={26} height={26} className="rounded-[7px]" />
          <span className="text-sm font-semibold tracking-[-0.01em]">Threadbase CI</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {canDeploy(role) && (
            <Link href="/dashboard" className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              Deploy
            </Link>
          )}
          <Link href="/history" className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            History
          </Link>
          {isAdmin(role) && (
            <Link href="/admin" className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              Admin
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {name} · <span className="uppercase tracking-[0.08em]">{role}</span>
          </span>
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-7 w-7 rounded-full border border-border" />
          )}
          <SignOutButton />
        </div>
      </div>
    </header>
  )
}
