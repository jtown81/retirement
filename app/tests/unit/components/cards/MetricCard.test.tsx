import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '@components/cards/MetricCard';

describe('MetricCard', () => {
  it('renders label and value', () => {
    render(<MetricCard label="Annual Annuity" value="$27,900" />);
    expect(screen.getByText('Annual Annuity')).toBeInTheDocument();
    expect(screen.getByText('$27,900')).toBeInTheDocument();
  });

  it('applies positive variant styling', () => {
    render(<MetricCard label="Surplus" value="$5,000" variant="positive" />);
    const value = screen.getByText('$5,000');
    expect(value.className).toContain('text-green-700');
  });

  it('applies negative variant styling', () => {
    render(<MetricCard label="Deficit" value="-$3,000" variant="negative" />);
    const value = screen.getByText('-$3,000');
    expect(value.className).toContain('text-red-700');
  });

  it('applies neutral variant styling', () => {
    render(<MetricCard label="Status" value="Pending" variant="neutral" />);
    const value = screen.getByText('Pending');
    expect(value.className).toContain('text-gray-700');
  });

  it('defaults to default variant', () => {
    render(<MetricCard label="Test" value="123" />);
    const value = screen.getByText('123');
    expect(value.className).toContain('text-gray-900');
  });

  it('has metric-card test id', () => {
    render(<MetricCard label="Test" value="123" />);
    expect(screen.getByTestId('metric-card')).toBeInTheDocument();
  });
});
