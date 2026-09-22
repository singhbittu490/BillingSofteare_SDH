'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Trash2,
  Check,
  Sparkles,
  Image as ImageIcon,
  CheckCircle2,
  FileCheck,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { CompanySettings } from '@/lib/types';

interface LogoUploadModalProps {
  company: CompanySettings;
  onClose: () => void;
  onSaveLogo: (logoUrl: string | undefined) => void;
}

interface ImageMeta {
  name: string;
  sizeKb: number;
  width: number;
  height: number;
  format: 'PNG' | 'JPG' | 'WEBP' | 'SVG' | 'IMAGE';
}

const SAMPLE_LOGOS = [
  {
    name: 'Smart Tech & IT',
    category: 'Technology',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='bg1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%231e3a8a'/%3E%3Cstop offset='100%25' stop-color='%233b82f6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='200' height='200' rx='40' fill='url(%23bg1)'/%3E%3Ccircle cx='100' cy='100' r='75' fill='none' stroke='white' stroke-opacity='0.25' stroke-width='4'/%3E%3Cpath d='M65 75 L100 50 L135 75 L135 125 L100 150 L65 125 Z' fill='none' stroke='white' stroke-width='8' stroke-linejoin='round'/%3E%3Cpath d='M85 92 C85 85 91 80 98 80 L112 80 C119 80 124 85 124 92 C124 98 119 103 112 103 L95 103 C88 103 83 108 83 115 C83 121 88 126 95 126 L118 126' fill='none' stroke='white' stroke-width='8' stroke-linecap='round'/%3E%3Cpolygon points='105,62 120,86 108,86 116,114 96,82 108,82' fill='%23fbbf24'/%3E%3C/svg%3E",
  },
  {
    name: 'Retail & Supermarket',
    category: 'Retail & Kirana',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='bg2' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23047857'/%3E%3Cstop offset='100%25' stop-color='%2310b981'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='200' height='200' rx='40' fill='url(%23bg2)'/%3E%3Ccircle cx='100' cy='100' r='60' fill='none' stroke='white' stroke-width='14'/%3E%3Cpath d='M75 100 L92 118 L128 82' fill='none' stroke='white' stroke-width='14' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
  },
  {
    name: 'Sharma Hardware & Tools',
    category: 'Hardware & Electrical',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='bg3' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23c2410c'/%3E%3Cstop offset='100%25' stop-color='%23ea580c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='200' height='200' rx='40' fill='url(%23bg3)'/%3E%3Ccircle cx='100' cy='100' r='30' fill='none' stroke='white' stroke-width='12'/%3E%3Cpath d='M100 30 L100 50 M100 150 L100 170 M30 100 L50 100 M150 100 L170 100 M50 50 L65 65 M135 135 L150 150 M50 150 L65 135 M135 65 L150 50' stroke='white' stroke-width='12' stroke-linecap='round'/%3E%3C/svg%3E",
  },
  {
    name: 'Royal Jewellers & Gold',
    category: 'Jewelry & Luxury',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='bg4' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23b45309'/%3E%3Cstop offset='100%25' stop-color='%23f59e0b'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='200' height='200' rx='40' fill='url(%23bg4)'/%3E%3Cpolygon points='100,35 120,78 168,78 128,106 144,150 100,122 56,150 72,106 32,78 80,78' fill='white'/%3E%3C/svg%3E",
  },
  {
    name: 'Pharma & Health Care',
    category: 'Healthcare & Chemist',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='bg5' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23be123c'/%3E%3Cstop offset='100%25' stop-color='%23f43f5e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='200' height='200' rx='40' fill='url(%23bg5)'/%3E%3Crect x='82' y='45' width='36' height='110' rx='8' fill='white'/%3E%3Crect x='45' y='82' width='110' height='36' rx='8' fill='white'/%3E%3C/svg%3E",
  },
  {
    name: 'Logistics & Cargo',
    category: 'Transport & Supply',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='bg6' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%234338ca'/%3E%3Cstop offset='100%25' stop-color='%236366f1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='200' height='200' rx='40' fill='url(%23bg6)'/%3E%3Cpath d='M40 75 L115 75 L140 100 L165 100 L165 135 L40 135 Z' fill='none' stroke='white' stroke-width='10' stroke-linejoin='round'/%3E%3Ccircle cx='70' cy='140' r='14' fill='white'/%3Ccircle cx='140' cy='140' r='14' fill='white'/%3E%3C/svg%3E",
  },
];

