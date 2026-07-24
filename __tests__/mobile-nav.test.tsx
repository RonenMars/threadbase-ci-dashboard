/// <reference types="@testing-library/jest-dom" />

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AppHeader } from "@/components/app-header"
import { MobileNav } from "@/components/mobile-nav"

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}))

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    ...rest
  }: {
    href: string
    children: React.ReactNode
    onClick?: () => void
    className?: string
  }) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}))

describe("AppHeader mobile nav", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  afterEach(() => {
    cleanup()
    document.body.style.overflow = ""
  })

  it("renders role-gated links in the desktop nav for an admin", () => {
    render(<AppHeader role="admin" name="Ronen" image={null} />)

    const desktopNav = screen.getByRole("navigation", { name: "Primary" })
    expect(desktopNav).toHaveTextContent("Deploy")
    expect(desktopNav).toHaveTextContent("History")
    expect(desktopNav).toHaveTextContent("Admin")
  })

  it("renders a floating hamburger button with an accessible label", () => {
    render(<MobileNav role="deployer" name="Ronen" image={null} />)
    const trigger = screen.getByRole("button", { name: /open menu/i })
    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(trigger.className).toContain("fixed")
  })

  it("opens the slide-in panel from the hamburger and closes on Escape", async () => {
    render(<MobileNav role="deployer" name="Ronen" image={null} />)

    const trigger = screen.getByRole("button", { name: /open menu/i })
    fireEvent.click(trigger)

    const dialog = await screen.findByRole("dialog")
    expect(dialog).toHaveAttribute("aria-modal", "true")
    expect(dialog).toHaveTextContent("Deploy")
    expect(dialog).toHaveTextContent("History")
    expect(dialog).not.toHaveTextContent("Admin")
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(trigger).toHaveAttribute("aria-label", "Close menu")

    fireEvent.keyDown(window, { key: "Escape" })

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })

  it("keeps the floating menu outside the blurred header", async () => {
    render(<AppHeader role="admin" name="Ronen" image={null} />)

    fireEvent.click(screen.getByRole("button", { name: /open menu/i }))

    const dialog = await screen.findByRole("dialog")
    expect(dialog.closest("header")).toBeNull()
  })

  it("closes when a panel link is clicked", async () => {
    render(<MobileNav role="viewer" name="Viewer" image={null} />)

    fireEvent.click(screen.getByRole("button", { name: /open menu/i }))
    const historyLink = await screen.findByRole("link", { name: "History" })
    fireEvent.click(historyLink)

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })
})
