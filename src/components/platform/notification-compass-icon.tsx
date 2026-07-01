import { cn } from "@/lib/utils";

export function NotificationCompassIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-[18px] w-[18px]", className)}
      aria-hidden
    >
      <path
        d="M12 3L20 12L12 21L4 12L12 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 7V17" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M8 12H16" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}
