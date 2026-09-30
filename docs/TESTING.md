# Testing Strategy & Verification: ScanKavach

## Test Suite Structure

ScanKavach features a deterministic, offline test suite powered by Vitest, Testing Library, and Fake IndexedDB:

- **Unit Tests (`tests/unit/`)**:
  - `gate.test.ts`: Quality checks, threshold boundaries, corrupt images.
  - `verdict.test.ts`: Normal/Review/Refer mappings, borderline bounds, percentile rankings.
  - `scorer.test.ts`: Vector Euclidean distances, chunked top-K aggregations.
  - `explain.test.ts`: 3x3 sector mapping, non-anatomical sentence formulation.
  - `fusion.test.ts`: Comprehensive test of all 4 fusion branches (Consistent-normal, Suggested-condition, Conflict, Inconclusive).
  - `shift.test.ts`: Scanner shift fraction and contrast divergence tests.
  - `memoryBank.test.ts`: 70/30 split guarantees, patch subsampling, validation calibration.
  - `classifier.test.ts`: Softmax head, class weighting, temperature scaling.
  - `cam.test.ts`: 14x14 CAM grid calculations and rendering.
  - `evaluation.test.ts`: Rank-based Mann-Whitney U AUROC, ROC curve monotonicity, ECE calibration.
  - `optimizationLab.test.ts`: K-Center greedy coreset timeout fallback and memory estimates.
  - `batch.test.ts`: Batch limits, percentile sorting, CSV serialization.
  - `history.test.ts`: Storage guarantees, no image pixel persistence.
  - `i18n.test.ts`: Verifies every token exists across English, Telugu, and Hindi.
  - `assistant.test.ts`: Strict safety filter refusals for diagnoses, drugs, and dosages.
  - `auth.test.ts`: PBKDF2 Web Crypto hashing, salt generation, 5-failure lock.
  - `healthContent.test.ts`: Triage branching and non-prescriptive content audit.
  - `wordingAndSafety.test.ts`: Enforces zero presence of "you have", "diagnosed with", and "NormalScan".

- **Component Tests (`tests/components/`)**:
  - `LoginPage.test.tsx`
  - `ResultCard.test.tsx`
  - `GateRejectCard.test.tsx`
  - `VerdictBadge.test.tsx`

- **Integration Tests (`tests/integration/`)**:
  - `pipeline.test.ts`: End-to-end simulation from raw image to gate, scoring, calibration, and fusion.

## Running Tests

```bash
# Execute full suite
npm run test

# Run with V8 coverage analysis
npm run test:coverage
```
