/**
 * @file src/lib/pdfReport.ts
 * @description Lazy client-side PDF screening report generator using jsPDF.
 */

import { AnalysisResult, UserSession } from '../types';

/**
 * Generates and downloads a standardized single-page clinical decision support PDF report.
 * Dynamically imports jsPDF only on execution.
 *
 * @param result - AnalysisResult of the screened scan.
 * @param session - Active user session.
 * @param thresholds - Calibrated review and refer thresholds.
 * @param bankSize - Total normals or patch count in reference bank.
 */
export async function generatePdfReport(
  result: AnalysisResult,
  session: UserSession | null,
  thresholds: { review: number; refer: number },
  bankSize: number
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryTeal = [13, 148, 136];
  const darkSlate = [15, 23, 42];
  const mutedGray = [100, 116, 139];

  // Header Shield Banner
  doc.setFillColor(primaryTeal[0], primaryTeal[1], primaryTeal[2]);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ScanKavach', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Label-Free Anomaly Screening & Decision Support (Client-Side)', 14, 18);

  // Metadata line
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFontSize(9);
  const dateStr = new Date(result.timestamp).toLocaleString();
  const userName = session?.user ? `${session.user.name} (${session.user.role})` : 'Anonymous Clinician';
  doc.text(`Generated: ${dateStr}`, 14, 32);
  doc.text(`Practitioner: ${userName}`, 14, 38);
  doc.text(`File: ${result.fileName}`, 120, 32);
  doc.text(`Reference Bank: ${bankSize} Normal Scans`, 120, 38);

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 42, 196, 42);

  // Anomaly Verdict Box
  const verdict = result.verdict?.verdict || 'Normal';
  const score = result.score ?? 0;
  const percentile = result.verdict?.percentile ?? 50;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Anomaly Screening Verdict', 14, 50);

  doc.setFontSize(11);
  if (verdict === 'Normal') {
    doc.setTextColor(13, 148, 136);
  } else if (verdict === 'Review') {
    doc.setTextColor(217, 119, 6);
  } else {
    doc.setTextColor(220, 38, 38);
  }

  const borderlineText = result.verdict?.isBorderline ? ' [Borderline: Needs Human Review]' : '';
  doc.text(`Verdict: ${verdict}${borderlineText}`, 14, 58);

  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Anomaly Score: ${score.toFixed(3)}  |  Percentile: More unusual than ${percentile}% of healthy validation scans`, 14, 64);
  doc.text(`Calibrated Thresholds: Review (95th%) = ${thresholds.review.toFixed(3)}  |  Refer (99th%) = ${thresholds.refer.toFixed(3)}`, 14, 70);

  // Visual Heatmap & Reference Image comparison
  doc.setFont('helvetica', 'bold');
  doc.text('2. Visual Anomaly Localization & Reference Comparison', 14, 80);

  if (result.processedImagePreviewUrl) {
    try {
      doc.addImage(result.processedImagePreviewUrl, 'JPEG', 14, 84, 55, 55);
      doc.setFontSize(8);
      doc.text('Uploaded Scan (Preprocessed)', 14, 142);
    } catch {
      // Ignore image render error in PDF
    }
  }

  if (result.heatmapDataUrl) {
    try {
      doc.addImage(result.heatmapDataUrl, 'PNG', 76, 84, 55, 55);
      doc.setFontSize(8);
      doc.text('Anomaly Localization Heatmap', 76, 142);
    } catch {
      // Ignore
    }
  }

  if (result.nearestHealthyThumbnail) {
    try {
      doc.addImage(result.nearestHealthyThumbnail, 'JPEG', 138, 84, 55, 55);
      doc.setFontSize(8);
      doc.text('Nearest Healthy Reference Scan', 138, 142);
    } catch {
      // Ignore
    }
  }

  // Explanation Sentence & Scanner Shift Warning
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('Spatial Summary:', 14, 150);
  doc.setFont('helvetica', 'normal');
  doc.text(result.verdict?.explanation || 'No region stands out from the healthy reference set.', 14, 156);

  if (result.shift?.isShift) {
    doc.setTextColor(180, 83, 9);
    doc.setFont('helvetica', 'bold');
    doc.text('Scanner-Shift Warning:', 14, 164);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'This scan may come from a different scanner or protocol. The score may reflect the device, not disease.',
      14,
      170
    );
  }

  // Decision Support Condition Suggestion
  const fusionY = result.shift?.isShift ? 180 : 168;
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('3. AI-Suggested Finding (Decision Support)', 14, fusionY);
  doc.setFont('helvetica', 'normal');

  const finding = result.fusion?.message || 'Pattern most similar to healthy reference baseline.';
  doc.text(finding, 14, fusionY + 6);

  // Mandatory Safety Disclaimers
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 230, 182, 50, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, 230, 182, 50, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.text('MANDATORY CLINICAL SAFETY DISCLAIMER & INTENDED USE', 18, 237);

  doc.setFont('helvetica', 'normal');
  const d1 = 'This flags an unusual pattern for clinician review. It is not a diagnosis.';
  const d2 =
    'This is an AI-suggested finding from a research prototype, not a confirmed diagnosis and not a medical device. It must be reviewed and confirmed by a qualified doctor or radiologist.';
  const d3 = 'Note: About 5% of healthy scans land in Review by design.';
  const d4 = 'Privacy notice: ScanKavach processed this scan entirely on-device; no medical images were transmitted.';

  doc.text(d1, 18, 244);
  doc.text(d2, 18, 251, { maxWidth: 174 });
  doc.text(d3, 18, 262);
  doc.text(d4, 18, 268);

  const dateSlug = new Date().toISOString().slice(0, 10);
  doc.save(`scankavach-report-${dateSlug}.pdf`);
}
