# ScanKavach Architecture Documentation

## 1. Overview & Constraints

ScanKavach operates strictly in client-side execution mode. There is no custom backend service.
The system is structured as a single-page React application powered by:
- **TensorFlow.js (WebGL / CPU)** for real-time edge neural inference.
- **Web Crypto API (PBKDF2 SHA-256)** for local client authentication.
- **IndexedDB (`scankavach_db`)** with in-memory fallbacks for persistence.
- **SessionStorage (`scankavach_session`)** for 8-hour transient sessions.

## 2. Pipeline Subsystems

### Subsystem A: Image Preprocessing & Safety Gate (`src/lib/imageProcessor.ts`, `src/lib/gate.ts`)
1. **Metadata Stripping**: Incoming scans are redrawn onto an off-screen HTML5 2D canvas, stripping EXIF, camera, or patient metadata.
2. **Quality Metric Extraction**:
   - Contrast standard deviation: $\sigma = \sqrt{\frac{1}{N}\sum(I_i - \bar{I})^2}$
   - Blur variance: 3x3 Discrete Laplacian kernel operator variance.
   - Color difference check: Mean absolute RGB cross-channel divergence.
3. **Sequential Safety Gate**:
   - Color photo check (`colorDiff > 12`)
   - Low contrast check (`contrastStd < 0.05`)
   - Blur check (`blurVariance < blurLimit`)
   - OOD check (`embeddingDist > oodLimit`)

### Subsystem B: Feature Extraction & Nearest-Neighbor Scorer (`src/lib/tfLoader.ts`, `src/lib/scorer.ts`)
1. **MobileNet v1 0.25 (224x224)**: Frozen layer `conv_pw_11_relu` produces a $14 \times 14 \times C$ spatial feature tensor (196 patch vectors).
2. **Memory Bank Comparison**:
   - Each test patch $p_i$ is compared to the memory bank patches using chunked Euclidean distance:
     $$d_i = \min_{b \in \text{Bank}} \|p_i - b\|_2$$
   - Image Anomaly Score: Mean of top $K=3$ largest patch anomaly distances:
     $$S = \frac{1}{K}\sum_{k=1}^K d_{(k)}$$

### Subsystem C: Calibrated Verdict & Explanation (`src/lib/verdict.ts`, `src/lib/explain.ts`)
- **Review Threshold**: 95th percentile of healthy validation scores.
- **Refer Threshold**: 99th percentile of healthy validation scores.
- **Borderline Detection**: Margin of $\pm 0.05$ around thresholds.
- **Spatial Explanation**: Maps the highest anomaly patch into a 3x3 grid without anatomical claims (e.g., *"lower right of the image, about 12% of the area"*).

### Subsystem D: Decision Fusion (`src/lib/fusion.ts`)
Fuses unsupervised anomaly verdict with supervised class probabilities:
- `Consistent-normal`
- `Suggested-condition`
- `Conflict`
- `Inconclusive`
