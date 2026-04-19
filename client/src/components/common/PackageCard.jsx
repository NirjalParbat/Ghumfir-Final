import { Link } from 'react-router-dom';
import { MapPin, Clock, Star, ArrowRight } from 'lucide-react';

export default function PackageCard({ pkg }) {

  const coverImage =
    pkg.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=600&q=80';

  return (
    <Link to={`/packages/${pkg._id}`} className="card group block">
      {/* ── Image ─────────────────────────────────── */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={coverImage}
          alt={pkg.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* soft overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/50 via-transparent to-transparent" />

        {/* Category badge */}
        <span className="absolute top-3 left-3 bg-white/92 backdrop-blur-sm text-primary-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
          {pkg.category}
        </span>

        {/* Rating pill */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/92 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
          <span className="text-xs font-semibold text-brand-text">{pkg.rating?.toFixed(1) || '0.0'}</span>
          <span className="text-xs text-brand-muted">({pkg.numReviews || 0})</span>
        </div>

      </div>

      {/* ── Body ──────────────────────────────────── */}
      <div className="p-5">
        <h3 className="font-display font-semibold text-brand-text text-[1.05rem] leading-snug mb-1.5 line-clamp-1 group-hover:text-primary-600 transition-colors">
          {pkg.title}
        </h3>

        <div className="flex items-center gap-1.5 text-brand-muted mb-3">
          <MapPin className="w-3.5 h-3.5 text-secondary-400 shrink-0" />
          <span className="text-sm">{pkg.destination}, {pkg.country}</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-brand-muted mb-5">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{pkg.duration} days</span>
          </div>
        </div>

        {/* Footer: price + CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-brand-border">
          <div>
            <span className="text-[10px] text-brand-muted uppercase tracking-wide">From</span>
            <div className="font-bold text-primary-600 text-xl leading-tight">
              {pkg.currency} {pkg.price?.toLocaleString()}
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 btn-primary text-xs py-2 px-4">
            View <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
