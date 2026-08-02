// components/ui/StatCard.tsx
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label:     string;
  value:     number | string;
  sub?:      string;
  subColor?: string;
  href?:     string;
  icon?:     LucideIcon;
  iconBg?:   string;
  iconColor?:string;
}

export default function StatCard({
  label,
  value,
  sub,
  subColor  = "text-gray-500",
  href,
  icon: Icon,
  iconBg    = "bg-blue-50 dark:bg-blue-900/30",
  iconColor = "text-blue-600 dark:text-blue-400",
}: StatCardProps) {
  const inner = (
    <div className="card p-5 hover:shadow-md transition-all group flex items-start gap-4">
      {Icon && (
        <div className={`${iconBg} rounded-xl p-3 shrink-0 group-hover:scale-105 transition-transform`}>
          <Icon className={iconColor} size={22} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
          {label}
        </p>
        <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">
          {value}
        </p>
        {sub && (
          <p className={`text-xs mt-1 font-medium ${subColor}`}>{sub}</p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
