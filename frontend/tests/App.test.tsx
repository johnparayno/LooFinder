import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('App', () => {
  it('renders landing with Find toilet links', () => {
    render(<App />);
    const links = screen.getAllByRole('link', { name: /^find toilet$/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
  });
});
