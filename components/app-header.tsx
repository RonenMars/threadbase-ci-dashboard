import Image from "next/image"
import Link from "next/link"
import { MobileNav } from "@/components/mobile-nav"
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
    <header className="sticky top-0 z-50 overflow-x-clip border-b border-border bg-(--tb-ink-4)/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full min-w-0 max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Link href="/history" className="flex min-w-0 shrink items-center gap-2.5">
          <Image src="/threadbase-icon.svg" alt="" width={26} height={26} className="shrink-0 rounded-[7px]" />
          <span className="truncate text-sm font-semibold tracking-[-0.01em]">Threadbase CI</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm sm:flex" aria-label="Primary">
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

        <div className="ml-auto hidden items-center gap-3 sm:flex">
          <span className="text-xs text-muted-foreground">
            {name} · <span className="uppercase tracking-[0.08em]">{role}</span>
          </span>
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-7 w-7 rounded-full border border-border" />
          )}
          <SignOutButton />
        </div>

        <MobileNav role={role} name={name} image={image} />
      </div>
    </header>
  )
}
