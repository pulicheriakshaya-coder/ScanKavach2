/**
 * @file src/pages/BuildBankPage.tsx
 * @description Reference memory bank builder with patch extraction, split calibration, and JSON export/import.
 */

import React, { useState } from 'react';
import {
  Database,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  MIN_NORMALS,
  RECOMMENDED_NORMALS,
} from '../config';
import {
  buildReferenceBank,
  saveReferenceBank,
  BankInputItem,
} from '../lib/memoryBank';
import { loadFeatureExtractor } from '../lib/tfLoader';
import {
  loadImageElement,
  drawToCanvasImageData,
  computeImageStatistics,
  generateThumbnailDataUrl,
} from '../lib/imageProcessor';
import { logAuditEvent } from '../lib/auditLog';
import { useApp } from '../context/AppContext';

export const BuildBankPage: React.FC = () => {
  const { session, bank, refreshBank } = useApp();
  const [files, setFiles] = useState<File[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
  };

  const handleClearFiles = () => {
    setFiles([]);
    setStatusMessage(null);
  };

  const handleCreateSynthetic = () => {
    // Generates 25 synthetic healthy images in memory for rapid local testing
    const syntheticFiles: File[] = [];
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext('2d')!;

    for (let i = 0; i < 24; i++) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 224, 224);
      // Draw subtle rib-like grayscale gradients
      ctx.fillStyle = '#475569';
      for (let r = 30; r < 200; r += 25) {
        ctx.beginPath();
        ctx.arc(112, r, 60, 0, Math.PI);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 6;
        ctx.stroke();
      }
      const dataUrl = canvas.toDataURL('image/jpeg');
      const blobBin = atob(dataUrl.split(',')[1]);
      const array = [];
      for (let k = 0; k < blobBin.length; k++) array.push(blobBin.charCodeAt(k));
      const file = new File([new Uint8Array(array)], `synthetic_healthy_${i + 1}.jpg`, {
        type: 'image/jpeg',
      });
      syntheticFiles.push(file);
    }

    setFiles(syntheticFiles);
    setStatusMessage(`Loaded ${syntheticFiles.length} synthetic healthy scans.`);
  };

  const handleBuildBank = async () => {
    if (files.length < MIN_NORMALS) {
      alert(`Minimum ${MIN_NORMALS} healthy scans required to build the reference bank.`);
      return;
    }

    setIsBuilding(true);
    setProgress(5);
    setStatusMessage('Loading MobileNet feature extractor...');

    try {
      const extractor = await loadFeatureExtractor();
      const tf = await import('@tensorflow/tfjs');
      const items: BankInputItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setStatusMessage(`Processing scan ${i + 1} of ${files.length}...`);
        const img = await loadImageElement(file);
        const imgData = drawToCanvasImageData(img);
        const stats = computeImageStatistics(imgData);
        const thumb = generateThumbnailDataUrl(img);

        // Feature extraction
        const { patches, globalEmbedding } = tf.tidy(() => {
          const tensor = tf.browser
            .fromPixels(img)
            .resizeBilinear([224, 224])
            .toFloat()
            .div(127.5)
            .sub(1.0)
            .expandDims(0);

          const output = extractor.predict(tensor) as import('@tensorflow/tfjs').Tensor;
          // shape [1, 14, 14, channels]
          const shape = output.shape;
          const channels = (shape[3] as number) || 128;
          const reshaped = output.reshape([196, channels]);
          const patchVals = reshaped.arraySync() as number[][];
          const global = output.mean([1, 2]).squeeze().arraySync() as number[];
          return { patches: patchVals, globalEmbedding: global };
        });

        items.push({
          id: i,
          patches,
          globalEmbedding,
          contrastStd: stats.contrastStd,
          blurVariance: stats.blurVariance,
          thumbnailUrl: thumb,
        });

        setProgress(Math.round(((i + 1) / files.length) * 85));
      }

      setStatusMessage('Calibrating thresholds and out-of-distribution limits...');
      const newBank = buildReferenceBank(items);
      await saveReferenceBank(newBank);
      await refreshBank();

      if (session?.user) {
        await logAuditEvent(
          session.user.email,
          'BUILD_BANK',
          `Calibrated reference bank with ${files.length} normal scans.`
        );
      }

      setProgress(100);
      setStatusMessage('Reference bank calibrated and saved to IndexedDB successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to build reference bank.';
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleExportBank = () => {
    if (!bank) return;
    const json = JSON.stringify(bank, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scankavach-bank.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBank = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const raw = evt.target?.result as string;
        const imported = JSON.parse(raw);
        if (!imported.patches || !imported.reviewThreshold) {
          throw new Error('Invalid bank file structure.');
        }
        await saveReferenceBank(imported);
        await refreshBank();
        alert('Reference bank imported successfully!');
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Import failed.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Database className="w-6 h-6 text-teal-400" />
          Build Reference Bank
        </h1>
        <p className="text-sm text-slate-400">
          Upload healthy scans to establish localized feature baselines. Never calibrate on abnormal scans.
        </p>
      </div>

      {/* Guidance Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-teal-400">
          <Info className="w-4 h-4" />
          Calibration Guidelines
        </div>
        <p>
          • <strong>Minimum:</strong> {MIN_NORMALS} healthy scans (hard block below {MIN_NORMALS}).
        </p>
        <p>
          • <strong>Recommended:</strong> {RECOMMENDED_NORMALS}+ scans for robust statistical percentiles.
        </p>
        <p>
          • <strong>Automatic 70/30 Split:</strong> Scans are partitioned into training bank patches and validation set. Calibration thresholds are strictly derived from held-out validation scans to prevent overfitting.
        </p>
      </div>

      {/* Active Bank Summary Card */}
      {bank && (
        <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Active Reference Bank
            </div>
            <div className="text-sm text-slate-200 mt-1">
              {bank.totalNormals} Healthy Scans | {bank.patches.length} Subsampled Patches
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Review Threshold: {bank.reviewThreshold.toFixed(3)} | Refer Threshold: {bank.referThreshold.toFixed(3)}
            </div>
          </div>
          <button
            onClick={handleExportBank}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export scankavach-bank.json
          </button>
        </div>
      )}

      {/* Upload & Controls Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="border-2 border-dashed border-slate-700 hover:border-teal-500/60 rounded-xl p-8 text-center transition-colors">
          <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-200">
            Drag and drop healthy scans here, or browse files
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Accepts PNG, JPG, JPEG, WEBP. Up to 15 MB per scan.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <label className="cursor-pointer px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-medium transition-colors">
              Select Healthy Scans
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileSelection}
                className="hidden"
              />
            </label>
            <button
              onClick={handleCreateSynthetic}
              type="button"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Synthetic Healthy Set
            </button>
            <label className="cursor-pointer px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors">
              Import Bank JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImportBank}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Selected Scans Status */}
        {files.length > 0 && (
          <div className="flex items-center justify-between text-xs bg-slate-800/60 px-4 py-3 rounded-lg border border-slate-700">
            <span className="text-slate-300 font-medium">
              {files.length} scans selected for reference bank.
            </span>
            <button
              onClick={handleClearFiles}
              className="text-slate-400 hover:text-rose-400 transition-colors"
            >
              Clear selection
            </button>
          </div>
        )}

        {files.length > 0 && files.length < MIN_NORMALS && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              Need at least {MIN_NORMALS - files.length} more scans to reach minimum threshold of {MIN_NORMALS}.
            </span>
          </div>
        )}

        {files.length >= MIN_NORMALS && files.length < RECOMMENDED_NORMALS && (
          <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              {files.length} scans meets minimum, but {RECOMMENDED_NORMALS}+ is recommended for high calibration fidelity.
            </span>
          </div>
        )}

        {isBuilding && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>{statusMessage}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {!isBuilding && statusMessage && (
          <div className="p-3 bg-slate-800 rounded-lg text-xs text-slate-200">
            {statusMessage}
          </div>
        )}

        <button
          onClick={handleBuildBank}
          disabled={files.length < MIN_NORMALS || isBuilding}
          className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-medium text-sm rounded-lg shadow-md transition-colors"
        >
          {isBuilding ? 'Extracting & Calibrating Patches...' : 'Calibrate & Save Reference Bank'}
        </button>
      </div>
    </div>
  );
};
