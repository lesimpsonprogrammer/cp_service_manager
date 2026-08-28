import { PageHeader } from "@/components/ui/PageHeader";
import { NewDataSourceForm } from "@/components/connectors/NewDataSourceForm";

export default function NewDataSourcePage() {
  return (
    <div>
      <PageHeader title="Add a data source" description="Pick a connector, then fill in its connection details." />
      <NewDataSourceForm />
    </div>
  );
}
