/**
 * Tours/Packages Page Component
 * 
 * Displays all available tour packages with advanced filtering and sorting capabilities.
 * 
 * Features:
 * - Linear search filtering by 7 criteria (destination, category, price, rating, duration, budget, search text)
 * - Bubble sort with 7 sorting modes (new, old, price asc/desc, duration asc/desc, rating)
 * - Collapsible filter panel with real-time updates using useMemo for optimization
 * - Responsive grid layout for package cards
 * 
 * Data flow:
 * 1. Fetch all packages on mount
 * 2. Apply filters using linearFilterTours() - O(n) single pass
 * 3. Apply sorting using bubbleSortTours() - O(n²) nested loops
 * 4. Display filtered/sorted results in responsive grid
 */

import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { packageAPI } from '../../api/index.js';
import PackageCard from '../../components/common/PackageCard.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

const getDurationBucket = (days) => {
  if (days <= 3) return 'short';
  if (days <= 7) return 'medium';
  return 'long';
};

/**
 * Categorizes tour price into predefined budget buckets for filtering
 * @param {number} price - Tour price in currency units
 * @returns {string} Budget category: 'budget' (< 15000), 'standard' (15000-50000), or 'premium' (> 50000)
 */
const getBudgetBucket = (price) => {
  if (price < 15000) return 'budget';
  if (price <= 50000) return 'standard';
  return 'premium';
};

/**
 * LINEAR SEARCH ALGORITHM
 * Time Complexity: O(n*m) where n = number of packages, m = filter criteria
 * 
 * Filters tour packages by iterating through all packages once and applying filters sequentially:
 * 1. Destination matching
 * 2. Activity category matching
 * 3. Price range (minPrice <= price <= maxPrice)
 * 4. Minimum rating threshold
 * 5. Duration range (minDuration <= duration <= maxDuration)
 * 6. Budget bucket (budget, standard, premium)
 * 7. Search text matching across title, destination, country, category, description
 * 
 * Returns array of packages that match ALL filter criteria (AND logic)
 */
const linearFilterTours = ({
  tours,
  search,
  destination,
  category,
  minPrice,
  maxPrice,
  minRating,
  minDuration,
  maxDuration,
  budget,
}) => {
  const normalizedSearch = search.trim().toLowerCase();
  const minPriceValue = Number(minPrice) || 0;
  const maxPriceValue = maxPrice === '' ? Number.POSITIVE_INFINITY : Number(maxPrice);
  const minRatingValue = minRating === '' ? 0 : Number(minRating);
  const minDurationValue = Number(minDuration) || 1;
  const maxDurationValue = maxDuration === '' ? Number.POSITIVE_INFINITY : Number(maxDuration);
  const results = [];

  // Single pass through all packages
  for (let i = 0; i < tours.length; i += 1) {
    const tour = tours[i];
    const tourPrice = Number(tour.price) || 0;
    const tourDuration = Number(tour.duration) || 0;
    const tourRating = Number(tour.rating) || 0;

    if (destination && tour.destination !== destination) continue;
    if (category && tour.category !== category) continue;
    if (tourPrice < minPriceValue || tourPrice > maxPriceValue) continue;
    if (tourRating < minRatingValue) continue;
    if (tourDuration < minDurationValue || tourDuration > maxDurationValue) continue;
    if (budget && getBudgetBucket(Number(tour.price) || 0) !== budget) continue;

    if (normalizedSearch) {
      const searchableText = `${tour.title || ''} ${tour.destination || ''} ${tour.country || ''} ${tour.category || ''} ${tour.description || ''}`.toLowerCase();
      if (!searchableText.includes(normalizedSearch)) continue;
    }

    results.push(tour);
  }

  return results;
};

/**
 * BUBBLE SORT ALGORITHM
 * Time Complexity: O(n²) - Worst and average case
 * Space Complexity: O(n) - Creates sorted copy of array
 * 
 * Sorts tour packages using nested-loop bubble sort.
 * Supports 7 sort modes:
 * - 'newest': Most recently created first (descending date)
 * - 'oldest': Oldest created first (ascending date)
 * - 'price-asc': Lowest price first
 * - 'price-desc': Highest price first
 * - 'duration-asc': Shortest duration first
 * - 'duration-desc': Longest duration first
 * - 'rating-desc': Highest rating first
 * 
 * Process: Compare adjacent elements and swap if condition is met,
 * repeat until entire array is sorted.
 */
const bubbleSortTours = (tours, sortBy) => {
  if (!sortBy) return tours;

  const sorted = [...tours];

  // Outer loop: controls number of passes through array
  for (let i = 0; i < sorted.length - 1; i += 1) {
    // Inner loop: compares adjacent pairs and swaps if needed
    for (let j = 0; j < sorted.length - i - 1; j += 1) {
      const leftPrice = Number(sorted[j].price) || 0;
      const rightPrice = Number(sorted[j + 1].price) || 0;
      const leftDuration = Number(sorted[j].duration) || 0;
      const rightDuration = Number(sorted[j + 1].duration) || 0;
      const leftRating = Number(sorted[j].rating) || 0;
      const rightRating = Number(sorted[j + 1].rating) || 0;
      const leftCreatedAt = new Date(sorted[j].createdAt || 0).getTime();
      const rightCreatedAt = new Date(sorted[j + 1].createdAt || 0).getTime();

      let shouldSwap = false;
      if (sortBy === 'newest') shouldSwap = leftCreatedAt < rightCreatedAt;
      if (sortBy === 'oldest') shouldSwap = leftCreatedAt > rightCreatedAt;
      if (sortBy === 'price-asc') shouldSwap = leftPrice > rightPrice;
      if (sortBy === 'price-desc') shouldSwap = leftPrice < rightPrice;
      if (sortBy === 'duration-asc') shouldSwap = leftDuration > rightDuration;
      if (sortBy === 'duration-desc') shouldSwap = leftDuration < rightDuration;
      if (sortBy === 'rating-desc') shouldSwap = leftRating < rightRating;

      if (shouldSwap) {
        [sorted[j], sorted[j + 1]] = [sorted[j + 1], sorted[j]];
      }
    }
  }

  return sorted;
};

