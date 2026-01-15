'use client';

import { Link } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { Separator } from '@/shared/components/ui/separator';
import { SidebarTrigger, useSidebar } from '@/shared/components/ui/sidebar';
import { cn } from '@/shared/lib/utils';
import { NavItem } from '@/shared/types/blocks/common';
import { SidebarFooter as SidebarFooterType } from '@/shared/types/blocks/dashboard';

import { LocaleSelector, ThemeToggler } from '../common';

export function SidebarFooter({ footer }: { footer: SidebarFooterType }) {
  const { open } = useSidebar();

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-x-4 border-t px-4 py-3',
          open ? 'w-full justify-start' : 'flex-col gap-y-4 px-2'
        )}
      >
        {footer.nav?.items?.map((item: NavItem, idx: number) => (
          <div className="hover:text-primary cursor-pointer shrink-0" key={idx}>
            <Link href={item.url || ''} target={item.target || '_self'}>
              {item.icon && (
                <SmartIcon
                  name={item.icon as string}
                  className="text-md"
                  size={20}
                />
              )}
            </Link>
          </div>
        ))}

        {open && <div className="flex-1"></div>}

        {!open && <SidebarTrigger className="h-6 w-6" />}

        {open && (footer.show_theme || footer.show_locale) && (
          <Separator orientation="vertical" className="h-4" />
        )}
        {footer.show_theme && <ThemeToggler />}
        {footer.show_locale && open && <LocaleSelector />}
      </div>
    </>
  );
}
