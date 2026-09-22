'use client';

import React, { useState } from 'react';
import { X, Server, Database, FileCode, CheckCircle, Copy, Download, ExternalLink } from 'lucide-react';

interface HostingerGuideModalProps {
  onClose: () => void;
}

export function HostingerGuideModal({ onClose }: HostingerGuideModalProps) {
  const [copied, setCopied] = useState(false);

  const downloadSql = () => {
    // Create download link for database.sql
    const element = document.createElement('a');
    element.setAttribute('href', '/database.sql');
    element.setAttribute('download', 'smartbill_database.sql');
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyDbConfig = () => {
    const snippet = `<?php
// SmartBill - Hostinger config/database.php
$db_host = 'localhost';
$db_name = 'u123456789_smartbill'; // Replace with your Hostinger DB name
$db_user = 'u123456789_admin';     // Replace with your Hostinger DB user
$db_pass = 'YourSecurePasswordHere'; // Replace with your Hostinger DB password
$db_port = '3306';
$charset = 'utf8mb4';`;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-base">Hostinger Shared Hosting Deployment Center</h3>
              <p className="text-xs text-slate-400">cPanel / hPanel + PHP 8+ + MySQL Guide</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs sm:text-sm overflow-y-auto">
          {/* Note about preview vs Hostinger */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 text-blue-900">
            <h4 className="font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              Live Preview & Hostinger Package Ready
            </h4>
            <p className="text-xs text-blue-800 leading-relaxed">
              This browser preview is running the live interactive <strong>SmartBill Next.js app</strong>. All corresponding <strong>PHP 8+</strong> and <strong>MySQL</strong> production files are also included in this project for direct upload to Hostinger!
            </p>
          </div>

          {/* 4 Step Hostinger Guide */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">4-Step Hostinger Deployment Guide:</h4>

            <div className="space-y-3">
              <div className="flex gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  1
                </div>
                <div>
                  <h5 className="font-bold text-slate-800">Create MySQL Database in Hostinger</h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Log in to <strong>Hostinger hPanel</strong> &rarr; Click <strong>Databases</strong> &rarr; <strong>Management</strong> &rarr; Create a new database (e.g. <code>smartbill</code>) and user with a strong password. Note down the Database Name, User, and Password.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h5 className="font-bold text-slate-800">Import database.sql in phpMyAdmin</h5>
                    <button
                      onClick={downloadSql}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded text-xs font-semibold"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download database.sql</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Click <strong>Enter phpMyAdmin</strong> next to your new database &rarr; Click the <strong>Import</strong> tab &rarr; Select <code>database.sql</code> from this project &rarr; Click <strong>Go</strong>. All tables, seed products, and default admin are imported instantly.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  3
                </div>
                <div>
                  <h5 className="font-bold text-slate-800">Upload PHP Files to public_html</h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    In Hostinger hPanel, open <strong>File Manager</strong> &rarr; Navigate to <code>public_html</code> &rarr; Upload all project PHP files, folders (<code>invoices/</code>, <code>products/</code>, <code>customers/</code>, <code>config/</code>, <code>includes/</code>, <code>assets/</code>), and <code>.htaccess</code>.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  4
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h5 className="font-bold text-slate-800">Edit config/database.php</h5>
                    <button
                      onClick={copyDbConfig}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded bg-white"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    In File Manager, edit <code>config/database.php</code> and fill in your Hostinger MySQL DB Name, Username, and Password. Save file!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Default Credentials Box */}
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg text-xs text-amber-900 space-y-1">
            <div className="font-bold">Default Administrator Login for Hostinger PHP:</div>
            <div className="font-mono text-[11px] bg-white p-2 rounded border border-amber-200 inline-block">
              <strong>Email:</strong> admin@smartbill.com &nbsp;|&nbsp; <strong>Password:</strong> admin123
            </div>
            <p className="text-[11px] text-amber-800 mt-1">
              You can change this password anytime in SmartBill &rarr; Settings &rarr; Users & Security.
            </p>
          </div>
        </div>

        <div className="flex justify-end px-6 py-3 bg-slate-100 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
          >
            Got it, Close
          </button>
        </div>
      </div>
    </div>
  );
}
