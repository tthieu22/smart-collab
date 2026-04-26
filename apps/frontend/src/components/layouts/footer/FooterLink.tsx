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
      "relative group py-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 ease-in-out cursor-pointer",
      className
    )}>
      {children}
      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-300 ease-in-out group-hover:w-full" />
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
