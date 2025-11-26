import { HubLayout } from "@/components/HubLayout";

export default function HubDetail() {
  return (
    <HubLayout>
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-lg text-[hsl(var(--medium-grey))]">
          Section content will appear here
        </p>
      </div>
    </HubLayout>
  );
}
