import React from 'react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { VerdictBadge } from '../../src/components/analyze/VerdictBadge';

describe('VerdictBadge Component Tests', () => {
  it('renders Normal badge correctly', () => {
    const { getByText } = render(<VerdictBadge verdict="Normal" />);
    expect(getByText(/Normal/)).toBeInTheDocument();
  });

  it('renders Normal badge with borderline', () => {
    const { getByText } = render(<VerdictBadge verdict="Normal" isBorderline={true} />);
    expect(getByText(/Normal \(Borderline\)/)).toBeInTheDocument();
  });

  it('renders Review badge without borderline', () => {
    const { getByText } = render(<VerdictBadge verdict="Review" isBorderline={false} />);
    expect(getByText('Review')).toBeInTheDocument();
  });

  it('renders Review badge with borderline indication', () => {
    const { getByText } = render(<VerdictBadge verdict="Review" isBorderline={true} />);
    expect(getByText(/Needs Human Review/)).toBeInTheDocument();
  });

  it('renders Refer badge with alert styling', () => {
    const { getByText } = render(<VerdictBadge verdict="Refer" />);
    expect(getByText('Refer')).toBeInTheDocument();
  });

  it('renders Refer badge with borderline', () => {
    const { getByText } = render(<VerdictBadge verdict="Refer" isBorderline={true} />);
    expect(getByText(/Refer \(Borderline\)/)).toBeInTheDocument();
  });
});
