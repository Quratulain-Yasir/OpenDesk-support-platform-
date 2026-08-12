'use client';

import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-muted-foreground mb-4">
        Welcome, {user?.name || 'User'}
      </p>
      <button
        onClick={logout}
        className="px-4 py-2 border text-sm hover:bg-muted"
      >
        Logout
      </button>
    </div>
  );
}