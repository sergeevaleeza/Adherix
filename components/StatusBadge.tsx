import { STATUS_CONFIG, type TreatmentStatus } from "@/lib/status";

interface Props {
  status: TreatmentStatus | string;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "md" }: Props) {
  const cfg = STATUS_CONFIG[status as TreatmentStatus] ?? {
    label: status,
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
    borderColor: "border-gray-300",
  };

  const sizeClass = size === "sm" ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-1";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${cfg.bgColor} ${cfg.textColor} ${cfg.borderColor} ${sizeClass}`}
    >
      {cfg.label}
    </span>
  );
}
