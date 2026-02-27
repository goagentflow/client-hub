import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const TabsIdContext = React.createContext<string | null>(null);

function sanitizeValue(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ children, ...props }, ref) => {
  const reactId = React.useId();
  const tabsId = React.useMemo(() => `tabs-${reactId.replace(/:/g, "")}`, [reactId]);

  return (
    <TabsIdContext.Provider value={tabsId}>
      <TabsPrimitive.Root ref={ref} {...props}>
        {children}
      </TabsPrimitive.Root>
    </TabsIdContext.Provider>
  );
});
Tabs.displayName = TabsPrimitive.Root.displayName;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, id, ...props }, ref) => {
  const tabsId = React.useContext(TabsIdContext);
  const valueKey = typeof props.value === "string" ? sanitizeValue(props.value) : null;
  const triggerId = id ?? (tabsId && valueKey ? `${tabsId}-trigger-${valueKey}` : undefined);
  const controlsId = tabsId && valueKey ? `${tabsId}-content-${valueKey}` : undefined;

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      id={triggerId}
      aria-controls={props["aria-controls"] ?? controlsId}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, id, ...props }, ref) => {
  const tabsId = React.useContext(TabsIdContext);
  const valueKey = typeof props.value === "string" ? sanitizeValue(props.value) : null;
  const contentId = id ?? (tabsId && valueKey ? `${tabsId}-content-${valueKey}` : undefined);
  const labelledBy = tabsId && valueKey ? `${tabsId}-trigger-${valueKey}` : undefined;

  return (
    <TabsPrimitive.Content
      ref={ref}
      id={contentId}
      aria-labelledby={props["aria-labelledby"] ?? labelledBy}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    />
  );
});
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
