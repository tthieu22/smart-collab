import { Header, Footer, Sidebar } from '@smart/components/layouts';

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <Header />

      {/* Body */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-gray-200 hidden lg:flex flex-col">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4">{children}</main>

        {/* Right Sidebar */}
        <aside className="w-80 border-l border-gray-200 hidden xl:flex flex-col">
          <div className="p-4">Right Sidebar</div>
        </aside>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
