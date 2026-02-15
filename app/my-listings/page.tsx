'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ListingCard from '@/components/ListingCard';
import Link from 'next/link';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  images?: string[];
  seller: {
    id: string;
    name: string;
  };
  status: string;
  createdAt: string;
}

export default function MyListingsPage() {
  const { user, loading: authLoading, mounted } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push('/login?returnUrl=/my-listings');
    }
  }, [user, authLoading, mounted, router]);

  useEffect(() => {
    if (user) {
      fetchMyListings();
    }
  }, [user]);

  const fetchMyListings = async () => {
    try {
      const response = await fetch('/api/listings');
      if (!response.ok) throw new Error('Failed to fetch listings');
      
      const data = await response.json();
      // Filter listings to only show current user's listings
      const myListings = data.listings.filter(
        (listing: Listing) => listing.seller.id === user?.id
      );
      setListings(myListings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking auth
  if (!mounted || authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-text mb-8">My Listings</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="bg-border h-48 rounded-lg mb-4"></div>
              <div className="bg-border h-4 rounded mb-2"></div>
              <div className="bg-border h-4 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-text mb-8">My Listings</h1>
        <div className="text-center py-12">
          <p className="text-error mb-4">{error}</p>
          <button onClick={fetchMyListings} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-text">My Listings</h1>
        <Link href="/sell" className="btn-primary">
          Create New Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-12 card">
          <svg
            className="w-16 h-16 mx-auto text-text-secondary mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-text-secondary text-lg mb-4">
            You haven't created any listings yet.
          </p>
          <Link href="/sell" className="btn-primary inline-block">
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}