"use client"

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { History, Rocket, Shield } from "lucide-react"
import { Divide as Hamburger } from "hamburger-react"
import { SignOutButton } from "@/components/sign-out-button"
import { canDeploy, isAdmin } from "@/lib/roles"
import type { Role } from "@/lib/roles"

type MobileNavProps = Readonly<{
  role: Role
  name: string | null
  image: string | null
}>

type NavLink = {
  id: "deploy" | "history" | "admin"
  href: string
  label: string
  Icon: React.ElementType
}

const EASE = [0.22, 1, 0.36, 1] as const

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: EASE } },
} as const

const panelVariants = {
  hidden: { x: "-100%" },
  visible: {
    x: 0,
    transition: {
      duration: 0.4,
      ease: EASE,
      when: "beforeChildren",
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    x: "-100%",
    transition: { duration: 0.28, ease: EASE },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE } },
  exit: {
    opacity: 0,
    x: -12,
    transition: { duration: 0.15, ease: EASE },
  },
} as const

export function MobileNav({ role, name, image }: MobileNavProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const panelId = useId()

  const links = useMemo((): NavLink[] => {
    const items: NavLink[] = []
    if (canDeploy(role)) {
      items.push({ id: "deploy", href: "/dashboard", label: "Deploy", Icon: Rocket })
    }
    items.push({ id: "history", href: "/history", label: "History", Icon: History })
    if (isAdmin(role)) {
      items.push({ id: "admin", href: "/admin", label: "Admin", Icon: Shield })
    }
    return items
  }, [role])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
        return
      }

      if (event.key !== "Tab") return

      // Query on each Tab rather than caching — the panel's list is small
      // and this stays correct as items mount/unmount.
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      } else if (!panelRef.current?.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  useEffect(() => {
    if (open) {
      firstLinkRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    const media = window.matchMedia("(min-width: 640px)")
    function onChange() {
      if (media.matches) setOpen(false)
    }
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  const close = useCallback(() => setOpen(false), [])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className={`fixed start-5 top-5 z-60 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card/85 text-muted-foreground shadow-lg backdrop-blur transition-[border-color,color,box-shadow,transform,opacity] duration-300 ease-out hover:border-primary hover:text-foreground hover:shadow-[0_8px_24px_-8px_rgba(99,179,255,0.55)] motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${open ? "pointer-events-none opacity-0" : "opacity-100"}`}
      >
        <span aria-hidden="true" className="pointer-events-none">
          <Hamburger toggled={open} toggle={setOpen} size={18} color="currentColor" />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <>
            <motion.button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              onClick={close}
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-40 cursor-default bg-background/60 backdrop-blur-sm"
            />

            <motion.nav
              ref={panelRef}
              id={panelId}
              aria-label="Primary"
              role="dialog"
              aria-modal="true"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-y-0 inset-s-0 z-50 flex w-[min(20rem,100vw)] flex-col border-e border-border bg-card shadow-2xl"
            >
              <div className="flex h-16 shrink-0 items-center justify-between px-5">
                <span className="text-base font-semibold text-foreground">Menu</span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={close}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground transition-colors hover:border-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col gap-1 px-3">
                <ul role="list" className="flex flex-col gap-0.5">
                  {links.map((link, idx) => (
                    <NavPanelItem
                      key={link.href}
                      link={link}
                      onActivate={close}
                      forwardedRef={idx === 0 ? firstLinkRef : undefined}
                    />
                  ))}
                </ul>
              </div>

              <div className="mt-auto border-t border-border px-4 py-4">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-full border border-border"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-muted-foreground">
                        {name ?? "Signed in"}
                      </p>
                      <p className="mt-0.5 text-xs uppercase tracking-[0.08em] text-muted-foreground">
                        {role}
                      </p>
                    </div>
                  </div>
                  <SignOutButton showLabel />
                </div>
              </div>
            </motion.nav>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}

function NavPanelItem({
  link,
  onActivate,
  forwardedRef,
}: {
  link: NavLink
  onActivate: () => void
  forwardedRef?: React.Ref<HTMLAnchorElement>
}): React.JSX.Element {
  const Icon = link.Icon

  return (
    <motion.li variants={itemVariants}>
      <div className="group flex items-center gap-3 rounded-xl px-4 py-3 text-base text-muted-foreground transition-colors duration-200 hover:bg-background/60 hover:text-foreground">
        <Icon
          aria-hidden="true"
          size={18}
          className="shrink-0 text-muted-foreground transition-colors duration-200 group-hover:text-foreground"
        />
        <Link
          ref={forwardedRef}
          href={link.href}
          onClick={onActivate}
          className="flex-1 focus-visible:outline-none"
        >
          {link.label}
        </Link>
      </div>
    </motion.li>
  )
}
