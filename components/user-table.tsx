"use client"
import { useState } from "react"
import { TrashIcon } from "@phosphor-icons/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

type UserRow = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: string
  createdAt: string
}

type UserTableProps = Readonly<{
  initialUsers: UserRow[]
  currentUserId: string
}>

export function UserTable({ initialUsers, currentUserId }: UserTableProps): React.JSX.Element {
  const [userList, setUserList] = useState<UserRow[]>(initialUsers)
  const [error, setError] = useState("")

  async function changeRole(id: string, role: string) {
    setError("")
    const res = await fetch(`/api/admin/users?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    if (res.ok) {
      setUserList((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to change role")
    }
  }

  async function removeUser(id: string) {
    if (!confirm("Remove this user? This revokes their dashboard access.")) return
    setError("")
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      setUserList((prev) => prev.filter((u) => u.id !== id))
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to remove user")
    }
  }

  return (
    <div className="w-full">
      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-border bg-card p-4 shadow-[0_4px_12px_rgba(0,0,0,0.45)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <th className="pb-2 pr-4 font-semibold">User</th>
              <th className="pb-2 pr-4 font-semibold">Email</th>
              <th className="pb-2 pr-4 font-semibold">Role</th>
              <th className="pb-2 pr-4 font-semibold">Joined</th>
              <th className="pb-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {userList.map((user) => {
              const isSelf = user.id === currentUserId
              return (
                <tr key={user.id} className="border-b border-border">
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={user.image ?? ""} />
                        <AvatarFallback>{(user.name ?? "?")[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {user.name ?? "—"}
                        {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-sm text-muted-foreground">{user.email ?? "—"}</td>
                  <td className="py-2.5 pr-4">
                    <Select
                      value={user.role}
                      onValueChange={(v) => changeRole(user.id, v)}
                      disabled={isSelf}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">admin</SelectItem>
                        <SelectItem value="deployer">deployer</SelectItem>
                        <SelectItem value="viewer">viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-2.5 pr-4 text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2.5">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isSelf}
                      onClick={() => removeUser(user.id)}
                    >
                      <TrashIcon />
                      Remove
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
