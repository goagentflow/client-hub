import type { LucideIcon } from "lucide-react";

interface ComingSoonPlaceholderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function ComingSoonPlaceholder({
  icon: Icon,
  title,
  description = "This feature is on its way. We'll let you know when it's ready.",
}: ComingSoonPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="h-14 w-14 rounded-full bg-[hsl(var(--bold-royal-blue))]/10 flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-[hsl(var(--bold-royal-blue))]" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-[hsl(var(--dark-grey))] mb-1">
        {title}
      </h3>
      <p className="text-sm text-[hsl(var(--medium-grey))] max-w-sm">
        {description}
      </p>
      <span className="mt-3 inline-block text-xs font-medium text-[hsl(var(--bold-royal-blue))]/70 bg-[hsl(var(--bold-royal-blue))]/5 px-3 py-1 rounded-full">
        Coming Soon
      </span>
    </div>
  );
}
