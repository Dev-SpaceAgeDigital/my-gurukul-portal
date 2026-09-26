import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Super Admin Governance Portal',
  description: 'Super Administrative Governance Control Center',
};

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
