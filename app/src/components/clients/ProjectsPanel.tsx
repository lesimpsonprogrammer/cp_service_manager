"use client";

import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { createProject, deleteProject, updateProjectStatus, type ProjectFormState } from "@/app/(dashboard)/time/actions";
import type { ProjectStatus } from "@/types/database";

export interface ProjectRow {
  id: string;
  name: string;
  project_code: string;
  status: ProjectStatus;
}

const STAGE_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "intake", label: "Intake" },
  { value: "in_progress", label: "In Progress" },
  { value: "client_review", label: "Client Review" },
  { value: "complete", label: "Complete" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Adding…" : "Add project"}
    </Button>
  );
}

export function ProjectsPanel({ clientId, projects }: { clientId: string; projects: ProjectRow[] }) {
  const [state, formAction] = useActionState(createProject.bind(null, clientId), { error: null } as ProjectFormState);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {projects.length > 0 ? (
        <ul className="divide-y divide-border">
          {projects.map((project) => (
            <li key={project.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <span className="font-medium text-foreground">{project.name}</span>
                <span className="ml-2 font-mono text-xs text-muted">{project.project_code}</span>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  aria-label={`Kanban stage for ${project.name}`}
                  defaultValue={project.status}
                  disabled={pending}
                  onChange={(e) =>
                    startTransition(() => updateProjectStatus(clientId, project.id, e.target.value as ProjectStatus))
                  }
                  className="h-8 w-auto py-1 text-xs"
                >
                  {STAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm(`Delete project "${project.name}"? Time entries logged against it will block this.`))
                      return;
                    startTransition(() => deleteProject(clientId, project.id));
                  }}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-2 text-sm text-muted">No projects yet — add one below to start logging time.</p>
      )}

      <form action={formAction} className="flex items-end gap-2 px-5 pb-4">
        <div className="flex-1">
          <Label htmlFor="project_name">New project</Label>
          <Input id="project_name" name="name" required placeholder="Q1 Payroll Cleanup" />
        </div>
        <SubmitButton />
      </form>
      {state.error && (
        <p className={cn("mx-5 mb-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger")}>
          {state.error}
        </p>
      )}
    </div>
  );
}
