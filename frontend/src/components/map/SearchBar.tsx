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
  placeholder?: string;
}

export function MapSearchBar({
  onSearch,
  onAddressSelect,
  placeholder = 'Search address or location…',
}: MapSearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<DawaSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
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
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearch(query.trim());
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && suggestions[selectedIndex]) {
      e.preventDefault();
      handleSuggestionSelect(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
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
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
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
        {showSuggestions && suggestions.length > 0 && (
          <ul
            id="map-search-suggestions"
            role="listbox"
            className="map-search-suggestions"
          >
            {suggestions.map((s, i) => (
              <li
                key={s.tekst + (s.data?.x ?? '') + (s.data?.y ?? '')}
                role="option"
                aria-selected={i === selectedIndex}
                onClick={() => handleSuggestionSelect(s)}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`map-search-suggestion ${i === selectedIndex ? 'selected' : ''}`}
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
