'use client';

import Link from 'next/link';
import Image from 'next/image';

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
    seller: {
      id: string;
      name: string;
    };
    status: string;
  };
}

export default function ListingCard({ listing }: ListingCardProps) {
  return (
    <Link href={`/listings/${listing.id}`} className="card hover:border-primary transition-colors cursor-pointer">
      {/* Image */}
      <div className="relative h-48 bg-border rounded-lg mb-4 overflow-hidden">
        {listing.imageUrl ? (
          <Image
            src={listing.imageUrl}
            alt={listing.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-text-secondary">
            No Image
          </div>
        )}
        {listing.status === 'sold' && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <span className="text-white font-bold text-xl">SOLD</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        <h3 className="text-lg font-semibold text-text mb-1 truncate">
          {listing.title}
        </h3>
        <p className="text-2xl font-bold text-primary mb-2">
          {listing.price === 0 ? 'Free' : `$${listing.price}`}
        </p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">{listing.category}</span>
          <span className="text-text-secondary">{listing.seller.name}</span>
        </div>
      </div>
    </Link>
  );
}