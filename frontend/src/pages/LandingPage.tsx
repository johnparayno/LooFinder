import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { countToilets } from '../services/api';

/** Approximate bounding box for Denmark (mainland + major islands). */
const DENMARK_BBOX = '54.45,8.05,57.96,15.55';

function formatThousandsDot(n: number): string {
  const s = String(Math.max(0, Math.round(n)));
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const featurePictogramSvgProps = {
  className: 'landing-feature-pictogram',
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true as const,
};

export function LandingPage() {
  const [counterValue, setCounterValue] = useState(0);
  const [counterReady, setCounterReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const animateTo = (target: number) => {
      const start = performance.now();
      const durationMs = 950;
      const frame = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - start) / durationMs);
        const eased = 1 - (1 - t) ** 2;
        setCounterValue(Math.round(eased * target));
        if (t < 1) requestAnimationFrame(frame);
        else setCounterValue(target);
      };
      requestAnimationFrame(frame);
    };

    (async () => {
      try {
        const total = await countToilets({ bbox: DENMARK_BBOX });
        if (cancelled) return;
        setCounterReady(true);
        animateTo(total);
      } catch {
        if (!cancelled) setCounterReady(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <section className="landing-hero">
        <h1>Find toilets in Copenhagen, quickly.</h1>
        <p className="tagline">
          LooFinder helps you locate nearby toilets when you need them. Free, mobile-first, and built for residents and visitors.
        </p>
        <Link to="/map" className="landing-hero-cta">
          Find toilet
        </Link>
        {counterReady && (
          <p className="landing-hero-counter" aria-live="polite">
            <span className="landing-hero-counter-num">{formatThousandsDot(counterValue)}</span> toilets in Denmark
          </p>
        )}
      </section>

      <section className="landing-section">
        <h2>How it helps</h2>
        <p>
          Open the map, see toilet markers across the city, and tap &quot;Find nearest toilet&quot; to get the closest option. Each toilet shows access conditions, opening hours, and verification status so you know what to expect before you go.
        </p>
        <div className="landing-features">
          <div className="landing-feature-card">
            <svg {...featurePictogramSvgProps}>
              <rect
                x="3"
                y="11"
                width="18"
                height="11"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M7 11V7a5 5 0 0 1 9.9-1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h3>Free & public</h3>
            <p>No payment or code required. Open to everyone when you need it.</p>
          </div>
          <div className="landing-feature-card">
            <svg {...featurePictogramSvgProps}>
              <path
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="m9 12 2 2 4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h3>Verified & up to date</h3>
            <p>Community-driven data with verification status so you can trust the info.</p>
          </div>
          <div className="landing-feature-card">
            <svg {...featurePictogramSvgProps}>
              <rect
                x="5"
                y="2"
                width="14"
                height="20"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="8"
                y1="6"
                x2="16"
                y2="6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="12" cy="19" r="1.25" fill="currentColor" stroke="none" />
            </svg>
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
            Find toilet
          </Link>
          <Link to="/submit" className="landing-nav-link">
            Add a toilet
          </Link>
          <Link to="/donate" className="landing-nav-link">
            Support the project
          </Link>
        </nav>
      </section>
    </>
  );
}
