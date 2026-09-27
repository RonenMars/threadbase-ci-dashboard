"use client"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { WarningCircleIcon, CheckCircleIcon } from "@phosphor-icons/react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { RefCombobox } from "@/components/ref-combobox"
import { ConfirmSubmitButton } from "@/components/confirm-submit-button"
import { useRefs, useDispatchSubmit } from "@/components/dispatch-shared"
import { mobileQaDispatchSchema } from "@/lib/dispatch-schema"
import type { MobileQaDispatchInputs } from "@/lib/dispatch-schema"

export function MobileQaDispatchForm(): React.JSX.Element {
  const { status, errorMessage, runUrl, runLoading, submit } =
    useDispatchSubmit("tb-mobile-qa")

  const {
    control, handleSubmit, setValue,
    formState: { isSubmitting },
  } = useForm<MobileQaDispatchInputs>({
    resolver: zodResolver(mobileQaDispatchSchema),
    defaultValues: {
      deploy_ref: "",
      platform: "all",
      groups: "qa",
      release_notes: "",
    },
  })

  const { refs, loading: refsLoading } = useRefs("tb-mobile-qa", (ref) =>
    setValue("deploy_ref", ref, { shouldValidate: true })
  )

  async function onSubmit(values: MobileQaDispatchInputs) {
    await submit({
      ...values,
      ...(values.release_notes ? {} : { release_notes: undefined }),
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="min-w-0 space-y-4">
      <div className="min-w-0 space-y-1">
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

      <div className="min-w-0 space-y-1">
        <Label htmlFor="platform">Platform</Label>
        <Controller
          control={control}
          name="platform"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="platform" className="w-full min-w-0 max-w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">all</SelectItem>
                <SelectItem value="ios">ios</SelectItem>
                <SelectItem value="android">android</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="min-w-0 space-y-1">
        <Label htmlFor="groups">Firebase tester groups</Label>
        <Controller
          control={control}
          name="groups"
          render={({ field }) => (
            <Input
              id="groups"
              value={field.value}
              onChange={field.onChange}
              placeholder="qa"
            />
          )}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="release_notes">Release Notes</Label>
        <Controller
          control={control}
          name="release_notes"
          render={({ field }) => (
            <Input
              id="release_notes"
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder="Defaults to the ref and commit"
            />
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

      <ConfirmSubmitButton
        disabled={refsLoading}
        isSubmitting={isSubmitting}
        status={status}
        runUrl={runUrl}
        runLoading={runLoading}
      />
    </form>
  )
}
