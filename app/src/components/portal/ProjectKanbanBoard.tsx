"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import type { ProjectStatus } from "@/types/database";

export interface KanbanProject {
  id: string;
  name: string;
  project_code: string;
  status: ProjectStatus;
  updated_at: string;
}

const COLUMNS: { key: ProjectStatus; title: string }[] = [
  { key: "intake", title: "Intake" },
  { key: "in_progress", title: "In Progress" },
  { key: "client_review", title: "Client Review" },
  { key: "complete", title: "Complete" },
];

export function ProjectKanbanBoard({ clientId, initialProjects }: { clientId: string; initialProjects: KanbanProject[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [live, setLive] = useState(false);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`client-projects-${clientId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects", filter: `client_id=eq.${clientId}` },
        (payload) => {
          setProjects((prev) => {
            if (payload.eventType === "DELETE") {
              const oldRow = payload.old as { id: string };
              return prev.filter((p) => p.id !== oldRow.id);
            }
            const row = payload.new as KanbanProject;
            const exists = prev.some((p) => p.id === row.id);
            return exists ? prev.map((p) => (p.id === row.id ? row : p)) : [...prev, row];
          });
        }
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-xs text-muted">
        <span className={cn("h-1.5 w-1.5 rounded-full", live ? "bg-success" : "bg-muted")} />
        {live ? "Live — updates automatically" : "Connecting…"}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((column) => {
          const columnProjects = projects.filter((p) => p.status === column.key);
          return (
            <section key={column.key} className="rounded-lg border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">{columnProjects.length}</span>
              </div>
              <div className="space-y-2 p-2">
                {columnProjects.length === 0 && <p className="px-2 py-4 text-center text-xs text-muted">No projects</p>}
                {columnProjects.map((project) => (
                  <div key={project.id} className="rounded-md border border-border bg-canvas p-3">
                    <p className="text-sm font-medium text-foreground">{project.name}</p>
                    <p className="mt-1 font-mono text-xs text-muted">{project.project_code}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
