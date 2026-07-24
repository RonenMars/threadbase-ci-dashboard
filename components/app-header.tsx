import { NavMenu } from "@/components/nav-menu"
import type { Role } from "@/lib/roles"

type AppHeaderProps = Readonly<{
  role: Role
  name: string | null
  image: string | null
}>

/**
 * Same chrome pattern as tb-landing: floating hamburger on desktop and mobile.
 * No sticky top bar — navigation lives entirely in the slide-in NavMenu.
 */
export function AppHeader({ role, name, image }: AppHeaderProps): React.JSX.Element {
  return <NavMenu role={role} name={name} image={image} />
}
