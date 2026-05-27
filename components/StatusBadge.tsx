import { STATUS_CONFIG, type TreatmentStatus } from "@/lib/status";

interface Props {
  status: TreatmentStatus | string;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "md" }: Props) {
  const s = STATUS_CONFIG[status as TreatmentStatus] ?? {
    label: status,
    bgColor: "#F9FAFB",
    textColor: "#6B7280",
    borderColor: "#E5E7EB",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: s.bgColor,
        color: s.textColor,
        border: `1px solid ${s.borderColor}`,
        borderRadius: 20,
        padding: size === "sm" ? "2px 8px" : "4px 10px",
        fontSize: size === "sm" ? 11 : 12,
        fontWeight: 600,
        fontFamily: "var(--font-inter)",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: s.textColor,
          flexShrink: 0,
        }}
      />
      {s.label}
    </span>
  );
}
