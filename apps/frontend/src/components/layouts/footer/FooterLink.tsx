import React from 'react';
import Link from 'next/link';
import { cn } from '@smart/lib/utils';

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}

export default function FooterLink({ href, children, className, external }: FooterLinkProps) {
  const isExternal = external || href.startsWith('http');

  const content = (
    <span className={cn(
      "relative group py-1.5 text-[14px] font-medium text-gray-500 dark:text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 ease-out cursor-pointer",
      className
    )}>
      {children}
    </span>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link href={href}>
      {content}
    </Link>
  );
}
