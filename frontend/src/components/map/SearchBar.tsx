/**
 * SearchBar - Floating rounded search bar for map.
 * Airbnb-inspired: clean, premium, rounded corners.
 */
import { useState, useRef, useEffect, useCallback } from 'react';

const DAWA_AUTOCOMPLETE = 'https://api.dataforsyningen.dk/autocomplete';

interface DawaSuggestion {
  type: string;
  tekst: string;
  forslagstekst: string;
  data?: { x?: number; y?: number };
}

export interface MapSearchBarProps {
  onSearch: (query: string) => void;
  onAddressSelect?: (address: string, lat: number, lng: number) => void;
  onLocateMe?: () => void;
  placeholder?: string;
}

export function MapSearchBar({
  onSearch,
  onAddressSelect,
  onLocateMe,
  placeholder = 'Search address or Near me…',
}: MapSearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<DawaSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNearMe, setShowNearMe] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${DAWA_AUTOCOMPLETE}?q=${encodeURIComponent(trimmed)}&caretpos=${trimmed.length}`
      );
      const data = (await res.json()) as DawaSuggestion[];
      setSuggestions(Array.isArray(data) ? data : []);
      setSelectedIndex(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
      setShowSuggestions(true);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setShowNearMe(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim().toLowerCase();
    if (onLocateMe && (trimmed === 'near me' || trimmed === 'nearby')) {
      setShowSuggestions(false);
      setShowNearMe(false);
      onLocateMe();
      return;
    }
    setShowSuggestions(false);
    setShowNearMe(false);
    onSearch(query.trim());
  };

  const handleNearMeClick = () => {
    setShowSuggestions(false);
    setShowNearMe(false);
    onLocateMe?.();
  };

  const handleSuggestionSelect = (suggestion: DawaSuggestion) => {
    const address = suggestion.forslagstekst || suggestion.tekst;
    setQuery(address);
    setSuggestions([]);
    setShowSuggestions(false);
    onSearch(address);
    if (onAddressSelect && suggestion.data?.x != null && suggestion.data?.y != null) {
      onAddressSelect(address, suggestion.data.y, suggestion.data.x);
    }
  };

  const nearMeCount = showNearMe && onLocateMe ? 1 : 0;
  const totalOptions = nearMeCount + suggestions.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions && !showNearMe) return;
    if (totalOptions === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i < totalOptions - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i > 0 ? i - 1 : totalOptions - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      if (nearMeCount && selectedIndex === 0) {
        handleNearMeClick();
      } else if (suggestions[selectedIndex - nearMeCount]) {
        handleSuggestionSelect(suggestions[selectedIndex - nearMeCount]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setShowNearMe(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="map-search-bar">
      <form onSubmit={handleSubmit} className="map-search-bar-form">
        <div className="map-search-bar-input-wrap">
          <span className="map-search-bar-icon" aria-hidden>
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (onLocateMe) {
                setShowNearMe(true);
                setSelectedIndex(suggestions.length > 0 ? -1 : 0);
              } else if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder={placeholder}
            aria-label="Search toilets"
            aria-autocomplete="list"
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-controls="map-search-suggestions"
            className="map-search-bar-input"
          />
          {loading && query.trim().length >= 2 && (
            <span className="map-search-bar-loading" aria-hidden>
              <span className="map-search-bar-spinner" />
            </span>
          )}
        </div>
        {(showNearMe || (showSuggestions && suggestions.length > 0)) && (
          <ul
            id="map-search-suggestions"
            role="listbox"
            className="map-search-suggestions"
          >
            {showNearMe && onLocateMe && (
              <li
                role="option"
                aria-selected={selectedIndex === 0}
                onClick={handleNearMeClick}
                onMouseEnter={() => setSelectedIndex(0)}
                className={`map-search-suggestion map-search-suggestion-near-me ${selectedIndex === 0 ? 'selected' : ''}`}
              >
                <span className="map-search-near-me-icon" aria-hidden>
                  <LocateIcon />
                </span>
                Near me
              </li>
            )}
            {suggestions.map((s, i) => (
              <li
                key={s.tekst + (s.data?.x ?? '') + (s.data?.y ?? '')}
                role="option"
                aria-selected={i + nearMeCount === selectedIndex}
                onClick={() => handleSuggestionSelect(s)}
                onMouseEnter={() => setSelectedIndex(i + nearMeCount)}
                className={`map-search-suggestion ${i + nearMeCount === selectedIndex ? 'selected' : ''}`}
              >
                {s.forslagstekst || s.tekst}
              </li>
            ))}
          </ul>
        )}
      </form>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function LocateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}
