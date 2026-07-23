"use client"
import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { RocketLaunchIcon, WarningCircleIcon, CheckCircleIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { RefCombobox } from "@/components/ref-combobox"
import { useRefs, submitDispatch } from "@/components/dispatch-shared"
import type { SubmitStatus } from "@/components/dispatch-shared"
import { streamerDispatchSchema } from "@/lib/dispatch-schema"
import type { StreamerDispatchInputs } from "@/lib/dispatch-schema"

export function StreamerDispatchForm(): React.JSX.Element {
  const [status, setStatus] = useState<SubmitStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const {
    control, handleSubmit, setValue,
    formState: { isSubmitting },
  } = useForm<StreamerDispatchInputs>({
    resolver: zodResolver(streamerDispatchSchema),
    defaultValues: { deploy_ref: "", publish: false },
  })

  const { refs, loading: refsLoading } = useRefs("tb-streamer", (ref) =>
    setValue("deploy_ref", ref, { shouldValidate: true })
  )

  async function onSubmit(values: StreamerDispatchInputs) {
    setStatus("idle")
    setErrorMessage("")
    const error = await submitDispatch("tb-streamer", values)
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
        <Label htmlFor="publish">Publish to Fly.io</Label>
        <Controller
          control={control}
          name="publish"
          render={({ field }) => (
            <Select
              value={field.value ? "true" : "false"}
              onValueChange={(v) => field.onChange(v === "true")}
            >
              <SelectTrigger id="publish" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="false">no — build only</SelectItem>
                <SelectItem value="true">yes — publish release</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

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
