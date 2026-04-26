import React from 'react';
import {
  Facebook,
  Twitter,
  Instagram,
  Github,
  Youtube
} from 'lucide-react';
import { cn } from '@smart/lib/utils';

interface SocialLinkProps {
  icon: React.ReactNode;
  href: string;
  label: string;
}

function SocialLink({ icon, href, label }: SocialLinkProps) {
  return (
    <a
      href={href}
      aria-label={label}
      className={cn(
        "group flex items-center justify-center w-10 h-10 rounded-full",
        "bg-gray-100 dark:bg-neutral-900",
        "text-gray-500 dark:text-gray-400 hover:text-white dark:hover:text-white",
        "hover:bg-blue-600 dark:hover:bg-blue-500",
        "transition-all duration-300 ease-out transform hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20"
      )}
    >
      {React.cloneElement(icon as React.ReactElement, { size: 18, className: "group-hover:scale-110 transition-transform duration-300" })}
    </a>
  );
}

export default function SocialLinks() {
  const socials = [
    { icon: <Facebook />, href: '#', label: 'Facebook' },
    { icon: <Twitter />, href: '#', label: 'Twitter' },
    { icon: <Instagram />, href: '#', label: 'Instagram' },
    { icon: <Github />, href: '#', label: 'GitHub' },
    { icon: <Youtube />, href: '#', label: 'YouTube' },
  ];

  return (
    <div className="flex gap-3">
      {socials.map((social) => (
        <SocialLink key={social.label} {...social} />
      ))}
    </div>
  );
}
