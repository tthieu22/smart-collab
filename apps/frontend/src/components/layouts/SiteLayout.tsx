import { Header, Footer, Sidebar } from '@smart/components/layouts';
import { cn } from '@smart/lib/utils';

export default function SiteLayout({
  children,
  leftSidebar,
  rightSidebar,
  hideFooter = false,
  fullWidth = false,
  hideLeftSidebar = false,
  hideRightSidebar = false,
  noScroll = false,
}: {
  children: React.ReactNode;
  leftSidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
  hideFooter?: boolean;
  fullWidth?: boolean;
  hideLeftSidebar?: boolean;
  hideRightSidebar?: boolean;
  noScroll?: boolean;
}) {
  return (
    <div className={cn(
      "flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-neutral-950 dark:text-gray-100",
      noScroll && "h-screen overflow-hidden"
    )}>
      <div className="sticky top-0 z-50">
        <Header />
      </div>

      <div
        className={cn(
          'mx-auto flex w-full flex-1 gap-4 px-3 py-4',
          fullWidth ? 'max-w-none' : 'max-w-[1400px]',
          noScroll && 'h-full overflow-hidden'
        )}
      >
        {!hideLeftSidebar ? (
          <aside
            className={cn(
              'hidden lg:flex lg:w-72 xl:w-80',
              'sticky top-[72px] h-[calc(100vh-84px)] overflow-y-auto',
            )}
          >
            <div className="w-full rounded-xl border border-gray-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
              {leftSidebar ?? <Sidebar />}
            </div>
          </aside>
        ) : null}

        <main className="min-w-0 flex-1">{children}</main>

        {!hideRightSidebar ? (
          <aside
            className={cn(
              'hidden xl:flex xl:w-80',
              'sticky top-[72px] h-[calc(100vh-84px)] overflow-y-auto',
            )}
          >
            <div className="w-full rounded-xl border border-gray-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
              {rightSidebar ?? (
                <div className="text-sm text-gray-500 dark:text-gray-400">Right Sidebar</div>
              )}
            </div>
          </aside>
        ) : null}
      </div>

      {!hideFooter ? <Footer /> : null}
    </div>
  );
}
