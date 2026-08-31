"use client";

import { useTransition } from "react";
import { deletePost } from "@/app/(dashboard)/posts/actions";
import { Button } from "@/components/ui/Button";

export function DeleteBlogPostButton({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="danger"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this post?")) return;
        startTransition(() => deletePost(postId));
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
