"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectSwitcher } from "@/components/project-switcher"
import { MobileDispatchForm } from "@/components/mobile-dispatch-form"
import { StreamerDispatchForm } from "@/components/streamer-dispatch-form"
import { DEFAULT_PROJECT_ID, type ProjectId } from "@/lib/project-options"

export function DispatchForm(): React.JSX.Element {
  const [project, setProject] = useState<ProjectId>(DEFAULT_PROJECT_ID)

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Trigger Deploy</CardTitle>
        <ProjectSwitcher value={project} onChange={setProject} />
      </CardHeader>
      <CardContent>
        {/* key remounts the form on project switch so its default ref/inputs reset. */}
        {project === "tb-mobile"
          ? <MobileDispatchForm key="tb-mobile" />
          : <StreamerDispatchForm key="tb-streamer" />}
      </CardContent>
    </Card>
  )
}
