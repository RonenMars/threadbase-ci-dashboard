"use client"

import { useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { Divide as Hamburger } from "hamburger-react"
import { SignOutButton } from "@/components/sign-out-button"
import { canDeploy, isAdmin } from "@/lib/roles"
import type { Role } from "@/lib/roles"

type MobileNavProps = Readonly<{
  role: Role
  name: string | null
  image: string | null
}>

const EASE = [0.22, 1, 0.36, 1] as const

const listVariants = {
  open: {
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
  closed: {},
}

const itemVariants = {
  closed: { opacity: 0, x: -12 },
  open: { opacity: 1, x: 0 },
}

export function MobileNav({ role, name, image }: MobileNavProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const triggerWrapRef = useRef<HTMLDivElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)
  const wasOpenRef = useRef(false)
  const menuId = useId()

  const links = [
    ...(canDeploy(role) ? [{ href: "/dashboard", label: "Deploy" }] as const : []),
    { href: "/history", label: "History" } as const,
    ...(isAdmin(role) ? [{ href: "/admin", label: "Admin" }] as const : []),
  ]

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
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

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true
      const frame = requestAnimationFrame(() => firstLinkRef.current?.focus())
      return () => cancelAnimationFrame(frame)
    }
    if (wasOpenRef.current) {
      const trigger = triggerWrapRef.current?.querySelector<HTMLElement>(".hamburger-react")
      trigger?.focus()
      wasOpenRef.current = false
    }
  }, [open])

  return (
    <div className="ml-auto flex items-center sm:hidden">
      <div ref={triggerWrapRef} className="relative z-50 -mr-2">
        <Hamburger
          toggled={open}
          toggle={setOpen}
          size={20}
          color="var(--tb-fg-0)"
          label={open ? "Close menu" : "Open menu"}
          rounded
          hideOutline={false}
          duration={0.35}
        />
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="mobile-nav-backdrop"
              className="fixed inset-0 z-40 bg-black/55"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.28, ease: EASE } }}
              transition={{ duration: 0.4, ease: EASE }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            <motion.nav
              key="mobile-nav-panel"
              id={menuId}
              aria-label="Mobile"
              className="fixed inset-y-0 left-0 z-40 flex w-[min(18.5rem,86vw)] flex-col border-r border-border bg-(--tb-ink-4) pt-16 shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%", transition: { duration: 0.28, ease: EASE } }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <motion.div
                className="flex flex-1 flex-col gap-1 px-4"
                initial="closed"
                animate="open"
                exit="closed"
                variants={listVariants}
              >
                {links.map((link, index) => (
                  <motion.div key={link.href} variants={itemVariants}>
                    <Link
                      ref={index === 0 ? firstLinkRef : undefined}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:bg-secondary focus-visible:text-foreground focus-visible:outline-none"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                className="mt-auto flex items-center gap-3 border-t border-border px-4 py-4"
                variants={itemVariants}
                initial="closed"
                animate="open"
                exit="closed"
                transition={{ delay: 0.15 }}
              >
                {image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt=""
                    className="h-8 w-8 rounded-full border border-border"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{name ?? "Signed in"}</p>
                  <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{role}</p>
                </div>
                <SignOutButton showLabel />
              </motion.div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
