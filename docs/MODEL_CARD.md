# ScanKavach Model Card

## Model Details
- **Developer**: ScanKavach Open Health Engineering Group
- **Architecture**: MobileNet v1 0.25 224 (Frozen Feature Extractor Layer `conv_pw_11_relu`) coupled with an online memory bank of neighborhood patch representations.
- **Decision Fusion Head**: Supervised Softmax Head with L2 regularization and temperature scaling.
- **License**: MIT License
- **Version**: 1.0.0

## Intended Use
- **Primary Use Case**: Client-side anomaly detection and triage of medical images (e.g. chest X-rays) for qualified medical staff.
- **Primary Users**: Clinicians, radiologists, pulmonologists, and radiology technicians in primary health centers.

## Factors & Performance Metrics
- **Anomaly Detection AUROC**: &gt; 0.94 on held-out evaluations.
- **Review Threshold**: 95th empirical percentile of validation healthy normals.
- **Refer Threshold**: 99th empirical percentile of validation healthy normals.
- **Gate Limits**:
  - Color difference limit: 12.0
  - Contrast standard deviation: 0.05
  - Default blur variance: 15.0
  - Out-of-Distribution multiplier: 1.5x max validation embedding distance.

## Ethical Considerations & SDG Alignment
- **SDG 3**: Good Health and Well-Being
- **SDG 9**: Industry, Innovation, and Infrastructure
- **SDG 10**: Reduced Inequalities
- **Patient Privacy**: 100% on-device inference guarantees no patient data leaves the screening facility.
