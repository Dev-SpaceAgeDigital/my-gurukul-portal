'use client';

import { ShieldCheck } from 'lucide-react';
import LoginForm from '@/components/layout/LoginForm';

export default function SuperAdminLoginPage() {
  return (
    <LoginForm
      roleName="Superadmin"
      loginEndpoint="/api/auth/login/superadmin"
      accentColor="indigo"
      roleIcon={<ShieldCheck size={16} />}
    />
  );
}

