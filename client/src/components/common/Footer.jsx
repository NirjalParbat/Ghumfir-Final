import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter, ArrowUpRight } from 'lucide-react';
import logoImg from '../../images/logo.png';

const QUICK_LINKS = [
  ['Home', '/'],
  ['Packages', '/packages'],
  ['My Bookings', '/bookings'],
];

const SUPPORT_LINKS = [
  ['FAQ', '/'],
  ['Contact Us', '/'],
  ['Cancellation Policy', '/'],
  ['Privacy Policy', '/'],
];

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-white">
      {/* Main footer body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex mb-4 rounded-xl bg-white/95 px-3 py-2 ring-1 ring-white/60 shadow-lg backdrop-blur-sm">
              <img src={logoImg} alt="Ghumfir" className="h-12 w-auto object-contain" />
            </Link>
            <p className="text-sm text-primary-200 leading-relaxed mb-5 max-w-xs">
              Your trusted travel partner for curated tour packages across Nepal and beyond.
              Adventure, culture, and nature all in one place.
            </p>
            <div className="flex gap-2.5">
              {[
                { Icon: Facebook,  label: 'Facebook' },
                { Icon: Instagram, label: 'Instagram' },
                { Icon: Twitter,   label: 'Twitter' },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 bg-primary-800 hover:bg-secondary-400 rounded-lg flex items-center justify-center transition-colors duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-primary-300 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map(([label, path]) => (
                <li key={label}>
                  <Link
                    to={path}
                    className="text-sm text-primary-200 hover:text-secondary-300 transition-colors flex items-center gap-1 group"
                  >
                    {label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 transition-all duration-150" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

         
          <div>
            <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-primary-300 mb-4">
              Support
            </h3>
            <ul className="space-y-2.5">
              {SUPPORT_LINKS.map(([label, path]) => (
                <li key={label}>
                  <Link
                    to={path}
                    className="text-sm text-primary-200 hover:text-secondary-300 transition-colors flex items-center gap-1 group"
                  >
                    {label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 transition-all duration-150" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          
          <div>
            <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-primary-300 mb-4">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-secondary-400 mt-0.5 shrink-0" />
                <span className="text-sm text-primary-200">
                  Bharatpur, Chitwan, Nepal
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-secondary-400 shrink-0" />
                <a href="tel:+9779809211027" className="text-sm text-primary-200 hover:text-secondary-300 transition-colors">
                  +977 9809 211 027
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-secondary-400 shrink-0" />
                <a href="mailto:ghumfirsupport@gmail.com" className="text-sm text-primary-200 hover:text-secondary-300 transition-colors break-all">
                  ghumfirsupport@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

     
      <div className="border-t border-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-primary-400">
            © {new Date().getFullYear()} Ghumfir Tourism Pvt. Ltd. All rights reserved.
          </p>
          <p className="text-xs text-primary-400">
            Built with ❤️ for Nepal Tourism
          </p>
        </div>
      </div>
    </footer>
  );
}

