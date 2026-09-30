# Ethics, Safety Boundaries & Clinical Limitations

## 1. Intended Use & Boundaries
ScanKavach is designed exclusively as an **assistive screening and clinical decision support system**. It is intended to help qualified healthcare professionals, radiologists, and technicians triage scans and detect subtle unusual spatial patterns.

### Out of Scope:
- **Autonomous Diagnosis**: ScanKavach must never be used as a standalone diagnostic system.
- **Direct-to-Consumer Prescription**: The system refuses to suggest medications, doses, home cures, or therapeutic plans.
- **Emergency Replacement**: In acute respiratory distress, users must immediately seek emergency medical care (112 in India).

## 2. Technical Limitations
- **Scanner Shift & Artifacts**: Extreme variation in scanner exposure, kVp settings, or patient motion artifacts can cause whole-image elevated anomaly scores. The scanner-shift detector flags such events.
- **Reference Set Bias**: Anomaly scores reflect deviation from the *provided reference set*. If the reference set is built only from adult upright chest radiographs, pediatric or supine scans may trigger out-of-distribution warnings.
- **Statistical Calibration**: By design, approximately 5% of healthy scans land in the **Review** category (95th percentile) to ensure high sensitivity. A Review verdict is a trigger for human examination, not an indication of pathology.

## 3. Data Privacy & Confidentiality
- Medical scans are processed strictly in the client's web browser using client-side WebGL / CPU acceleration.
- Scan images, raw pixel buffers, and thumbnails are never uploaded to any remote server or stored in persistent browser history.
- AI Assistant queries transmit only non-identifiable numerical summaries (verdict label, score, percentage area).
