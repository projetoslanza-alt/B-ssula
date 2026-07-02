"use client";

import { Input, Select, Textarea } from "@/components/ui/input";
import type { IntakeQuestion } from "@/modules/support/actions/intake-actions";

export function DynamicQuestionField({
  question,
  value,
  onChange,
  disabled,
}: {
  question: IntakeQuestion;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const fieldId = `q-${question.question_key}`;
  const label = (
    <label htmlFor={fieldId} className="block text-sm">
      {question.label}
      {question.is_required && <span className="text-red-400"> *</span>}
      {question.help_text && <span className="mt-0.5 block text-xs text-[var(--muted)]">{question.help_text}</span>}
    </label>
  );

  if (question.field_type === "textarea") {
    return (
      <div className="space-y-1">
        {label}
        <Textarea id={fieldId} value={value} onChange={(e) => onChange(e.target.value)} rows={3} disabled={disabled} required={question.is_required} />
      </div>
    );
  }

  if (question.field_type === "select") {
    return (
      <div className="space-y-1">
        {label}
        <Select id={fieldId} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} required={question.is_required}>
          <option value="">Selecione</option>
          {question.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </Select>
      </div>
    );
  }

  if (question.field_type === "date") {
    return (
      <div className="space-y-1">
        {label}
        <Input id={fieldId} type="date" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} required={question.is_required} />
      </div>
    );
  }

  if (question.field_type === "number") {
    return (
      <div className="space-y-1">
        {label}
        <Input id={fieldId} type="number" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} required={question.is_required} />
      </div>
    );
  }

  if (question.field_type === "url") {
    return (
      <div className="space-y-1">
        {label}
        <Input id={fieldId} type="url" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} required={question.is_required} />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {label}
      <Input id={fieldId} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} required={question.is_required} />
    </div>
  );
}
