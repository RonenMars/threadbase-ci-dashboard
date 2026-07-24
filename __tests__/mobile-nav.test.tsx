/// <reference types="@testing-library/jest-dom" />

import { describe, expect, it, vi, afterEach } from "vitest"
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AppHeader } from "@/components/app-header"
import { NavMenu } from "@/components/nav-menu"

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

describe("NavMenu (tb-landing port)", () => {
  afterEach(() => {
    cleanup()
    document.body.style.overflow = ""
  })

  it("renders a floating hamburger on AppHeader for desktop and mobile", () => {
    render(<AppHeader role="admin" name="Ronen" image={null} />)
    const trigger = screen.getByRole("button", { name: /open menu/i })
    expect(trigger).toBeInTheDocument()
    expect(trigger.className).toContain("fixed")
    expect(trigger.className).toContain("start-5")
    expect(trigger.className).toContain("top-5")
  })

  it("opens role-gated links in the slide-in dialog", async () => {
    render(<NavMenu role="admin" name="Ronen" image={null} />)

    fireEvent.click(screen.getByRole("button", { name: /open menu/i }))

    const dialog = await screen.findByRole("dialog")
    expect(dialog).toHaveAttribute("aria-modal", "true")
    expect(dialog).toHaveTextContent("Menu")
    expect(dialog).toHaveTextContent("Deploy")
    expect(dialog).toHaveTextContent("History")
    expect(dialog).toHaveTextContent("Admin")
  })

  it("opens the panel from the hamburger and closes on Escape", async () => {
    render(<NavMenu role="deployer" name="Ronen" image={null} />)

    const trigger = screen.getByRole("button", { name: /open menu/i })
    fireEvent.click(trigger)

    const dialog = await screen.findByRole("dialog")
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

  it("closes when a panel link is clicked", async () => {
    render(<NavMenu role="viewer" name="Viewer" image={null} />)

    fireEvent.click(screen.getByRole("button", { name: /open menu/i }))
    const historyLink = await screen.findByRole("link", { name: "History" })
    fireEvent.click(historyLink)

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })
})
