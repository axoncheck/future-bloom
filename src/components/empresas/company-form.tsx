import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { maskCEP, maskCNPJ, maskPhone, PLAN_OPTIONS, UF_LIST, unmask } from "@/lib/masks";

export type CompanyFormValues = {
  name: string;
  legal_name: string;
  document: string;
  phone: string;
  email: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  plan_type: string;
};

export const emptyCompany: CompanyFormValues = {
  name: "",
  legal_name: "",
  document: "",
  phone: "",
  email: "",
  address_street: "",
  address_number: "",
  address_complement: "",
  address_neighborhood: "",
  address_city: "",
  address_state: "",
  address_zip: "",
  plan_type: "trial",
};

type Props = {
  initialValues?: CompanyFormValues;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (values: CompanyFormValues) => void | Promise<void>;
  onCancel: () => void;
  extraActions?: React.ReactNode;
};

type Errors = Partial<Record<keyof CompanyFormValues, string>>;

function validate(values: CompanyFormValues): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = "Informe o nome.";
  if (!values.legal_name.trim()) errors.legal_name = "Informe a razão social.";
  const doc = unmask(values.document);
  if (!doc) errors.document = "Informe o CNPJ.";
  else if (doc.length !== 14) errors.document = "CNPJ deve ter 14 dígitos.";
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Email inválido.";
  }
  if (values.address_state && values.address_state.length !== 2) {
    errors.address_state = "UF inválida.";
  }
  return errors;
}

export function CompanyForm({
  initialValues = emptyCompany,
  submitLabel,
  submitting = false,
  onSubmit,
  onCancel,
  extraActions,
}: Props) {
  const [values, setValues] = useState<CompanyFormValues>(initialValues);
  const [errors, setErrors] = useState<Errors>({});

  function update<K extends keyof CompanyFormValues>(key: K, value: CompanyFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validate(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;
    await onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Dados da empresa
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" required error={errors.name}>
            <Input
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              maxLength={120}
            />
          </Field>
          <Field label="Razão Social" required error={errors.legal_name}>
            <Input
              value={values.legal_name}
              onChange={(e) => update("legal_name", e.target.value)}
              maxLength={160}
            />
          </Field>
          <Field label="CNPJ" required error={errors.document}>
            <Input
              value={values.document}
              onChange={(e) => update("document", maskCNPJ(e.target.value))}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
            />
          </Field>
          <Field label="Telefone" error={errors.phone}>
            <Input
              value={values.phone}
              onChange={(e) => update("phone", maskPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              inputMode="tel"
            />
          </Field>
          <Field label="Email" error={errors.email} className="sm:col-span-2">
            <Input
              type="email"
              value={values.email}
              onChange={(e) => update("email", e.target.value)}
              maxLength={160}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Endereço
        </h2>
        <div className="grid gap-4 sm:grid-cols-6">
          <Field label="Logradouro" className="sm:col-span-4">
            <Input
              value={values.address_street}
              onChange={(e) => update("address_street", e.target.value)}
              maxLength={160}
            />
          </Field>
          <Field label="Número" className="sm:col-span-2">
            <Input
              value={values.address_number}
              onChange={(e) => update("address_number", e.target.value)}
              maxLength={20}
            />
          </Field>
          <Field label="Complemento" className="sm:col-span-3">
            <Input
              value={values.address_complement}
              onChange={(e) => update("address_complement", e.target.value)}
              maxLength={80}
            />
          </Field>
          <Field label="Bairro" className="sm:col-span-3">
            <Input
              value={values.address_neighborhood}
              onChange={(e) => update("address_neighborhood", e.target.value)}
              maxLength={80}
            />
          </Field>
          <Field label="Cidade" className="sm:col-span-3">
            <Input
              value={values.address_city}
              onChange={(e) => update("address_city", e.target.value)}
              maxLength={80}
            />
          </Field>
          <Field label="Estado" error={errors.address_state} className="sm:col-span-1">
            <Select
              value={values.address_state || undefined}
              onValueChange={(v) => update("address_state", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {UF_LIST.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="CEP" className="sm:col-span-2">
            <Input
              value={values.address_zip}
              onChange={(e) => update("address_zip", maskCEP(e.target.value))}
              placeholder="00000-000"
              inputMode="numeric"
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Plano
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tipo de plano">
            <Select
              value={values.plan_type}
              onValueChange={(v) => update("plan_type", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLAN_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>{extraActions}</div>
        <div className="flex gap-3 sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs font-medium text-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}