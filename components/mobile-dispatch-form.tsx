"use client"
import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { RocketLaunchIcon, WarningCircleIcon, CheckCircleIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { RefCombobox } from "@/components/ref-combobox"
import { useRefs, submitDispatch } from "@/components/dispatch-shared"
import type { SubmitStatus } from "@/components/dispatch-shared"
import { mobileDispatchSchema } from "@/lib/dispatch-schema"
import type { MobileDispatchInputs } from "@/lib/dispatch-schema"

export function MobileDispatchForm(): React.JSX.Element {
  const [status, setStatus] = useState<SubmitStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const {
    control, handleSubmit, watch, setValue,
    formState: { isSubmitting },
  } = useForm<MobileDispatchInputs>({
    resolver: zodResolver(mobileDispatchSchema),
    defaultValues: {
      deploy_ref: "",
      platform: "all",
      target: "testflight",
      android_track: "alpha",
      release_notes: "",
    },
  })

  const { refs, loading: refsLoading } = useRefs("tb-mobile", (ref) =>
    setValue("deploy_ref", ref, { shouldValidate: true })
  )

  const platform = watch("platform")
  const target = watch("target")

  const showReleaseNotes =
    (platform === "ios" || platform === "all") && target === "production"

  async function onSubmit(values: MobileDispatchInputs) {
    setStatus("idle")
    setErrorMessage("")
    const error = await submitDispatch("tb-mobile", {
      ...values,
      ...(values.release_notes ? {} : { release_notes: undefined }),
    })
    if (error) {
      setErrorMessage(error)
      setStatus("error")
    } else {
      setStatus("success")
    }
  }

  return (
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
  )
}
