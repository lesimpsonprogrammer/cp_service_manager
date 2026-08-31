"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import type { BlogFormState } from "@/app/(dashboard)/posts/actions";
import type { Database } from "@/types/database";

type PostRow = Database["public"]["Tables"]["blog_posts"]["Row"];

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function BlogForm({
  action,
  post,
  categories = [],
  submitLabel = "Create post",
  submitPendingLabel = "Creating…",
}: {
  action: (state: BlogFormState, formData: FormData) => Promise<BlogFormState>;
  post?: PostRow;
  categories?: string[];
  submitLabel?: string;
  submitPendingLabel?: string;
}) {
  const [state, formAction] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="max-w-3xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required defaultValue={post?.title} placeholder="What Is ETL? A Simple Guide" />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            list="blog-categories"
            defaultValue={post?.category ?? "General"}
            placeholder="General"
          />
          <datalist id="blog-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </div>
      </div>

      <div>
        <Label htmlFor="authorName">Author</Label>
        <Input id="authorName" name="authorName" defaultValue={post?.author_name ?? ""} placeholder="Larry Simpson" />
      </div>

      <div>
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          defaultValue={post?.excerpt ?? ""}
          placeholder="One or two sentences shown on the blog index."
        />
      </div>

      <div>
        <Label htmlFor="body">Body (Markdown)</Label>
        <Textarea
          id="body"
          name="body"
          rows={20}
          defaultValue={post?.body ?? ""}
          className="font-mono text-xs"
          placeholder={"# Heading\n\nWrite the post here in Markdown."}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="published" defaultChecked={post?.published ?? false} className="h-4 w-4 rounded border-border" />
        Published (visible at /blog)
      </label>

      {state.error && (
        <p className={cn("rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger")}>
          {state.error}
        </p>
      )}

      <SubmitButton label={submitLabel} pendingLabel={submitPendingLabel} />
    </form>
  );
}
