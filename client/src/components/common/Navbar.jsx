import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Menu, X, User, LogOut, LayoutDashboard, ChevronDown, Globe } from 'lucide-react';
import logoImg from '../../images/logo.png';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-150 relative py-1 ${
      isActive
        ? 'text-primary-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-600 after:rounded-full'
        : 'text-brand-muted hover:text-primary-600'
    }`;

  return (
    <nav
      className={`sticky top-0 z-50 bg-white transition-shadow duration-200 ${
        scrolled ? 'shadow-sm border-b border-brand-border' : 'shadow-navbar'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[4.5rem]">

          {/* ── Logo ────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <img
              src={logoImg}
              alt="Ghumfir"
              className="h-10 sm:h-11 w-auto  transition-transform duration-200 group-hover:scale-150"
            />
          </Link>

          {/* ── Desktop Nav Links ────────────────────── */}
          <div className="hidden md:flex items-center gap-7">
            <NavLink to="/" end className={navLinkClass}>Home</NavLink>
            <NavLink to="/packages" className={navLinkClass}>
              <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />Packages</span>
            </NavLink>
          </div>

          {/* ── Auth Area ────────────────────────────── */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 bg-brand-bg hover:bg-primary-50 border border-brand-border rounded-xl px-3 py-2 transition-colors"
                >
                  <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-brand-text">{user.name?.split(' ')[0]}</span>
                  <ChevronDown className={`w-4 h-4 text-brand-muted transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropOpen(false)} />
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-brand-border py-1.5 z-50 animate-fade-in">
                      <div className="px-4 py-2 mb-1 border-b border-brand-border">
                        <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Signed in as</p>
                        <p className="text-sm font-semibold text-brand-text truncate">{user.name}</p>
                      </div>
                      <Link to="/profile" onClick={() => setDropOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-brand-text hover:bg-brand-bg transition-colors">
                        <User className="w-4 h-4 text-brand-muted" /> My Profile
                      </Link>
                      <Link to="/bookings" onClick={() => setDropOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-brand-text hover:bg-brand-bg transition-colors">
                        <svg className="w-4 h-4 text-brand-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        My Bookings
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setDropOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors font-medium">
                          <LayoutDashboard className="w-4 h-4" /> Admin Panel
                        </Link>
                      )}
                      <div className="my-1 border-t border-brand-border" />
                      <button onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/login"
                  className="text-sm font-medium text-brand-muted hover:text-primary-600 transition-colors px-3 py-2">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-5">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile Hamburger ─────────────────────── */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-brand-muted hover:bg-brand-bg transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ──────────────────────────────── */}
      {menuOpen && (
        <div className="md:hidden border-t border-brand-border bg-white px-4 py-4 space-y-1 animate-fade-in">
          <Link to="/" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-text hover:bg-brand-bg">
            Home
          </Link>
          <Link to="/packages" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-text hover:bg-brand-bg">
            <Globe className="w-4 h-4 text-brand-muted" /> Packages
          </Link>
          {user ? (
            <>
              <Link to="/profile" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-text hover:bg-brand-bg">
                <User className="w-4 h-4 text-brand-muted" /> Profile
              </Link>
              <Link to="/bookings" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-text hover:bg-brand-bg">
                My Bookings
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-primary-600 bg-primary-50">
                  <LayoutDashboard className="w-4 h-4" /> Admin Panel
                </Link>
              )}
              <div className="pt-1 border-t border-brand-border mt-2">
                <button onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2 border-t border-brand-border mt-2">
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="btn-outline text-sm py-2.5 text-center">
                Sign In
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                className="btn-primary text-sm py-2.5 text-center">
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
