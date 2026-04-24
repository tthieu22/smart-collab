import { Footer } from '@smart/components/layouts';
import { cn } from '@smart/lib/utils';
import { usePathname } from 'next/navigation';
import RightWidgets from '@smart/components/home/widgets/RightWidgets';

export default function SiteLayout({
  children,
  rightSidebar,
  hideFooter = false,
  fullWidth = false,
  hideRightSidebar = false,
  noScroll = false,
}: {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
  hideFooter?: boolean;
  fullWidth?: boolean;
  hideRightSidebar?: boolean;
  noScroll?: boolean;
}) {
  return (
    <div className={cn(
      "flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-neutral-950 dark:text-gray-100",
      noScroll && "h-screen overflow-hidden"
    )}>
      <div
        className={cn(
          'flex w-full flex-1 gap-4 px-3 py-4 transition-all duration-300',
          fullWidth ? 'max-w-none' : 'max-w-[1400px] mx-auto',
          noScroll && 'h-full overflow-hidden'
        )}
      >
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
