interface NavItemProps {
  href: string;
  label: string;
}

export function NavItem({ href, label }: NavItemProps) {
  return (
    <a
      href={href}
      className="px-3 py-2 rounded hover:bg-gray-200 transition-colors"
    >
      {label}
    </a>
  );
}
