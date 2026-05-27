export interface CsvRow {
  internal_id: string;
  display_name: string;
  treatment_name: string;
  provider_name: string;
  last_treatment_date: string;
  next_due_date: string;
  phone_optional?: string;
  email_optional?: string;
  notes?: string;
}

export interface ParsedRow extends CsvRow {
  _valid: boolean;
  _errors: string[];
  _rowIndex: number;
}

export function validateCsvRow(row: Partial<CsvRow>, index: number): ParsedRow {
  const errors: string[] = [];

  if (!row.internal_id?.trim()) errors.push("internal_id is required");
  if (!row.display_name?.trim()) errors.push("display_name is required");
  if (!row.treatment_name?.trim()) errors.push("treatment_name is required");
  if (!row.provider_name?.trim()) errors.push("provider_name is required");

  if (row.last_treatment_date && isNaN(Date.parse(row.last_treatment_date))) {
    errors.push("last_treatment_date is not a valid date");
  }
  if (row.next_due_date && isNaN(Date.parse(row.next_due_date))) {
    errors.push("next_due_date is not a valid date");
  }

  return {
    internal_id: row.internal_id ?? "",
    display_name: row.display_name ?? "",
    treatment_name: row.treatment_name ?? "",
    provider_name: row.provider_name ?? "",
    last_treatment_date: row.last_treatment_date ?? "",
    next_due_date: row.next_due_date ?? "",
    phone_optional: row.phone_optional,
    email_optional: row.email_optional,
    notes: row.notes,
    _valid: errors.length === 0,
    _errors: errors,
    _rowIndex: index,
  };
}

export const CSV_TEMPLATE_HEADERS = [
  "internal_id",
  "display_name",
  "treatment_name",
  "provider_name",
  "last_treatment_date",
  "next_due_date",
  "phone_optional",
  "email_optional",
  "notes",
].join(",");

export const CSV_TEMPLATE_EXAMPLE = `${CSV_TEMPLATE_HEADERS}
PT-001,J. Smith,Vivitrol,Dr. Jones,2026-04-15,2026-05-15,555-0100,jsmith@example.com,Monthly injection
PT-002,M. Brown,Ketamine Maintenance,Dr. Patel,2026-04-28,2026-05-26,,mbrowncare@example.com,Maintenance phase`;
