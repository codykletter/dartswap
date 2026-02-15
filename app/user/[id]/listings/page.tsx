'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function UserListingsPage() {
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserAndListings();
    }
  }, [userId]);

  const fetchUserAndListings = async () => {
    try {
      // Fetch user info
      const userResponse = await fetch(`/api/users/${userId}`);
      if (!userResponse.ok) throw new Error('Failed to fetch user');
      const userData = await userResponse.json();
      setUser(userData.user);

      // Fetch all listings and filter by user
      const listingsResponse = await fetch('/api/listings');
      if (!listingsResponse.ok) throw new Error('Failed to fetch listings');
      const listingsData = await listingsResponse.json();
      
      // Filter listings for this user
      const userListings = listingsData.listings.filter(
        (listing: Listing) => listing.seller.id === userId
      );
      setListings(userListings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="bg-border h-8 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card">
                <div className="bg-border h-48 rounded-lg mb-4"></div>
                <div className="bg-border h-4 rounded mb-2"></div>
                <div className="bg-border h-4 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12 card">
          <p className="text-error mb-4">{error || 'User not found'}</p>
          <Link href="/" className="btn-primary inline-block">
            Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* User Info Header */}
      <div className="card mb-8">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text">{user.name}'s Listings</h1>
            <p className="text-text-secondary">Member since {memberSince}</p>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
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
            {user.name} hasn't created any listings yet.
          </p>
          <Link href="/" className="btn-primary inline-block">
            Browse All Listings
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-text-secondary">
              Showing {listings.length} {listings.length === 1 ? 'listing' : 'listings'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}