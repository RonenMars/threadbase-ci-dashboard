import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { eq, count } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema"
import type { Role } from "@/lib/roles"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    GitHub({
      authorization: {
        params: { scope: "read:user user:email repo workflow" },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      const [dbUser] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, user.id))

      // First user to sign in becomes admin. This runs here rather than in the
      // signIn callback because signIn fires *before* the adapter inserts the
      // user, so a COUNT there would always miss. db.transaction() is not
      // supported by the Neon HTTP driver, so this is a two-step read+write; a
      // simultaneous first sign-in race is theoretically possible but
      // negligible for a personal deploy tool.
      let role = (dbUser?.role ?? "viewer") as Role
      if (role === "viewer") {
        const [{ value: total }] = await db
          .select({ value: count() })
          .from(users)
        if (total === 1) {
          await db
            .update(users)
            .set({ role: "admin" })
            .where(eq(users.id, user.id))
          role = "admin"
        }
      }

      session.user.role = role
      return session
    },
  },
})