export function LogoUploadModal({ company, onClose, onSaveLogo }: LogoUploadModalProps) {
  const [selectedLogo, setSelectedLogo] = useState<string | undefined>(company.logoUrl);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageMeta, setImageMeta] = useState<ImageMeta | null>(null);
  const [previewBg, setPreviewBg] = useState<'white' | 'grid' | 'dark'>('white');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to read and compress image to crisp Web-safe PNG/JPEG via Canvas
  const processImageFile = (file: File) => {
    setUploadError(null);
    setIsProcessing(true);

    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|svg)$/i.test(file.name);
    if (!isImage) {
      setUploadError('Please choose a valid PNG, JPG, or JPEG image file.');
      setIsProcessing(false);
      return;
    }

    // Size sanity check (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be under 5MB.');
      setIsProcessing(false);
      return;
    }

    const detectedFormat: ImageMeta['format'] = file.type.includes('png') || file.name.endsWith('.png')
      ? 'PNG'
      : file.type.includes('jpeg') || file.type.includes('jpg') || /\.jpe?g$/i.test(file.name)
      ? 'JPG'
      : file.type.includes('webp')
      ? 'WEBP'
      : file.type.includes('svg')
      ? 'SVG'
      : 'IMAGE';

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;

      // Create an HTML Image to compute dimensions and resize if excessively huge
      const img = new Image();
      img.onload = () => {
        const originalWidth = img.width;
        const originalHeight = img.height;

        // If it's a huge photo from mobile phone (e.g. 3000x4000), resize to max 800px so it fits smoothly in localStorage
        const maxDimension = 800;
        let targetWidth = originalWidth;
        let targetHeight = originalHeight;

        if (targetWidth > maxDimension || targetHeight > maxDimension) {
          if (targetWidth > targetHeight) {
            targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
            targetWidth = maxDimension;
          } else {
            targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
            targetHeight = maxDimension;
          }
        }

        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Keep transparent background for PNG/WebP, or fill white if needed
            if (detectedFormat === 'JPG') {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, targetWidth, targetHeight);
            }
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            const outputType = detectedFormat === 'JPG' ? 'image/jpeg' : 'image/png';
            const compressedDataUrl = canvas.toDataURL(outputType, 0.92);

            setSelectedLogo(compressedDataUrl);
            setImageMeta({
              name: file.name,
              sizeKb: Math.round(compressedDataUrl.length * 0.75 / 1024),
              width: targetWidth,
              height: targetHeight,
              format: detectedFormat,
            });
            setIsProcessing(false);
            return;
          }
        } catch {
          // Fallback to raw data url if canvas security or memory issue occurs
        }

        setSelectedLogo(rawDataUrl);
        setImageMeta({
          name: file.name,
          sizeKb: Math.round(file.size / 1024),
          width: originalWidth,
          height: originalHeight,
          format: detectedFormat,
        });
        setIsProcessing(false);
      };

      img.onerror = () => {
        // If SVG or image load fails in Image element, still set raw
        setSelectedLogo(rawDataUrl);
        setImageMeta({
          name: file.name,
          sizeKb: Math.round(file.size / 1024),
          width: 200,
          height: 200,
          format: detectedFormat,
        });
        setIsProcessing(false);
      };

      img.src = rawDataUrl;
    };

    reader.onerror = () => {
      setUploadError('Failed to read image file. Please try another image.');
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // reset input so user can re-select same file name if needed
    if (e.target) e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSave = () => {
    onSaveLogo(selectedLogo);
    onClose();
  };

  const handleRemove = () => {
    setSelectedLogo(undefined);
    setImageMeta(null);
  };

  return (
    <div
      id="modal-logo-upload-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4 backdrop-blur-sm overflow-y-auto"
    >
      <div
        id="modal-logo-upload-container"
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in duration-150 border border-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-base">Company Logo Upload (PNG & JPG)</h3>
              <p className="text-[11px] text-slate-300">
                Print crystal-clear logo on GST Tax Invoices, PDFs & Header
              </p>
            </div>
          </div>
          <button
            id="btn-close-logo-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs sm:text-sm overflow-y-auto max-h-[75vh]">
          {/* Main Drag-and-Drop PNG / JPG File Upload Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>1. Upload PNG or JPG File (फ़ाइल अपलोड करें)</span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                Supports: .png, .jpg, .jpeg, .webp, .svg
              </span>
            </div>

            <div
              id="logo-dropzone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-600 bg-blue-50/90 scale-[1.01]'
                  : 'border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                id="input-file-logo-upload"
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml,image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    {isProcessing
                      ? 'Processing Image...'
                      : 'Drag & Drop PNG or JPG file here, or click to browse'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    कंप्यूटर या मोबाइल से PNG / JPG लोगो फ़ाइल चुनें (Max 5MB)
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                    PNG
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                    JPG / JPEG
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    Transparent WebP
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                    Vector SVG
                  </span>
                </div>
              </div>
            </div>

            {uploadError && (
              <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {uploadError}
              </div>
            )}
          </div>

          {/* Current Logo Preview & Details Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Live Logo Preview & Transparency Test</span>
              </span>

              {/* Background Color Checker */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewBg('white')}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                    previewBg === 'white'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="White Invoice Paper Background"
                >
                  White Paper
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg('grid')}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                    previewBg === 'grid'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Checkered Grid (Check PNG Transparency)"
                >
                  Transparency
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg('dark')}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                    previewBg === 'dark'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Dark Background"
                >
                  Dark
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Preview Box */}
              <div
                className={`w-32 h-32 rounded-xl border-2 border-slate-200 flex items-center justify-center overflow-hidden shadow-xs relative flex-shrink-0 ${
                  previewBg === 'white'
                    ? 'bg-white'
                    : previewBg === 'dark'
                    ? 'bg-slate-900'
                    : 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:8px_8px] bg-white'
                }`}
              >
                {selectedLogo ? (
                  <img
                    src={selectedLogo}
                    alt="Company Logo Preview"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="text-center p-2 text-slate-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                    <span className="text-[11px] font-semibold block">No Logo Active</span>
                  </div>
                )}
              </div>

              {/* Information / Status */}
              <div className="flex-1 space-y-2 text-center sm:text-left">
                {selectedLogo ? (
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-700 font-bold text-xs mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Logo Ready to Apply (लोगो तैयार है)</span>
                    </div>

                    <p className="font-bold text-slate-900 text-sm">{company.companyName}</p>
                    <p className="text-xs text-slate-500">
                      This emblem will automatically appear on all printouts, tax invoices, and reports.
                    </p>

                    {imageMeta && (
                      <div className="mt-2 inline-flex flex-wrap items-center gap-2 bg-white px-2.5 py-1 rounded-md border border-slate-200 text-[11px] text-slate-600">
                        <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-semibold">{imageMeta.format} Image</span>
                        <span>•</span>
                        <span>{imageMeta.width}×{imageMeta.height} px</span>
                        <span>•</span>
                        <span>{imageMeta.sizeKb} KB</span>
                      </div>
                    )}

                    <div className="mt-2.5 flex items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 rounded-md transition-colors"
                      >
                        Change Image (दूसरा फोटो चुनें)
                      </button>
                      <button
                        type="button"
                        onClick={handleRemove}
                        className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md inline-flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove Logo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-slate-700 text-sm">No custom logo currently selected</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Upload your shop or company PNG/JPG, or select an instant business emblem below.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Instant Ready-to-Use Business Logos */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>2. Or Select an Instant Business Logo Emblem</span>
              </label>
              <span className="text-[11px] text-slate-500">1-Click Apply</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SAMPLE_LOGOS.map((sample) => {
                const isSelected = selectedLogo === sample.url;
                return (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => {
                      setSelectedLogo(sample.url);
                      setImageMeta({
                        name: `${sample.name}.png`,
                        sizeKb: 12,
                        width: 200,
                        height: 200,
                        format: 'PNG',
                      });
                    }}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/90 ring-2 ring-blue-500/30 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 shadow-2xs'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-lg overflow-hidden relative flex-shrink-0 bg-slate-100 border border-slate-200">
                      <img src={sample.url} alt={sample.name} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-600/35 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {sample.name}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {sample.category}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>Save & Apply Logo (लोगो सेव करें)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
