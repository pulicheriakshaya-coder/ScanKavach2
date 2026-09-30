import React from 'react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ResultCard } from '../../src/components/analyze/ResultCard';
import { AppProvider } from '../../src/context/AppContext';
import { AnalysisResult } from '../../src/types';

describe('ResultCard Component Tests', () => {
  const mockResult: AnalysisResult = {
    id: 'res_123',
    timestamp: Date.now(),
    fileName: 'chest_scan_test.png',
    gateResult: { passed: true, colorDiff: 1.2, contrastStd: 0.18, blurVariance: 32, embeddingDistance: 2.1 },
    score: 0.42,
    verdict: {
      verdict: 'Review',
      isBorderline: true,
      percentile: 96,
      explanation: 'Unusual pattern in the lower right of the image, about 12% of the area. Not a diagnosis.',
      message: 'Borderline: needs human review',
    },
    shift: { isShift: false, highPatchFraction: 0.1 },
    timings: { metadataMs: 10, gateMs: 5, inferenceMs: 150, scoringMs: 25, verdictMs: 5, totalMs: 195 },
  };

  it('renders verdict, score, percentile, and explanation sentence', () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <ResultCard result={mockResult} />
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('chest_scan_test.png')).toBeInTheDocument();
    expect(screen.getByText(/0.420/)).toBeInTheDocument();
    expect(screen.getByText(/96%/)).toBeInTheDocument();
    expect(screen.getByText(/lower right of the image/)).toBeInTheDocument();
  });
});
