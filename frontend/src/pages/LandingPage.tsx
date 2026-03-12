import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <>
      <section className="landing-hero">
        <h1>Find toilets in Copenhagen, quickly.</h1>
        <p className="tagline">
          LooFinder helps you locate nearby toilets when you need them. Free, mobile-first, and built for residents and visitors.
        </p>
        <Link to="/map" className="landing-hero-cta">
          Open map
        </Link>
      </section>

      <section className="landing-section">
        <h2>How it helps</h2>
        <p>
          Open the map, see toilet markers across the city, and tap &quot;Find nearest toilet&quot; to get the closest option. Each toilet shows access conditions, opening hours, and verification status so you know what to expect before you go.
        </p>
        <div className="landing-features">
          <div className="landing-feature-card">
            <h3>Free & public</h3>
            <p>No payment or code required. Open to everyone when you need it.</p>
          </div>
          <div className="landing-feature-card">
            <h3>Verified & up to date</h3>
            <p>Community-driven data with verification status so you can trust the info.</p>
          </div>
          <div className="landing-feature-card">
            <h3>Easy to use</h3>
            <p>Mobile-first design. Find what you need in seconds.</p>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2>Toilet categories</h2>
        <p>We show three types of toilets so you can choose what works for you:</p>
        <ul className="category-list">
          <li>
            <strong>Free</strong> — No payment or code required. Open to the public.
          </li>
          <li>
            <strong>Code required</strong> — You need a code (e.g., from a nearby shop or app) to access.
          </li>
          <li>
            <strong>Purchase required</strong> — You must buy something or pay a fee to use the toilet.
          </li>
        </ul>
        <nav className="landing-nav">
          <Link to="/map" className="landing-nav-link landing-nav-primary">
            Open map
          </Link>
          <Link to="/submit" className="landing-nav-link">
            Submit a toilet
          </Link>
          <Link to="/donate" className="landing-nav-link">
            Support the project
          </Link>
        </nav>
      </section>
    </>
  );
}
