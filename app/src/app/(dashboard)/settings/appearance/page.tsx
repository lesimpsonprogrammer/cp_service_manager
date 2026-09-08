import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BrandColorPicker } from "@/components/ui/BrandColorPicker";
import { BackgroundPicker } from "@/components/ui/BackgroundPicker";
import { JarenBackgroundSettings } from "@/components/settings/JarenBackgroundSettings";

export default function AppearanceSettingsPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader title="Appearance" description="Theme, accent color, and background for your workspace." />

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground">Theme</p>
              <p className="text-xs text-muted">Switch between light and dark mode.</p>
            </div>
            <ThemeToggle />
          </div>

          <div>
            <p className="text-foreground">Accent color</p>
            <p className="mb-2 text-xs text-muted">Choose the color used for buttons, links, and highlights.</p>
            <BrandColorPicker />
          </div>

          <div>
            <p className="text-foreground">Background</p>
            <p className="mb-2 text-xs text-muted">Choose the base tone for the app background.</p>
            <BackgroundPicker />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jaren</CardTitle>
          <CardDescription>Chat background for the Jaren assistant.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <JarenBackgroundSettings />
        </CardContent>
      </Card>
    </div>
  );
}
