import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('App', () => {
  it('renders map with Find nearest toilet button', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /find nearest toilet/i })).toBeTruthy();
  });
});
