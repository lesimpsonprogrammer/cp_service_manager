import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { JarenChat } from "@/components/jaren/JarenChat";

export default function JarenPage() {
  return (
    <div>
      <PageHeader
        title="Jaren"
        description="Jaren proposes data models, mappings, and automations. Nothing changes in CPSM until you approve it."
      />
      <Card>
        <CardContent>
          <JarenChat />
        </CardContent>
      </Card>
    </div>
  );
}
