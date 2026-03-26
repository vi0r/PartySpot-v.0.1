export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 relative flex flex-col h-full overflow-hidden">
      {/* Scrollable content area */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-[88px]">
        {children}
      </main>
    </div>
  );
}
