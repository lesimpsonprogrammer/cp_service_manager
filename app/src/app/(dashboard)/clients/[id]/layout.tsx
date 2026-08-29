import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { DeleteClientButton } from "@/components/clients/DeleteClientButton";
import { ClientTabNav } from "@/components/clients/ClientTabNav";

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("id, name").eq("id", id).single();

  if (!client) notFound();

  return (
    <div>
      <PageHeader
        title={client.name}
        description="Client profile, onboarding, contracts, accounting, compliance, and connected data sources."
        action={
          <div className="flex items-center gap-2">
            <Link href={`/clients/${client.id}/edit`}>
              <Button variant="secondary" size="sm">
                Edit
              </Button>
            </Link>
            <DeleteClientButton clientId={client.id} />
          </div>
        }
      />

      <div className="flex flex-col gap-6 sm:flex-row">
        <ClientTabNav clientId={client.id} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
