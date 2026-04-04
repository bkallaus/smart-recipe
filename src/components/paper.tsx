export const Paper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className="bg-[hsl(var(--surface-container-low))] p-6 rounded-xl"
      style={{ boxShadow: "none" }}
    >
      {children}
    </div>
  );
};
