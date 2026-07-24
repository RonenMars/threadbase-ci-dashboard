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

  it("opens the slide-in panel from the hamburger and closes on Escape", async () => {
    render(<MobileNav role="deployer" name="Ronen" image={null} />)

    fireEvent.click(screen.getByLabelText("Open menu"))

    const mobileNav = await screen.findByRole("navigation", { name: "Mobile" })
    expect(mobileNav).toHaveTextContent("Deploy")
    expect(mobileNav).toHaveTextContent("History")
    expect(mobileNav).not.toHaveTextContent("Admin")
    expect(screen.getByLabelText("Close menu")).toHaveAttribute("aria-expanded", "true")

    fireEvent.keyDown(document, { key: "Escape" })

    await waitFor(() => {
      expect(screen.queryByRole("navigation", { name: "Mobile" })).not.toBeInTheDocument()
    })
  })

  it("portals the panel to document.body so backdrop-blur on the header cannot trap it", async () => {
    render(<AppHeader role="admin" name="Ronen" image={null} />)

    fireEvent.click(screen.getByLabelText("Open menu"))

    const mobileNav = await screen.findByRole("navigation", { name: "Mobile" })
    expect(mobileNav.closest("header")).toBeNull()
    expect(document.body.contains(mobileNav)).toBe(true)
  })

  it("closes when a panel link is clicked", async () => {
    render(<MobileNav role="viewer" name="Viewer" image={null} />)

    fireEvent.click(screen.getByLabelText("Open menu"))
    const historyLink = await screen.findByRole("link", { name: "History" })
    fireEvent.click(historyLink)

    await waitFor(() => {
      expect(screen.queryByRole("navigation", { name: "Mobile" })).not.toBeInTheDocument()
    })
  })
})
