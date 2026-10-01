/** Shared flat mock for @/components/ui/tabs — renders all tab contents for easy querying. */
export const Tabs = ({ children, defaultValue }: any) => (
  <div data-testid="tabs" data-default={defaultValue}>
    {children}
  </div>
);
/** Tabs List. */
export const TabsList = ({ children }: any) => <div data-testid="tabs-list">{children}</div>;
/** Tabs Trigger. */
export const TabsTrigger = ({ value, children }: any) => (
  <button data-testid={`tab-trigger-${value}`}>{children}</button>
);
/** Tabs Content. */
export const TabsContent = ({ value, children }: any) => (
  <div data-testid={`tab-content-${value}`}>{children}</div>
);
