'use client';

import React, { useState } from 'react';
import { X, Upload, Trash2, Check, Sparkles, Image as ImageIcon } from 'lucide-react';
import { CompanySettings } from '@/lib/types';

interface LogoUploadModalProps {
  company: CompanySettings;
  onClose: () => void;
  onSaveLogo: (logoUrl: string | undefined) => void;
}

const SAMPLE_LOGOS = [
  {
    name: 'Tech Blue',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232563eb'/%3E%3Cpath d='M30 70 L50 30 L70 70 Z' fill='white' opacity='0.9'/%3E%3Ccircle cx='50' cy='52' r='10' fill='%2360a5fa'/%3E%3C/svg%3E",
  },
  {
    name: 'Retail Green',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%23059669'/%3E%3Ccircle cx='50' cy='50' r='26' fill='none' stroke='white' stroke-width='8'/%3E%3Cpath d='M42 50 L48 56 L62 42' fill='none' stroke='white' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
  },
  {
    name: 'Royal Gold',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%23d97706'/%3E%3Cpolygon points='50,20 60,42 84,42 64,56 72,78 50,64 28,78 36,56 16,42 40,42' fill='white'/%3E%3C/svg%3E",
  },
  {
    name: 'Corporate Indigo',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%234f46e5'/%3E%3Crect x='25' y='25' width='22' height='22' rx='4' fill='white'/%3E%3Crect x='53' y='25' width='22' height='22' rx='4' fill='white' opacity='0.7'/%3E%3Crect x='25' y='53' width='22' height='22' rx='4' fill='white' opacity='0.7'/%3E%3Crect x='53' y='53' width='22' height='22' rx='4' fill='white'/%3E%3C/svg%3E",
  },
];

export function LogoUploadModal({ company, onClose, onSaveLogo }: LogoUploadModalProps) {
  const [selectedLogo, setSelectedLogo] = useState<string | undefined>(company.logoUrl);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image size should be under 2MB for fast loading.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedLogo(reader.result as string);
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSaveLogo(selectedLogo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-base">Company Logo (लोगो लगाएं)</h3>
              <p className="text-[11px] text-slate-300">Display on invoices, PDFs & dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs sm:text-sm overflow-y-auto">
          {/* Current Logo Preview */}
          <div className="text-center bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="w-28 h-28 mx-auto rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-xs relative">
              {selectedLogo ? (
                <img
                  src={selectedLogo}
                  alt="Company Logo Preview"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="text-center p-2 text-slate-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                  <span className="text-[11px] font-semibold block">No Logo</span>
                </div>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-700 mt-2">
              {company.companyName}
            </p>
            <p className="text-[11px] text-slate-400">
              {selectedLogo ? 'Active logo preview' : 'Upload custom logo or choose a sample below'}
            </p>
          </div>

          {uploadError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {uploadError}
            </div>
          )}

          {/* Upload Button */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              1. Upload Your Own Logo File
            </label>
            <div className="flex gap-2 items-center">
              <label
                htmlFor="modal-logo-file-input"
                className="flex-1 cursor-pointer py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Choose Image from Device (फ़ाइल चुनें)</span>
              </label>
              <input
                id="modal-logo-file-input"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
              />
              {selectedLogo && (
                <button
                  type="button"
                  onClick={() => setSelectedLogo(undefined)}
                  className="px-3 py-2.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                  title="Remove logo"
                >
                  <Trash2 className="w-4 h-4 inline" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Supports PNG, JPG, SVG, WebP. Recommended: Square or wide transparent logo.
            </p>
          </div>

          {/* Sample Presets */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>2. Or Pick a Ready-Made Emblem</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SAMPLE_LOGOS.map((sample) => {
                const isSelected = selectedLogo === sample.url;
                return (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => setSelectedLogo(sample.url)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden relative">
                      <img src={sample.url} alt={sample.name} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-slate-700 truncate w-full text-center">
                      {sample.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-200">
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
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            Apply Logo (लोगो सेट करें)
          </button>
        </div>
      </div>
    </div>
  );
}
