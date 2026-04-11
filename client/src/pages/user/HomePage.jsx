import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Star, TrendingUp, Shield, Headphones,
  ChevronRight, Compass, Clock, Users, ArrowRight, CheckCircle,
} from 'lucide-react';
import { packageAPI } from '../../api/index.js';
import PackageCard from '../../components/common/PackageCard.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=1800&q=90';

const DESTINATIONS = [
  { name: 'Kathmandu', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&q=80' },
  { name: 'Pokhara',   image: 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=400&q=80' },
  { name: 'Chitwan',   image: 'https://www.chitwanjungleguides.com/wp-content/uploads/2019/01/jeep-safari-in-chitwan-national-park.jpg' },
  { name: 'Everest',   image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&q=80' },
];

const FEATURES = [
  { icon: Shield,      title: 'Trusted & Safe',    desc: 'All guides are certified. Every package is vetted for safety and quality.' },
  { icon: Star,        title: 'Best Experiences',  desc: 'Handpicked itineraries that deliver truly unforgettable travel memories.' },
  { icon: Headphones,  title: '24/7 Support',      desc: 'Our team is always available so you never travel alone.' },
  { icon: TrendingUp,  title: 'Best Prices',       desc: 'Competitive pricing with zero hidden fees â€” real value every rupee.' },
];

const STATS = [
  { value: '125+', label: 'Tour Packages' },
  { value: '100+', label: 'Happy Travelers' },
  { value: '4.9', label: 'Average Rating' },
  { value: '2+',   label: 'Years Experience' },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [featured, setFeatured] = useState([]);
  const [destinationTourCounts, setDestinationTourCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [featuredRes, ...destinationRes] = await Promise.all([
          packageAPI.getFeatured(),
          ...DESTINATIONS.map((dest) => packageAPI.getAll({ search: dest.name, page: 1, limit: 1 })),
        ]);

        setFeatured(featuredRes.data.packages || []);

        const counts = DESTINATIONS.reduce((acc, dest, index) => {
          acc[dest.name] = destinationRes[index]?.data?.total || 0;
          return acc;
        }, {});
        setDestinationTourCounts(counts);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/packages?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="animate-fade-in">

      {/* Hero Section */}
      <section className="relative h-[92vh] min-h-[620px] flex items-center justify-center overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="Nepal mountains"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="hero-gradient absolute inset-0" />

        {/* Subtle bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-brand-bg to-transparent z-10" />

        <div className="relative z-20 text-center text-white px-4 max-w-4xl mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2 text-xs sm:text-sm font-medium mb-8">
            <Compass className="w-4 h-4 text-secondary-300" />
            Explore Nepal &amp; Beyond Curated by Experts
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold leading-[1.08] mb-6">
            Your Next Adventure<br />
            <span className="gradient-text">Starts Here</span>
          </h1>
          <p className="text-white/80 text-sm sm:text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Discover handpicked tours across the Himalayas, jungles, and cultural heartlands of Nepal and around the Worlds.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 bg-white rounded-2xl p-2 max-w-2xl mx-auto shadow-2xl"
          >
            <div className="flex items-center gap-2.5 flex-1 px-3">
              <Search className="w-5 h-5 text-brand-muted shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destinations, tours, activitiesâ€¦"
                className="flex-1 text-brand-text text-sm outline-none bg-transparent placeholder:text-brand-muted py-1.5"
              />
            </div>
            <button type="submit" className="btn-primary rounded-xl text-sm whitespace-nowrap shrink-0">
              Search Tours
            </button>
          </form>

          {/* Quick stats */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">{value}</div>
                <div className="text-xs text-white/60 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        {/* <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-1 h-2.5 bg-white/60 rounded-full animate-pulse" />
          </div>
        </div> */}
      </section>

      
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-label"><MapPin className="w-3.5 h-3.5" /> Top Picks</p>
            <h2 className="section-title mb-3">Popular Destinations</h2>
            <p className="section-subtitle max-w-lg mx-auto">
              The places our travelers fall in love with, again and again.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
            {DESTINATIONS.map((dest) => (
              <Link
                key={dest.name}
                to={`/packages?search=${dest.name}`}
                className="relative h-48 sm:h-60 md:h-72 rounded-2xl overflow-hidden group"
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-600"
                />
                {/* gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/75 via-transparent to-transparent" />
                {/* hover ring */}
                <div className="absolute inset-0 ring-2 ring-secondary-400 ring-opacity-0 group-hover:ring-opacity-60 rounded-2xl transition-all duration-300" />

                <div className="absolute bottom-4 left-4 text-white">
                  <div className="font-display font-bold text-lg sm:text-xl leading-tight">{dest.name}</div>
                  <div className="flex items-center gap-1 text-xs text-white/75 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {destinationTourCounts[dest.name] || 0} {destinationTourCounts[dest.name] === 1 ? 'tour' : 'tours'}
                  </div>
                </div>
                <div className="absolute top-3 right-3 glass rounded-full px-2.5 py-1 text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                  Explore <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          FEATURED PACKAGES
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="py-16 sm:py-24 bg-brand-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 gap-4">
            <div>
              <p className="section-label"><Star className="w-3.5 h-3.5" /> Editor's Choice</p>
              <h2 className="section-title mb-2">Featured Packages</h2>
              <p className="section-subtitle">Hand-picked tours loved by thousands of travelers.</p>
            </div>
            <Link
              to="/packages"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-accent-500 transition-colors"
            >
              View all packages <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((pkg) => <PackageCard key={pkg._id} pkg={pkg} />)}
            </div>
          ) : (
            <div className="text-center py-20 surface rounded-3xl">
              <Compass className="w-12 h-12 text-primary-200 mx-auto mb-4" />
              <p className="text-brand-muted mb-4">No featured packages yet. Check back soon!</p>
              <Link to="/packages" className="btn-primary-navy">Browse All Packages</Link>
            </div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Link to="/packages" className="btn-outline">View All Packages</Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            {/* Left: image collage */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                <img src="https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=400&q=80"
                  className="rounded-3xl h-56 w-full object-cover col-span-2" alt="" />
                <img src="https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=300&q=80"
                  className="rounded-2xl h-40 w-full object-cover" alt="" />
                <img src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=300&q=80"
                  className="rounded-2xl h-40 w-full object-cover" alt="" />
              </div>
              {/* floating badge */}
              <div className="absolute -bottom-4 -right-4 bg-white shadow-card-hover rounded-2xl px-5 py-4 border border-brand-border">
                <div className="text-3xl font-bold text-primary-600">4.9</div>
                <div className="flex gap-0.5 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                  ))}
                </div>
                <div className="text-xs text-brand-muted mt-0.5">10,000+ reviews</div>
              </div>
            </div>

            {/* Right: features */}
            <div>
              <p className="section-label"><CheckCircle className="w-3.5 h-3.5" /> Why Us</p>
              <h2 className="section-title mb-4">Why Choose Ghumfir?</h2>
              <p className="section-subtitle mb-10">
                We handle every detail so you can focus on making memories. Safe, curated, and affordable.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {FEATURES.map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="flex gap-4 p-5 rounded-2xl border border-brand-border bg-brand-bg hover:border-primary-200 hover:bg-primary-50/40 transition-all duration-200 group"
                  >
                    <div className="w-11 h-11 bg-primary-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-accent-400 transition-colors duration-200">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-semibold text-brand-text mb-1">{title}</h3>
                      <p className="text-xs text-brand-muted leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          CTA BAND
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="py-16 sm:py-20 overflow-hidden relative">
        {/* Background */}
        <div className="absolute inset-0 bg-primary-600" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #3FA7D6 0%, transparent 60%), radial-gradient(circle at 80% 50%, #FF7A59 0%, transparent 60%)' }} />

        <div className="relative max-w-3xl mx-auto px-4 text-center text-white">
          <p className="section-label text-secondary-300 mx-auto justify-center mb-4">
            <Users className="w-3.5 h-3.5" />
            10,000+ Happy Travelers
          </p>
          <h2 className="font-display text-3xl sm:text-5xl font-bold mb-5 leading-tight">
            Ready to Explore Nepal?
          </h2>
          <p className="text-primary-100 text-base sm:text-lg mb-10 max-w-xl mx-auto">
            Join thousands of adventurers who've discovered Nepal's magic with Ghumfir. Your dream trip is just a click away.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/packages"
              className="w-full sm:w-auto bg-white text-primary-700 hover:bg-secondary-50 font-semibold py-3.5 px-10 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              Browse Packages
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto border-2 border-white/60 text-white hover:bg-white/10 font-semibold py-3.5 px-10 rounded-xl transition-all duration-200"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

