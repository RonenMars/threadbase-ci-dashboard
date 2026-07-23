"use client"
import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { RocketLaunchIcon, WarningCircleIcon, CheckCircleIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefCombobox } from "@/components/ref-combobox"
import { dispatchInputsSchema } from "@/lib/dispatch-schema"
import type { DispatchInputs } from "@/lib/dispatch-schema"

type Refs = Readonly<{ branches: string[]; tags: string[] }>
type Status = "idle" | "success" | "error"

export function DispatchForm(): React.JSX.Element {
  const [refs, setRefs] = useState<Refs>({ branches: [], tags: [] })
  const [refsLoading, setRefsLoading] = useState(true)
  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const {
    control, handleSubmit, watch, setValue,
    formState: { isSubmitting },
  } = useForm<DispatchInputs>({
    resolver: zodResolver(dispatchInputsSchema),
    defaultValues: {
      deploy_ref: "",
      platform: "all",
      target: "testflight",
      android_track: "alpha",
      release_notes: "",
    },
  })

  const platform = watch("platform")
  const target = watch("target")

  useEffect(() => {
    fetch("/api/refs")
      .then((r) => r.json())
      .then((data: Refs) => {
        setRefs(data)
        // Prefer main; the branches list is alphabetical, so branches[0] would
        // otherwise default to whatever sorts first (e.g. "chore/...").
        const preferred = data.branches.includes("main")
          ? "main"
          : data.branches[0] ?? "main"
        setValue("deploy_ref", preferred, { shouldValidate: true })
      })
      .catch(() => setValue("deploy_ref", "main", { shouldValidate: true }))
      .finally(() => setRefsLoading(false))
  }, [setValue])

  const showReleaseNotes =
    (platform === "ios" || platform === "all") && target === "production"

  async function onSubmit(values: DispatchInputs) {
    setStatus("idle")
    setErrorMessage("")

    const res = await fetch("/api/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        ...(values.release_notes ? {} : { release_notes: undefined }),
      }),
    })

    if (res.ok) {
      setStatus("success")
    } else {
      const data = await res.json()
      setErrorMessage(data.error ?? "Dispatch failed")
      setStatus("error")
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Trigger Deploy</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="deploy_ref">Branch / Tag</Label>
            <Controller
              control={control}
              name="deploy_ref"
              render={({ field }) => (
                <RefCombobox
                  id="deploy_ref"
                  branches={refs.branches}
                  tags={refs.tags}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={refsLoading}
                  loading={refsLoading}
                />
              )}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="platform">Platform</Label>
            <Controller
              control={control}
              name="platform"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="platform" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">all</SelectItem>
                    <SelectItem value="ios">ios</SelectItem>
                    <SelectItem value="android">android</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {(platform === "ios" || platform === "all") && (
            <div className="space-y-1">
              <Label htmlFor="target">iOS Target</Label>
              <Controller
                control={control}
                name="target"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="target" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="testflight">testflight</SelectItem>
                      <SelectItem value="production">production</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {(platform === "android" || platform === "all") && (
            <div className="space-y-1">
              <Label htmlFor="android_track">Android Track</Label>
              <Controller
                control={control}
                name="android_track"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="android_track" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alpha">alpha</SelectItem>
                      <SelectItem value="internal">internal</SelectItem>
                      <SelectItem value="beta">beta</SelectItem>
                      <SelectItem value="production">production</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {showReleaseNotes && (
            <div className="space-y-1">
              <Label htmlFor="release_notes">Release Notes (iOS production)</Label>
              <Controller
                control={control}
                name="release_notes"
                render={({ field }) => (
                  <Input
                    id="release_notes"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="What's new in this release?"
                  />
                )}
              />
            </div>
          )}

          {status === "error" && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <WarningCircleIcon weight="fill" />
              {errorMessage}
            </p>
          )}
          {status === "success" && (
            <p className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircleIcon weight="fill" />
              Workflow triggered — check History for progress.
            </p>
          )}

          <Button type="submit" disabled={isSubmitting || refsLoading} className="w-full">
            <RocketLaunchIcon weight="fill" />
            {isSubmitting ? "Triggering…" : "Run Workflow"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
