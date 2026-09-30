# ScanKavach User Guide

## 1. Quick Navigation
- **Login / Register**: Create a local device account with your professional role (Clinician, Radiology Technician, or Researcher) or select **"Continue as demo user"** for immediate sandbox access.
- **Dashboard**: Review screening stats, latency performance metrics, recent scans, and reference bank health.

## 2. Step-by-Step Screening Workflow

### Step 1: Building or Loading a Reference Bank
1. Navigate to **Build Bank** (`/bank`).
2. Upload at least 20 healthy scans (or click **"Load Synthetic Healthy Set"**).
3. Click **"Calibrate & Save Reference Bank"**.
4. The system automatically partitions images into 70% bank patches and 30% calibration validation images.

### Step 2: Screening a Patient Scan
1. Navigate to **Analyze** (`/analyze`).
2. Select or drag-and-drop a medical scan (PNG, JPG, or WEBP).
3. Click **"Run Kavach Screening"**.
4. The system executes:
   - Metadata stripping (patient privacy preservation).
   - Safety Gate quality checks.
   - Patch-level nearest-neighbor scoring.
   - Side-by-side visual comparison with the nearest healthy scan.
   - Anomaly heatmap overlay with opacity slider.
   - Spatial explanation sentence.
   - Recommended clinical next steps.

### Step 3: Generating Clinical Reports
- Click **"Download PDF Report"** to export a formal, single-page, tamper-resistant PDF clinical decision support summary.

### Step 4: Batch Screening
- For clinic triage or high-volume workflows, navigate to **Batch** (`/batch`) to screen up to 50 scans sequentially. Results are automatically ranked by anomaly percentile.
