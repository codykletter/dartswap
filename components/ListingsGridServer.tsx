import connectDB from '@/lib/mongodb';
import Listing from '@/models/Listing';
import User from '@/models/User';
import ListingCard from './ListingCard';

interface ListingData {
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

export default async function ListingsGridServer() {
  let listings: ListingData[] = [];
  let error: string | null = null;

  try {
    await connectDB();
    
    // Fetch listings
    const listingsData = await Listing.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch all unique seller IDs
    const sellerIds = [...new Set(listingsData.map(l => l.seller.toString()))];
    
    // Fetch all sellers in one query
    const sellers = await User.find({ _id: { $in: sellerIds } })
      .select('name email')
      .lean();
    
    // Create a map of seller ID to seller data
    const sellerMap = new Map(
      sellers.map(s => [s._id.toString(), s])
    );

    // Map listings with seller data
    listings = listingsData.map((listing) => {
      const seller = sellerMap.get(listing.seller.toString());
      return {
        id: listing._id.toString(),
        title: listing.title,
        description: listing.description,
        price: listing.price,
        category: listing.category,
        imageUrl: listing.imageUrl,
        images: listing.images,
        seller: {
          id: listing.seller.toString(),
          name: seller?.name || 'Unknown',
        },
        status: listing.status,
        createdAt: listing.createdAt.toISOString(),
      };
    });
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to fetch listings';
    console.error('Error fetching listings:', err);
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-error mb-4">{error}</p>
        <p className="text-text-secondary">
          Please check your database connection and try refreshing the page.
        </p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary text-lg">
          No listings yet. Be the first to sell something!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}