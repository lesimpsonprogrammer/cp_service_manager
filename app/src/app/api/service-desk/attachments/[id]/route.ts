import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAttachmentDownloadUrl } from "@/lib/service-desk/attachments";

// Shared by staff and client-portal users (session cookie auth). The
// RLS-scoped select is the access check — portal users can't see files on
// other clients' tickets or on internal notes — and the bytes come from a
// 60-second signed URL.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { data: attachment } = await supabase
    .from("ticket_attachments")
    .select("storage_path, file_name")
    .eq("id", id)
    .maybeSingle();
  if (!attachment) return NextResponse.json({ error: "Attachment not found." }, { status: 404 });

  const url = await createAttachmentDownloadUrl(attachment.storage_path, attachment.file_name);
  if (!url) return NextResponse.json({ error: "Couldn't prepare the download. Try again." }, { status: 502 });
  return NextResponse.redirect(url);
}
