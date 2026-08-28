import type { ConnectorField } from "@/lib/connectors/types";
import { Input, Textarea, Select, Label } from "@/components/ui/Input";

export function ConnectorFieldInput({ field }: { field: ConnectorField }) {
  const name = `field_${field.key}`;

  return (
    <div>
      <Label htmlFor={name}>
        {field.label}
        {field.required && <span className="text-danger"> *</span>}
      </Label>

      {field.type === "textarea" ? (
        <Textarea id={name} name={name} required={field.required} placeholder={field.placeholder} rows={5} defaultValue={field.defaultValue} />
      ) : field.type === "select" ? (
        <Select id={name} name={name} required={field.required} defaultValue={field.defaultValue}>
          {!field.defaultValue && <option value="">Select…</option>}
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      ) : (
        <Input
          id={name}
          name={name}
          type={field.type}
          required={field.required}
          placeholder={field.placeholder}
          defaultValue={field.defaultValue}
          autoComplete={field.secret ? "off" : undefined}
        />
      )}

      {field.helpText && <p className="mt-1 text-xs text-muted">{field.helpText}</p>}
    </div>
  );
}
