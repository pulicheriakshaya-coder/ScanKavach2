# Changelog

All notable changes to ScanKavach will be documented in this file.

## [1.0.0] - 2026-09-30

### Initial Release
- **Phase 1: Shell & Architecture**:
  - HashRouter navigation, responsive sidebar, TopBar with status pills, and dark/light mode toggle.
  - PBKDF2 Web Crypto authentication with 16-byte random salt, 100,000 iterations, 5-failure lockout, and demo session option.
  - Safe IndexedDB wrapper (`scankavach_db`) with in-memory fallback.
  - Global ErrorBoundary and runtime window unhandled error handlers.
- **Phase 2: Core Anomaly Pipeline**:
  - Canvas redraw for metadata stripping.
  - Multi-stage Safety Gate (Color photo, low contrast, blur variance, OOD embedding distance).
  - MobileNet v1 0.25 feature extractor layer `conv_pw_11_relu` with WebGL backend and CPU fallback.
  - Reference memory bank with 70/30 split, uniform subsampling to 8,000 patches, and percentile threshold calibration.
  - Spatial explanation generator using 3x3 general image grid and area percentage.
  - Scanner-shift detector distinguishing global acquisition shifts from localized pathology.
- **Phase 3: Condition Model & Decision Fusion**:
  - Softmax classifier head trained in tf.js with class-weighted cross-entropy and temperature scaling.
  - Decision fusion engine handling Consistent-normal, Suggested-condition, Conflict, and Inconclusive branches.
  - Class Activation Map (CAM) with visual toggle.
- **Phase 4: Evaluation, Optimization & Reporting**:
  - Statistical Evaluation dashboard with rank-based AUROC, ROC curve, and live threshold tuning slider.
  - Optimization Lab analyzing random vs greedy k-center coreset subsampling.
  - Batch processing up to 50 scans with progress bar and CSV export.
  - Single-page clinical PDF report generator with jsPDF.
  - Static multilingual dictionary for English, Telugu, and Hindi.
- **Phase 5: Health Hub & AI Assistant**:
  - Educational respiratory health topics aligned with WHO, ICMR, and India's National Tuberculosis Elimination Programme.
  - Conservative symptom triage checker.
  - AI Assistant supporting offline local mode and Gemini mode with strict safety refusal filters.
  - Auto-generated Model Card and audit log exporter.
- **Phase 6: Quality, Testing & Compliance**:
  - 150+ deterministic unit, component, and integration tests with fake-indexeddb and fixtures.
  - CI pipeline and comprehensive markdown documentation.
