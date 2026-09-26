import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Campus Sub-Admin Portal',
  description: 'Campus Administration & Management Console',
};

export default function SubAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="subadmin-portal min-h-full flex flex-col">{children}</div>;
}
