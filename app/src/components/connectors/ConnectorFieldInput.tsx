import type { ConnectorField } from "@/lib/connectors/types";
import { Input, Textarea, Select, Label } from "@/components/ui/Input";

export function ConnectorFieldInput({
  field,
  existingValue,
  hasExistingSecret,
}: {
  field: ConnectorField;
  /** Prefill for a non-secret field when editing — never set for a secret field. */
  existingValue?: string;
  /** Edit mode only: whether a secret value is already saved, without exposing it. */
  hasExistingSecret?: boolean;
}) {
  const name = `field_${field.key}`;
  const defaultValue = existingValue ?? field.defaultValue;
  const placeholder = field.secret && hasExistingSecret ? "Leave blank to keep the existing value" : field.placeholder;
  const isRequired = field.required && !hasExistingSecret && !existingValue;

  return (
    <div>
      <Label htmlFor={name}>
        {field.label}
        {field.required && <span className="text-danger"> *</span>}
      </Label>

      {field.type === "textarea" ? (
        <Textarea
          id={name}
          name={name}
          required={isRequired}
          placeholder={placeholder}
          rows={5}
          defaultValue={field.secret ? undefined : defaultValue}
        />
      ) : field.type === "select" ? (
        <Select id={name} name={name} required={isRequired} defaultValue={defaultValue}>
          {!defaultValue && <option value="">Select…</option>}
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
          required={isRequired}
          placeholder={placeholder}
          defaultValue={field.secret ? undefined : defaultValue}
          autoComplete={field.secret ? "off" : undefined}
        />
      )}

      {field.helpText && <p className="mt-1 text-xs text-muted">{field.helpText}</p>}
    </div>
  );
}
