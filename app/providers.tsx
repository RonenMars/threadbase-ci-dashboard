"use client"
import { SessionProvider } from "next-auth/react"

type ProvidersProps = Readonly<{ children: React.ReactNode }>

export function Providers({ children }: ProvidersProps): React.JSX.Element {
  return <SessionProvider>{children}</SessionProvider>
}
