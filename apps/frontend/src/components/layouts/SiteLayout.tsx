import { Header, Footer, Sidebar } from "@smart/components/layouts";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1">
        <aside className="w-64 border-r border-gray-200 hidden lg:block">
          <Sidebar />
        </aside>
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
        <aside className="w-80 border-l border-gray-200 hidden xl:block">
          <div className="p-4">Right Sidebar</div>
        </aside>
      </div>
      <Footer />
    </div>
  );
}