export default function Tours() {
  const [allTours, setAllTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [destination, setDestination] = useState('');
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [minDuration, setMinDuration] = useState('1');
  const [maxDuration, setMaxDuration] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const loadTours = async () => {
      setLoading(true);
      try {
        const { data } = await packageAPI.getAll();
        setAllTours(data.packages || []);
      } catch (error) {
        console.error('loadTours error:', error);
        setAllTours([]);
      } finally {
        setLoading(false);
      }
    };

    loadTours();
  }, []);

  const destinationOptions = useMemo(() => {
    const values = new Set();
    for (let i = 0; i < allTours.length; i += 1) {
      if (allTours[i].destination) values.add(allTours[i].destination);
    }
    return Array.from(values).sort();
  }, [allTours]);

  const categoryOptions = useMemo(() => {
    const values = new Set();
    for (let i = 0; i < allTours.length; i += 1) {
      if (allTours[i].category) values.add(allTours[i].category);
    }
    return Array.from(values).sort();
  }, [allTours]);

  const tours = useMemo(() => {
    const filtered = linearFilterTours({
      tours: allTours,
      search,
      destination,
      category,
      minPrice,
      maxPrice,
      minRating,
      minDuration,
      maxDuration,
      budget,
    });

    return bubbleSortTours(filtered, sortBy);
  }, [allTours, search, destination, category, minPrice, maxPrice, minRating, minDuration, maxDuration, budget, sortBy]);

  const clearAllFilters = () => {
    setSearch('');
    setDestination('');
    setCategory('');
    setBudget('');
    setMinPrice('0');
    setMaxPrice('');
    setMinRating('');
    setMinDuration('1');
    setMaxDuration('');
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-white border-b border-brand-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-text mb-1">Explore Tour Packages</h1>
          <p className="text-brand-muted text-sm mb-6">Smart filtering with linear scan and bubble sort ordering.</p>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_220px] gap-3 items-center">
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search destinations or packages..."
                className="input pl-9"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className="h-[46px] px-5 rounded-2xl border-2 border-primary-500 text-primary-700 font-semibold inline-flex items-center gap-2 hover:bg-primary-50 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input pr-3">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="duration-asc">Duration: Short to Long</option>
              <option value="duration-desc">Duration: Long to Short</option>
              <option value="rating-desc">Top Rated</option>
            </select>
          </div>

          {showFilters && (
            <div className="mt-5 bg-slate-100 border border-slate-200 rounded-3xl p-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Destination</label>
                  <select value={destination} onChange={(e) => setDestination(e.target.value)} className="input pr-3">
                    <option value="">All Destinations</option>
                    {destinationOptions.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Activity Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="input pr-3">
                    <option value="">All Categories</option>
                    {categoryOptions.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Budget</label>
                  <select value={budget} onChange={(e) => setBudget(e.target.value)} className="input pr-3">
                    <option value="">Any Budget</option>
                    <option value="budget">Budget (&lt; 15,000)</option>
                    <option value="standard">Standard (15,000-50,000)</option>
                    <option value="premium">Premium (&gt; 50,000)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Min Rating</label>
                  <select value={minRating} onChange={(e) => setMinRating(e.target.value)} className="input pr-3">
                    <option value="">Any Rating</option>
                    <option value="4.5">4.5+</option>
                    <option value="4">4.0+</option>
                    <option value="3.5">3.5+</option>
                    <option value="3">3.0+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Min Price (NPR)</label>
                  <input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" className="input" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Max Price (NPR)</label>
                  <input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="No limit" className="input" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Min Duration (days)</label>
                  <input type="number" min="1" value={minDuration} onChange={(e) => setMinDuration(e.target.value)} placeholder="1" className="input" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Max Duration (days)</label>
                  <input type="number" min="1" value={maxDuration} onChange={(e) => setMaxDuration(e.target.value)} placeholder="No limit" className="input" />
                </div>
              </div>

              <button type="button" onClick={clearAllFilters} className="mt-5 inline-flex items-center gap-2 text-red-500 hover:text-red-600 font-medium">
                <X className="w-4 h-4" />
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <LoadingSpinner />
        ) : tours.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.map((pkg) => (
              <PackageCard key={pkg._id} pkg={pkg} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-display text-xl font-semibold text-brand-text mb-2">No packages found</h3>
            <p className="text-brand-muted mb-6">Try adjusting your filters and sorting options.</p>
            <button onClick={clearAllFilters} className="btn-primary-navy">Clear Filters</button>
          </div>
        )}
      </div>
    </div>
  );
}