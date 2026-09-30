import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GateRejectCard } from '../../src/components/analyze/GateRejectCard';

describe('GateRejectCard Component Tests', () => {
  it('renders rejection notice and trigger onRetry', () => {
    const handleRetry = vi.fn();
    const gateResult = {
      passed: false,
      reason: 'This is a colour photo. Expected a grayscale medical scan.',
      colorDiff: 24.5,
      contrastStd: 0.12,
      blurVariance: 45.0,
      embeddingDistance: 2.1,
    };

    render(<GateRejectCard gateResult={gateResult} onRetry={handleRetry} />);

    expect(screen.getByText(/Safety Gate Rejection/i)).toBeInTheDocument();
    expect(screen.getByText(/colour photo/i)).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Analyze Another Scan/i });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledOnce();
  });
});
