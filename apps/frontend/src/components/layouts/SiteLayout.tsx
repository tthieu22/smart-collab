import { Footer, Sidebar } from '@smart/components/layouts';
import { cn } from '@smart/lib/utils';
import RightWidgets from '@smart/components/home/widgets/RightWidgets';

export default function SiteLayout({
  children,
  leftSidebar,
  rightSidebar,
  hideFooter = false,
  fullWidth = false,
  hideLeftSidebar = true,
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
      "flex min-h-screen flex-col bg-white text-gray-900 dark:bg-[#030303] dark:text-gray-100",
      noScroll && "h-screen overflow-hidden"
    )}>
      <div
        className={cn(
          'flex w-full flex-1 transition-all duration-300',
          fullWidth ? 'max-w-none p-0 gap-0' : 'max-w-7xl mx-auto gap-4 px-6 lg:px-8 py-2',
          noScroll && 'h-full overflow-hidden'
        )}
      >
        {!hideLeftSidebar ? (
          <aside
            className={cn(
              'hidden lg:flex lg:w-64 flex-col gap-4',
              'sticky top-[72px] h-[calc(100vh-84px)] overflow-y-auto pb-4 custom-scrollbar',
            )}
          >
            {leftSidebar ?? <Sidebar />}
          </aside>
        ) : null}

        <main className="min-w-0 flex-1">{children}</main>

        {!hideRightSidebar ? (
          <aside
            className={cn(
              'hidden xl:flex xl:w-80 flex-col gap-4',
              'sticky top-[72px] h-[calc(100vh-84px)] overflow-y-auto pb-4 custom-scrollbar',
            )}
          >
            {rightSidebar ?? <RightWidgets />}
          </aside>
        ) : null}
      </div>

      {!hideFooter ? <Footer /> : null}
    </div>
  );
}
