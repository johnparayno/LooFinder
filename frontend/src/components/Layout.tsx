import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LooFinderLogo } from './LooFinderLogo';

export function Layout() {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="layout">
      {!isOnline && (
        <div className="pwa-offline-banner" role="status">
          You&apos;re offline. Cached content may be shown.
        </div>
      )}
      <nav className="layout-nav">
        <Link to="/" className="layout-nav-brand">
          <LooFinderLogo className="layout-nav-brand-logo" />
          LooFinder
        </Link>
        <div className="layout-nav-links">
          <Link
            to="/"
            className={`layout-nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link
            to="/map"
            className={`layout-nav-link ${location.pathname === '/map' ? 'active' : ''}`}
          >
            Map
          </Link>
          <Link
            to="/submit"
            className={`layout-nav-link ${location.pathname === '/submit' ? 'active' : ''}`}
          >
            Add
          </Link>
          <Link
            to="/donate"
            className={`layout-nav-link ${location.pathname === '/donate' ? 'active' : ''}`}
          >
            Donate
          </Link>
        </div>
      </nav>
      <main className={`layout-main ${location.pathname === '/map' ? 'layout-main-map' : ''}`}>
        <div className="layout-main-content">
          <Outlet />
        </div>
        {location.pathname !== '/map' && (
        <footer className="layout-footer">
        <div className="layout-footer-inner">
          <div className="layout-footer-section">
            <h4 className="layout-footer-brand">
              <LooFinderLogo className="layout-footer-brand-logo" />
              LooFinder
            </h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/map">Find toilets</Link></li>
              <li><Link to="/submit">Add a toilet</Link></li>
            </ul>
          </div>
          <div className="layout-footer-section">
            <h4>Support</h4>
            <ul>
              <li><Link to="/donate">Donate</Link></li>
              <li><a href="#help">Help</a></li>
            </ul>
          </div>
        </div>
        <div className="layout-footer-bottom">
          © {new Date().getFullYear()} LooFinder · Copenhagen toilet finder
        </div>
      </footer>
        )}
      </main>
    </div>
  );
}
