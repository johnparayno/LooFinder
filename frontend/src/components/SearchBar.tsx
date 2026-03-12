/**
 * SearchBar - search toilets by address, neighborhood, or location name
 * Uses DAWA (Danish Address Web API) for address autocomplete suggestions
 */
import { useState, useRef, useEffect, useCallback } from 'react';

const DAWA_AUTOCOMPLETE = 'https://api.dataforsyningen.dk/autocomplete';

interface DawaSuggestion {
  type: string;
  tekst: string;
  forslagstekst: string;
  data?: {
    x?: number; // longitude
    y?: number; // latitude
  };
}

export interface SearchBarProps {
  onSearch: (query: string) => void;
  onAddressSelect?: (address: string, lat: number, lng: number) => void;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  onAddressSelect,
  placeholder = 'Search address, neighborhood, or name…',
}: SearchBarProps) {
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
    <div ref={containerRef} style={{ position: 'relative' }}>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          gap: 8,
          padding: 12,
          backgroundColor: 'white',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ flex: 1, position: 'relative' }}>
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
            aria-controls="dawa-suggestions"
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: 16,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul
              id="dawa-suggestions"
              role="listbox"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                margin: 0,
                marginTop: 4,
                padding: 0,
                listStyle: 'none',
                backgroundColor: 'white',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                maxHeight: 280,
                overflowY: 'auto',
                zIndex: 1000,
              }}
            >
              {suggestions.map((s, i) => (
                <li
                  key={s.tekst + (s.data?.x ?? '') + (s.data?.y ?? '')}
                  role="option"
                  aria-selected={i === selectedIndex}
                  onClick={() => handleSuggestionSelect(s)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    fontSize: 14,
                    backgroundColor: i === selectedIndex ? 'var(--color-primary-light)' : 'transparent',
                    borderBottom:
                      i < suggestions.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                  }}
                >
                  {s.forslagstekst || s.tekst}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
          }}
        >
          Search
        </button>
      </form>
      {loading && query.trim().length >= 2 && (
        <div
          style={{
            position: 'absolute',
            top: 52,
            left: 22,
            fontSize: 12,
            color: 'var(--color-text-muted)',
          }}
        >
          Loading suggestions…
        </div>
      )}
    </div>
  );
}
