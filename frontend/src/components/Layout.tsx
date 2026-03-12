import { Outlet, Link, useLocation } from 'react-router-dom';

export function Layout() {
  const location = useLocation();

  return (
    <div className="layout">
      <nav className="layout-nav">
        <Link to="/" className="layout-nav-brand">
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
            Submit
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
            <h4>LooFinder</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/map">Find toilets</Link></li>
              <li><Link to="/submit">Submit a toilet</Link></li>
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
