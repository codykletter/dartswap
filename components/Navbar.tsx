'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout, loading, mounted } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className="bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">DartSwap</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {mounted && !loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/sell"
                      className="btn-primary"
                    >
                      Sell Item
                    </Link>
                    <Link
                      href="/my-listings"
                      className="text-text hover:text-primary transition-colors"
                    >
                      My Listings
                    </Link>
                    <Link
                      href="/messages"
                      className="text-text hover:text-primary transition-colors"
                    >
                      Messages
                    </Link>
                    <div className="flex items-center space-x-3">
                      <span className="text-text-secondary text-sm">
                        {user.name}
                      </span>
                      <button
                        onClick={handleLogout}
                        className="text-text hover:text-primary transition-colors text-sm"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-text hover:text-primary transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="btn-primary"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}