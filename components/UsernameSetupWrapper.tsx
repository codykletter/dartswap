'use client';

import { useAuth } from '@/contexts/AuthContext';
import UsernameSetupModal from './UsernameSetupModal';

export default function UsernameSetupWrapper() {
  const { user, mounted, refreshUser } = useAuth();

  // Don't render anything until mounted (prevents hydration issues)
  if (!mounted) {
    return null;
  }

  // Check if user is logged in and hasn't set a username
  const shouldShowModal = user && user.hasSetUsername === false;

  return (
    <UsernameSetupModal
      isOpen={!!shouldShowModal}
      onComplete={refreshUser}
    />
  );
}
