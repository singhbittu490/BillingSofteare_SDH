'use client';

import React, { useState, useEffect } from 'react';
import {
  AuthUser,
  CompanySettings,
  Customer,
  Expense,
  Invoice,
  Product,
  Purchase,
  Supplier,
} from '@/lib/types';
import {
  initialCompanySettings,
  initialCustomers,
  initialExpenses,
  initialInvoices,
  initialProducts,
  initialPurchases,
  initialSuppliers,
  formatINR,
} from '@/lib/initial-data';
import {
  LayoutDashboard,
  FileText,
  Package,
  Users,
  ShoppingBag,
  Receipt,
  BarChart3,
  Server,
  Plus,
  Printer,
  Share2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Search,
  Download,
  RotateCcw,
  IndianRupee,
  ExternalLink,
  PhoneCall,
  Clock,
  DollarSign,
  TrendingUp,
  LogOut,
  Building2,
  Pencil,
  Camera,
  Upload,
} from 'lucide-react';
import { TaxInvoiceModal } from '@/components/TaxInvoiceModal';
import { CreateInvoiceModal } from '@/components/CreateInvoiceModal';
import { RecordPaymentModal } from '@/components/RecordPaymentModal';
import { AddProductModal } from '@/components/AddProductModal';
import { StockAdjustModal } from '@/components/StockAdjustModal';
import { AddCustomerModal } from '@/components/AddCustomerModal';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { AddPurchaseModal } from '@/components/AddPurchaseModal';
import { LogoUploadModal } from '@/components/LogoUploadModal';
import { LoginScreen } from '@/components/LoginScreen';
import { CompanyProfileTab } from '@/components/CompanyProfileTab';
import { downloadInvoicePDFDirect, openInvoicePDFInNewTab } from '@/lib/invoice-pdf';
import { loadIsolatedTenantData } from '@/lib/tenant-storage';

type NavTab =
  | 'dashboard'
  | 'invoices'
  | 'products'
  | 'customers'
  | 'purchases'
  | 'expenses'
  | 'profile'
  | 'reports';

export default function SmartBillApp() {
  // Core Data States initialized consistently for SSR
  const [company, setCompany] = useState<CompanySettings>(initialCompanySettings);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Helper to load isolated tenant data for a specific logged-in user
  const applyTenantData = (user: AuthUser) => {
    try {
      const tenant = loadIsolatedTenantData(user.id);
      setCompany(tenant.company);
      setInvoices(tenant.invoices);
      setProducts(tenant.products);
      setCustomers(tenant.customers);
      setSuppliers(tenant.suppliers);
      setPurchases(tenant.purchases);
      setExpenses(tenant.expenses);
    } catch (err) {
      console.error('Error applying tenant data:', err);
    }
  };

  // Load from sessionStorage asynchronously after mount to prevent SSR hydration mismatch & cascading renders
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const sessionUser = sessionStorage.getItem('smartbill_active_session');
        if (sessionUser) {
          const parsedUser = JSON.parse(sessionUser);
          if (parsedUser && parsedUser.id) {
            setCurrentUser(parsedUser);
            applyTenantData(parsedUser);
          }
        }
      } catch (e) {
        console.error('Error loading active session:', e);
      } finally {
        setIsMounted(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // UI state
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'Paid' | 'Partially Paid' | 'Unpaid'>('all');

  // Modals state
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isAddingPurchase, setIsAddingPurchase] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  // Save to isolated user-specific storage on changes
  useEffect(() => {
    if (!isMounted || !currentUser) return;
    try {
      localStorage.setItem(`smartbill_${currentUser.id}_company`, JSON.stringify(company));
    } catch {}
  }, [company, isMounted, currentUser]);

  useEffect(() => {
    if (!isMounted || !currentUser) return;
    try {
      localStorage.setItem(`smartbill_${currentUser.id}_invoices`, JSON.stringify(invoices));
    } catch {}
  }, [invoices, isMounted, currentUser]);

  useEffect(() => {
    if (!isMounted || !currentUser) return;
    try {
      localStorage.setItem(`smartbill_${currentUser.id}_products`, JSON.stringify(products));
    } catch {}
  }, [products, isMounted, currentUser]);

  useEffect(() => {
    if (!isMounted || !currentUser) return;
    try {
      localStorage.setItem(`smartbill_${currentUser.id}_customers`, JSON.stringify(customers));
    } catch {}
  }, [customers, isMounted, currentUser]);

  useEffect(() => {
    if (!isMounted || !currentUser) return;
    try {
      localStorage.setItem(`smartbill_${currentUser.id}_purchases`, JSON.stringify(purchases));
    } catch {}
  }, [purchases, isMounted, currentUser]);

  useEffect(() => {
    if (!isMounted || !currentUser) return;
    try {
      localStorage.setItem(`smartbill_${currentUser.id}_expenses`, JSON.stringify(expenses));
    } catch {}
  }, [expenses, isMounted, currentUser]);

  const resetAllData = () => {
    if (!currentUser) return;
    if (confirm(`Reset ${company.companyName} data back to original defaults?`)) {
      try {
        localStorage.removeItem(`smartbill_${currentUser.id}_company`);
        localStorage.removeItem(`smartbill_${currentUser.id}_invoices`);
        localStorage.removeItem(`smartbill_${currentUser.id}_products`);
        localStorage.removeItem(`smartbill_${currentUser.id}_customers`);
        localStorage.removeItem(`smartbill_${currentUser.id}_purchases`);
        localStorage.removeItem(`smartbill_${currentUser.id}_expenses`);
      } catch {}
      applyTenantData(currentUser);
      alert('Company profile & data restored to defaults!');
    }
  };

  // Calculations
  const totalSalesRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalCollectedCash = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalOutstandingDue = invoices.reduce((sum, inv) => sum + inv.outstandingAmount, 0);
  const totalExpensesAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalPurchasesAmount = purchases.reduce((sum, p) => sum + p.grandTotal, 0);
  const totalInventoryStockValuation = products.reduce(
    (sum, p) => sum + p.currentStock * p.purchasePrice,
    0
  );
  const lowStockProducts = products.filter((p) => p.currentStock <= p.minimumStock && p.currentStock < 900);

  // Next Invoice Number dynamically based on the company's invoice prefix
  const nextInvoiceNumber = `${company.invoicePrefix || 'INV'}-${1000 + invoices.length + 1}`;
  const nextPurchaseNumber = `PUR-2026-${String(purchases.length + 1).padStart(4, '0')}`;

  // Invoice Handlers
  const handleSaveInvoice = (
    savedInvoice: Invoice,
    updatedProds: Product[],
    updatedCusts: Customer[],
    isEdit?: boolean
  ) => {
    if (isEdit) {
      setInvoices((prev) => prev.map((inv) => (inv.id === savedInvoice.id ? savedInvoice : inv)));
    } else {
      setInvoices([savedInvoice, ...invoices]);
    }
    setProducts(updatedProds);
    setCustomers(updatedCusts);
    setIsCreatingInvoice(false);
    setEditingInvoice(null);
    setPreviewInvoice(savedInvoice); // immediately show generated invoice for printing/preview!
  };

  const handleDeleteInvoice = (invId: number) => {
    const inv = invoices.find((i) => i.id === invId);
    if (!inv) return;
    if (confirm(`Cancel and delete Invoice ${inv.invoiceNumber}? Stock will be automatically restored.`)) {
      // Restore stock
      setProducts((prev) =>
        prev.map((prod) => {
          const item = inv.items.find((it) => it.productId === prod.id);
          if (item && prod.currentStock < 900) {
            return {
              ...prod,
              currentStock: prod.currentStock + item.quantity,
            };
          }
          return prod;
        })
      );
      setInvoices((prev) => prev.filter((i) => i.id !== invId));
    }
  };

  // Product CRUD Handlers
  const handleSaveProduct = (savedProd: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === savedProd.id);
      if (exists) {
        return prev.map((p) => (p.id === savedProd.id ? savedProd : p));
      }
      return [savedProd, ...prev];
    });
    setIsAddingProduct(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    if (
      confirm(
        `Are you sure you want to delete "${prod.name}" (SKU: ${prod.sku})? This action cannot be undone.`
      )
    ) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  // Purchase CRUD Handlers
  const handleSavePurchase = (savedPurchase: Purchase, updatedProducts: Product[]) => {
    setPurchases((prev) => {
      const exists = prev.some((p) => p.id === savedPurchase.id);
      if (exists) {
        return prev.map((p) => (p.id === savedPurchase.id ? savedPurchase : p));
      }
      return [savedPurchase, ...prev];
    });
    setProducts(updatedProducts);
    setIsAddingPurchase(false);
    setEditingPurchase(null);
  };

  const handleDeletePurchase = (purchaseId: number) => {
    const pur = purchases.find((p) => p.id === purchaseId);
    if (!pur) return;
    if (
      confirm(
        `Cancel and delete Purchase Bill ${pur.purchaseNumber}? Inventory stock will be deducted accordingly.`
      )
    ) {
      setProducts((prev) =>
        prev.map((prod) => {
          const item = pur.items.find((it) => it.productId === prod.id);
          if (item) {
            return {
              ...prod,
              currentStock: Math.max(0, prod.currentStock - item.quantity),
            };
          }
          return prod;
        })
      );
      setPurchases((prev) => prev.filter((p) => p.id !== purchaseId));
    }
  };

  // Expense CRUD Handlers
  const handleSaveExpense = (savedExp: Expense) => {
    setExpenses((prev) => {
      const exists = prev.some((e) => e.id === savedExp.id);
      if (exists) {
        return prev.map((e) => (e.id === savedExp.id ? savedExp : e));
      }
      return [savedExp, ...prev];
    });
    setIsAddingExpense(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (expenseId: number) => {
    const exp = expenses.find((e) => e.id === expenseId);
    if (!exp) return;
    if (
      confirm(
        `Are you sure you want to delete expense "${exp.description}" of ₹${exp.amount}? This action cannot be undone.`
      )
    ) {
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
      if (editingExpense?.id === expenseId) {
        setEditingExpense(null);
      }
    }
  };

  // Logo Handler
  const handleSaveLogo = (newLogoUrl: string | undefined) => {
    const updatedCompany = { ...company, logoUrl: newLogoUrl };
    setCompany(updatedCompany);
    if (currentUser) {
      try {
        localStorage.setItem(`smartbill_${currentUser.id}_company`, JSON.stringify(updatedCompany));
      } catch (e) {
        console.error('Failed to save company logo:', e);
      }
    }
  };

  const handleRecordPayment = (
    invId: number,
    amount: number,
    method: string,
    ref: string,
    note: string
  ) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invId) {
          const newPaid = inv.paidAmount + amount;
          const newOut = Math.max(0, inv.grandTotal - newPaid);
          const newStatus = newOut === 0 ? 'Paid' : 'Partially Paid';
          return {
            ...inv,
            paidAmount: newPaid,
            outstandingAmount: newOut,
            paymentStatus: newStatus,
            paymentMode: `${method}${ref ? ` (Ref: ${ref})` : ''}`,
          };
        }
        return inv;
      })
    );
    setPaymentInvoice(null);
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customerGstin && inv.customerGstin.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (invoiceFilter === 'all') return true;
    return inv.paymentStatus === invoiceFilter;
  });

  // Export CSV
  const exportInvoicesCsv = () => {
    const headers = [
      'Invoice Number',
      'Date',
      'Customer',
      'Customer GSTIN',
      'Place of Supply',
      'Taxable Value',
      'CGST',
      'SGST',
      'IGST',
      'Grand Total',
      'Paid Amount',
      'Balance Due',
      'Payment Status',
    ];
    const rows = invoices.map((i) => [
      i.invoiceNumber,
      i.invoiceDate,
      `"${i.customerName}"`,
      i.customerGstin || 'URP',
      `"${i.placeOfSupply}"`,
      i.taxableAmount.toFixed(2),
      i.cgstTotal.toFixed(2),
      i.sgstTotal.toFixed(2),
      i.igstTotal.toFixed(2),
      i.grandTotal.toFixed(2),
      i.paidAmount.toFixed(2),
      i.outstandingAmount.toFixed(2),
      i.paymentStatus,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartbill_invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    if (confirm('क्या आप लॉगआउट करना चाहते हैं? (Do you want to log out of SmartBillSolution?)')) {
      try {
        sessionStorage.removeItem('smartbill_active_session');
        localStorage.removeItem('smartbill_remember_user');
      } catch {}
      setCurrentUser(null);
    }
  };

  // SSR Loading state
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-blue-500/20 mb-4 animate-pulse">
          S
        </div>
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="mt-3 text-xs text-slate-400 font-medium">SmartBillSolution Portal Loading...</p>
      </div>
    );
  }

  // Authentication Gate: User MUST login to access dashboard
  if (!currentUser) {
    return (
      <LoginScreen
        onLogin={(user) => {
          setCurrentUser(user);
          applyTenantData(user);
          try {
            sessionStorage.setItem('smartbill_active_session', JSON.stringify(user));
          } catch {}
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Main Header & Nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between py-3 gap-3">
          {/* Logo & Company Info */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsLogoModalOpen(true)}
              className="relative group rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
              title="Click to upload or change business logo (कंपनी का लोगो लगाएं)"
            >
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.companyName}
                  className="w-11 h-11 rounded-xl object-contain bg-white border border-slate-200 p-1 shadow-xs flex-shrink-0 group-hover:opacity-80 transition-opacity"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md flex-shrink-0 group-hover:opacity-90 transition-opacity">
                  {company.companyName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 bg-slate-900 text-white p-0.5 rounded-full shadow text-[9px] group-hover:scale-110 transition-transform">
                <Camera className="w-2.5 h-2.5" />
              </span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{company.companyName}</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
                  {company.stateCode ? `State: ${company.stateCode}` : 'GST'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                GSTIN: <span className="font-mono text-slate-700 font-semibold">{company.gstin}</span> &bull; {company.city}, {company.state}
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsCreatingInvoice(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
            <button
              onClick={() => setIsLogoModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 transition-colors"
              title="Upload PNG / JPG company logo (कंपनी का PNG/JPG लोगो लगाएं)"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Upload Logo (PNG/JPG)</span>
            </button>
            <button
              id="btn-edit-company-profile"
              onClick={() => setActiveTab('profile')}
              className={`inline-flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                activeTab === 'profile'
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="Manage company profile, GSTIN, and Bank details"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Profile</span>
            </button>
            <button
              onClick={() => setIsAddingProduct(true)}
              className="inline-flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
            <button
              onClick={() => setIsAddingExpense(true)}
              className="inline-flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Log Expense</span>
            </button>

            {/* User Profile Badge & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm"
                title={`Logged in as ${currentUser.name} (${currentUser.email})`}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {currentUser.role}
                </div>
              </div>
              <button
                id="btn-user-logout"
                onClick={handleLogout}
                className="inline-flex items-center space-x-1 p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors border border-transparent hover:border-rose-200"
                title="Log out of SmartBill (लॉगआउट करें)"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto gap-1 border-t border-slate-100 py-1 scrollbar-none">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'invoices', label: `Invoices (${invoices.length})`, icon: FileText },
            { id: 'products', label: `Products & Stock (${products.length})`, icon: Package },
            { id: 'customers', label: `Customers (${customers.length})`, icon: Users },
            { id: 'purchases', label: `Purchases (${purchases.length})`, icon: ShoppingBag },
            { id: 'expenses', label: `Expenses (${expenses.length})`, icon: Receipt },
            { id: 'profile', label: 'Company Profile (कंपनी)', icon: Building2 },
            { id: 'reports', label: 'GST & P&L Reports', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as NavTab)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Low Stock Warning Alert if any */}
        {lowStockProducts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Low Stock Alert:</strong> {lowStockProducts.length} product(s) (
                {lowStockProducts.map((p) => p.name).join(', ')}) are below minimum inventory threshold!
              </span>
            </div>
            <button
              onClick={() => setIsAddingPurchase(true)}
              className="px-3 py-1 bg-amber-600 text-white rounded font-semibold hover:bg-amber-700 transition-colors whitespace-nowrap"
            >
              + Record Inward Purchase
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: DASHBOARD */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Invoiced</span>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                      {formatINR(totalSalesRevenue)}
                    </div>
                    <span className="text-[11px] text-emerald-600 font-medium">
                      {invoices.length} Total Generated Invoices
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payments Collected</span>
                    <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                      {formatINR(totalCollectedCash)}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Cash / UPI / Bank Received</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding Dues</span>
                    <div className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
                      {formatINR(totalOutstandingDue)}
                    </div>
                    <span className="text-[11px] text-rose-500 font-medium">Pending Customer Receivables</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inventory Asset Value</span>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                      {formatINR(totalInventoryStockValuation)}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Across {products.length} Active Catalog Items
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
                    <Package className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Quick Business Actions:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setIsCreatingInvoice(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> + New GST Invoice
                </button>
                <button
                  onClick={() => setIsAddingProduct(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold border border-slate-300 transition-colors"
                >
                  + Add Product
                </button>
                <button
                  onClick={() => setIsAddingCustomer(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold border border-slate-300 transition-colors"
                >
                  + Add Customer
                </button>
                <button
                  onClick={() => setIsAddingPurchase(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold border border-slate-300 transition-colors"
                >
                  + Record Purchase
                </button>
                <button
                  onClick={() => setIsAddingExpense(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold border border-slate-300 transition-colors"
                >
                  + Record Expense
                </button>
              </div>
            </div>

            {/* Recent Invoices Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-900">Recent Invoices</h3>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  View All Invoices &rarr;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Invoice No.</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Type</th>
                      <th className="p-3 text-right">Total Amount</th>
                      <th className="p-3 text-right">Due Balance</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.slice(0, 5).map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-blue-700">{inv.invoiceNumber}</td>
                        <td className="p-3 text-slate-600">{inv.invoiceDate}</td>
                        <td className="p-3">
                          <div className="font-medium text-slate-900">{inv.customerName}</div>
                          {inv.customerGstin && (
                            <div className="text-[10px] text-slate-400 font-mono">GSTIN: {inv.customerGstin}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              inv.isInterState
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {inv.isInterState ? 'IGST' : 'CGST+SGST'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">{formatINR(inv.grandTotal)}</td>
                        <td className="p-3 text-right font-bold text-rose-600">
                          {inv.outstandingAmount > 0 ? formatINR(inv.outstandingAmount) : '-'}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.paymentStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inv.paymentStatus === 'Partially Paid'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {inv.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => downloadInvoicePDFDirect(inv, company)}
                            className="p-1 text-emerald-700 hover:text-emerald-800 rounded hover:bg-emerald-50"
                            title="Instant Download PDF"
                          >
                            <Download className="w-3.5 h-3.5 inline" />
                          </button>
                          <button
                            onClick={() => setPreviewInvoice(inv)}
                            className="p-1 text-slate-600 hover:text-blue-600 rounded hover:bg-slate-100"
                            title="View / Print Invoice"
                          >
                            <Printer className="w-3.5 h-3.5 inline" />
                          </button>
                          <button
                            onClick={() => setEditingInvoice(inv)}
                            className="p-1 text-slate-600 hover:text-amber-600 rounded hover:bg-slate-100"
                            title="Edit Invoice (बिल संपादित करें)"
                          >
                            <Pencil className="w-3.5 h-3.5 inline" />
                          </button>
                          {inv.outstandingAmount > 0 && (
                            <button
                              onClick={() => setPaymentInvoice(inv)}
                              className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-semibold hover:bg-emerald-700"
                              title="Collect Payment"
                            >
                              Collect
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteInvoice(inv.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: INVOICES LIST & MANAGEMENT */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by invoice #, customer name, GSTIN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex border border-slate-300 rounded-lg overflow-hidden text-xs">
                  {(['all', 'Paid', 'Partially Paid', 'Unpaid'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setInvoiceFilter(st)}
                      className={`px-3 py-1.5 font-semibold transition-colors ${
                        invoiceFilter === st
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {st === 'all' ? 'All' : st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={exportInvoicesCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => setIsCreatingInvoice(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Invoice</span>
                </button>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Invoice No.</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Customer Details</th>
                      <th className="p-3">Place of Supply</th>
                      <th className="p-3 text-right">Taxable Val</th>
                      <th className="p-3 text-right">GST Total</th>
                      <th className="p-3 text-right">Grand Total</th>
                      <th className="p-3 text-right">Outstanding</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-slate-400">
                          No invoices found matching your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((inv) => {
                        const gstSum = inv.cgstTotal + inv.sgstTotal + inv.igstTotal;
                        return (
                          <tr key={inv.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-blue-700">{inv.invoiceNumber}</td>
                            <td className="p-3 text-slate-600">{inv.invoiceDate}</td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-900">{inv.customerName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {inv.customerGstin ? `GSTIN: ${inv.customerGstin}` : 'Consumer'}
                              </div>
                            </td>
                            <td className="p-3 text-slate-600">{inv.placeOfSupply}</td>
                            <td className="p-3 text-right font-medium">₹ {inv.taxableAmount.toFixed(2)}</td>
                            <td className="p-3 text-right text-slate-600">
                              <div>₹ {gstSum.toFixed(2)}</div>
                              <span className="text-[10px] text-slate-400">
                                {inv.isInterState ? 'IGST' : 'CGST+SGST'}
                              </span>
                            </td>
                            <td className="p-3 text-right font-bold text-slate-900 text-sm">
                              {formatINR(inv.grandTotal)}
                            </td>
                            <td className="p-3 text-right font-bold text-rose-600">
                              {inv.outstandingAmount > 0 ? formatINR(inv.outstandingAmount) : '₹ 0.00'}
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  inv.paymentStatus === 'Paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : inv.paymentStatus === 'Partially Paid'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {inv.paymentStatus}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-1 whitespace-nowrap">
                              <button
                                onClick={() => downloadInvoicePDFDirect(inv, company)}
                                className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold border border-emerald-300 inline-flex items-center"
                                title="Direct Download PDF to Device"
                              >
                                <Download className="w-3.5 h-3.5 inline mr-1" />
                                PDF
                              </button>
                              <button
                                onClick={() => setPreviewInvoice(inv)}
                                className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold border border-blue-200 inline-flex items-center"
                                title="View Tax Invoice"
                              >
                                <Printer className="w-3.5 h-3.5 inline mr-1" />
                                View
                              </button>
                              <button
                                onClick={() => setEditingInvoice(inv)}
                                className="px-2 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded text-xs font-semibold border border-amber-300 inline-flex items-center"
                                title="Edit Invoice (बिल एडिट करें)"
                              >
                                <Pencil className="w-3.5 h-3.5 inline mr-1" />
                                Edit
                              </button>
                              {inv.outstandingAmount > 0 && (
                                <button
                                  onClick={() => setPaymentInvoice(inv)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                                >
                                  Collect
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteInvoice(inv.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                                title="Delete Invoice"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: PRODUCTS & INVENTORY */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Inventory Catalog & Stock Ledger</h3>
                <p className="text-xs text-slate-500">
                  Total Asset Value: <strong>{formatINR(totalInventoryStockValuation)}</strong>
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsAddingPurchase(true)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  + Inward Purchase Bill
                </button>
                <button
                  onClick={() => setIsAddingProduct(true)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  + Add New Product
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">SKU / Code</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">HSN/SAC</th>
                      <th className="p-3 text-right">Cost Price</th>
                      <th className="p-3 text-right">Selling Price</th>
                      <th className="p-3 text-center">GST %</th>
                      <th className="p-3 text-center">Current Stock</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((prod) => {
                      const isLow = prod.currentStock <= prod.minimumStock && prod.currentStock < 900;
                      return (
                        <tr key={prod.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono text-slate-600 font-semibold">{prod.sku}</td>
                          <td className="p-3 font-bold text-slate-900">{prod.name}</td>
                          <td className="p-3 text-slate-500">{prod.category}</td>
                          <td className="p-3 font-mono text-slate-600">{prod.hsnSac || '-'}</td>
                          <td className="p-3 text-right font-medium">₹ {prod.purchasePrice.toFixed(2)}</td>
                          <td className="p-3 text-right font-bold text-blue-700">₹ {prod.sellingPrice.toFixed(2)}</td>
                          <td className="p-3 text-center font-semibold">{prod.gstRate}%</td>
                          <td className="p-3 text-center">
                            <span className="font-bold text-slate-900">
                              {prod.currentStock} {prod.unit}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {isLow ? (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                                Normal
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => setEditingProduct(prod)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-semibold text-xs border border-blue-200 inline-flex items-center"
                              title="Edit Product Details (उत्पाद संपादित करें)"
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => setAdjustingProduct(prod)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs border border-slate-300 inline-flex items-center"
                              title="Adjust Product Stock (स्टॉक बदलें)"
                            >
                              Stock
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-semibold text-xs border border-rose-200 inline-flex items-center transition-colors"
                              title="Delete Product & Stock (उत्पाद हटाएं)"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: CUSTOMERS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Customer & Client Directory</h3>
                <p className="text-xs text-slate-500">Manage registered B2B and B2C retail buyers</p>
              </div>
              <button
                onClick={() => setIsAddingCustomer(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> + Add Customer
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customers.map((c) => {
                // Calculate customer dues from invoices
                const custInvoices = invoices.filter((i) => i.customerId === c.id);
                const totalInvoiced = custInvoices.reduce((s, i) => s + i.grandTotal, 0);
                const custDue = custInvoices.reduce((s, i) => s + i.outstandingAmount, 0);

                return (
                  <div key={c.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{c.name}</h4>
                          {c.businessName && <p className="text-xs text-slate-500 font-medium">{c.businessName}</p>}
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 border">
                          {c.customerType}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        {c.gstin && (
                          <p>
                            <strong>GSTIN:</strong> <span className="font-mono font-semibold text-blue-700">{c.gstin}</span>
                          </p>
                        )}
                        <p>
                          <strong>Mobile:</strong> {c.mobile}
                        </p>
                        <p>
                          <strong>State:</strong> {c.state} (Code: {c.stateCode})
                        </p>
                        <p className="text-slate-500">{c.billingAddress}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-slate-500 text-[11px]">Total Outstanding:</span>
                        <div className={`font-bold ${custDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {formatINR(custDue)}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {custDue > 0 && (
                          <a
                            href={`https://wa.me/91${c.mobile}?text=${encodeURIComponent(
                              `Dear ${c.name}, gentle reminder from ${company.companyName} regarding outstanding invoice balance of ${formatINR(custDue)}. Kindly arrange the settlement at earliest. Thank you!`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded font-semibold text-xs flex items-center gap-1"
                          >
                            <Share2 className="w-3 h-3" /> WhatsApp Reminder
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setIsCreatingInvoice(true);
                          }}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded font-semibold text-xs"
                        >
                          Bill Now
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: PURCHASES */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'purchases' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Inward Purchase Bills & Vendor Invoicing</h3>
                <p className="text-xs text-slate-500">
                  Total Procurement: <strong>{formatINR(totalPurchasesAmount)}</strong> | Automatic stock replenishment
                </p>
              </div>
              <button
                onClick={() => setIsAddingPurchase(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> + Inward Purchase Bill
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Purchase No.</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Supplier</th>
                      <th className="p-3">Supplier Bill No.</th>
                      <th className="p-3">Items Purchased</th>
                      <th className="p-3 text-right">Subtotal</th>
                      <th className="p-3 text-right">Input Tax (ITC)</th>
                      <th className="p-3 text-right">Grand Total</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchases.map((pur) => (
                      <tr key={pur.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-emerald-700">{pur.purchaseNumber}</td>
                        <td className="p-3 text-slate-600">{pur.purchaseDate}</td>
                        <td className="p-3 font-semibold text-slate-900">{pur.supplierName}</td>
                        <td className="p-3 font-mono text-slate-600">{pur.supplierBillNumber || '-'}</td>
                        <td className="p-3">
                          {pur.items.map((it) => (
                            <div key={it.id} className="text-slate-700">
                              {it.productName} &times; {it.quantity}
                            </div>
                          ))}
                        </td>
                        <td className="p-3 text-right font-medium">₹ {pur.subtotal.toFixed(2)}</td>
                        <td className="p-3 text-right text-emerald-600 font-semibold">₹ {pur.taxAmount.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-slate-900">{formatINR(pur.grandTotal)}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                            {pur.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => setEditingPurchase(pur)}
                            className="px-2 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded text-xs font-semibold border border-emerald-300 inline-flex items-center"
                            title="Edit Purchase Bill (बिल संपादित करें)"
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePurchase(pur.id)}
                            className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-xs font-semibold border border-rose-200 inline-flex items-center transition-colors"
                            title="Delete Purchase Bill (खरीद बिल हटाएं)"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: EXPENSES */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Operational & Overhead Expenses</h3>
                <p className="text-xs text-slate-500">
                  Total Overhead Recorded: <strong>{formatINR(totalExpensesAmount)}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsAddingExpense(true)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> + Record Expense
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Payment Method</th>
                      <th className="p-3">Reference / Voucher</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="p-3 text-slate-600">{exp.expenseDate}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-[11px]">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-900">{exp.description}</td>
                        <td className="p-3 text-slate-600">{exp.paymentMethod}</td>
                        <td className="p-3 font-mono text-slate-500">{exp.referenceNumber || '-'}</td>
                        <td className="p-3 text-right font-bold text-rose-600 text-sm">
                          {formatINR(exp.amount)}
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => setEditingExpense(exp)}
                            className="px-2 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded text-xs font-semibold border border-amber-300 inline-flex items-center"
                            title="Edit Expense (खर्च संपादित करें)"
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-xs font-semibold border border-rose-200 inline-flex items-center transition-colors"
                            title="Delete Expense (खर्च हटाएं)"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 7: REPORTS (GST & P&L) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Profit & Loss Card */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 mb-1">Financial Performance & Profit & Loss Statement</h3>
              <p className="text-xs text-slate-500 mb-4">Financial Year 2026-27 (Current Period)</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <span className="text-xs font-semibold text-emerald-800 block">Total Revenue (Sales)</span>
                  <span className="text-xl font-black text-emerald-900 mt-1 block">
                    {formatINR(totalSalesRevenue)}
                  </span>
                  <span className="text-[11px] text-emerald-700">Gross invoiced billings</span>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                  <span className="text-xs font-semibold text-rose-800 block">Total Costs & Expenses</span>
                  <span className="text-xl font-black text-rose-900 mt-1 block">
                    {formatINR(totalPurchasesAmount + totalExpensesAmount)}
                  </span>
                  <span className="text-[11px] text-rose-700">
                    Procurement: {formatINR(totalPurchasesAmount)} + Overheads: {formatINR(totalExpensesAmount)}
                  </span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <span className="text-xs font-semibold text-blue-800 block">Estimated Operating Net Profit</span>
                  <span className="text-xl font-black text-blue-900 mt-1 block">
                    {formatINR(totalSalesRevenue - (totalPurchasesAmount + totalExpensesAmount))}
                  </span>
                  <span className="text-[11px] text-blue-700">Revenue minus outlays</span>
                </div>
              </div>
            </div>

            {/* GST Tax Returns Summary (GSTR-1 & GSTR-3B Friendly) */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-base text-slate-900">GSTR-1 & GSTR-3B Tax Liability Breakdown</h3>
                  <p className="text-xs text-slate-500">Output tax liability on outbound supplies</p>
                </div>
                <button
                  onClick={exportInvoicesCsv}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded text-xs font-semibold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Export Tax Ledger
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <span className="text-slate-500 block">Total CGST Collected:</span>
                  <span className="text-sm font-bold text-slate-900">
                    ₹ {invoices.reduce((s, i) => s + i.cgstTotal, 0).toFixed(2)}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <span className="text-slate-500 block">Total SGST Collected:</span>
                  <span className="text-sm font-bold text-slate-900">
                    ₹ {invoices.reduce((s, i) => s + i.sgstTotal, 0).toFixed(2)}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <span className="text-slate-500 block">Total IGST Collected:</span>
                  <span className="text-sm font-bold text-slate-900">
                    ₹ {invoices.reduce((s, i) => s + i.igstTotal, 0).toFixed(2)}
                  </span>
                </div>
                <div className="bg-blue-50 p-3 rounded border border-blue-200 text-blue-900">
                  <span className="text-blue-700 block">Input Tax Credit (ITC):</span>
                  <span className="text-sm font-bold">
                    ₹ {purchases.reduce((s, p) => s + p.taxAmount, 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* HSN Summary Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden mt-4">
                <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700">
                  HSN / SAC Summary (GSTR-1 Table 12 Compliant)
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">HSN/SAC</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-center">Total Qty</th>
                      <th className="p-2.5 text-right">Total Taxable Value</th>
                      <th className="p-2.5 text-right">Total Tax Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {['8471', '4802', '8544', '9983'].map((hsn) => {
                      const allItems = invoices.flatMap((i) => i.items).filter((it) => it.hsnSac === hsn);
                      if (allItems.length === 0) return null;

                      const totalQty = allItems.reduce((s, it) => s + it.quantity, 0);
                      const totalTaxable = allItems.reduce((s, it) => s + it.taxableAmount, 0);
                      const totalTax = allItems.reduce((s, it) => s + it.cgst + it.sgst + it.igst, 0);

                      return (
                        <tr key={hsn} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono font-bold text-blue-700">{hsn}</td>
                          <td className="p-2.5 text-slate-800">{allItems[0]?.productName}</td>
                          <td className="p-2.5 text-center font-semibold">{totalQty}</td>
                          <td className="p-2.5 text-right font-medium">₹ {totalTaxable.toFixed(2)}</td>
                          <td className="p-2.5 text-right font-bold text-slate-900">₹ {totalTax.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB: COMPANY PROFILE (ISOLATED MULTI-TENANT MANAGEMENT) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'profile' && (
          <CompanyProfileTab
            key={`${currentUser.id}_${company.logoUrl || ''}_${company.companyName}`}
            currentUser={currentUser}
            company={company}
            onUpdateCompany={(updated) => {
              setCompany(updated);
              try {
                localStorage.setItem(`smartbill_${currentUser.id}_company`, JSON.stringify(updated));
              } catch {}
            }}
          />
        )}

      </main>

      {/* Global Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              <strong>{company.companyName}</strong> &bull; User: {currentUser.name} ({currentUser.role}) &bull; GSTIN: <span className="font-mono">{company.gstin}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLogoModalOpen(true)}
              className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors flex items-center gap-1"
            >
              <Camera className="w-3.5 h-3.5" /> Company Logo
            </button>
            <span>&bull;</span>
            <button
              onClick={resetAllData}
              className="text-slate-400 hover:text-rose-600 transition-colors"
              title="Reset company demo data"
            >
              Reset Demo Data
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {previewInvoice && (
        <TaxInvoiceModal
          invoice={previewInvoice}
          company={company}
          onClose={() => setPreviewInvoice(null)}
        />
      )}

      {(isCreatingInvoice || editingInvoice) && (
        <CreateInvoiceModal
          company={company}
          customers={customers}
          products={products}
          nextInvoiceNum={nextInvoiceNumber}
          initialInvoice={editingInvoice || undefined}
          onClose={() => {
            setIsCreatingInvoice(false);
            setEditingInvoice(null);
          }}
          onSave={handleSaveInvoice}
        />
      )}

      {paymentInvoice && (
        <RecordPaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSavePayment={handleRecordPayment}
        />
      )}

      {(isAddingProduct || editingProduct) && (
        <AddProductModal
          initialProduct={editingProduct || undefined}
          onClose={() => {
            setIsAddingProduct(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          onDelete={handleDeleteProduct}
        />
      )}

      {adjustingProduct && (
        <StockAdjustModal
          product={adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          onSave={(pId, newStock) => {
            setProducts((prev) =>
              prev.map((p) => (p.id === pId ? { ...p, currentStock: newStock } : p))
            );
            setAdjustingProduct(null);
          }}
          onDeleteProduct={handleDeleteProduct}
        />
      )}

      {isAddingCustomer && (
        <AddCustomerModal
          onClose={() => setIsAddingCustomer(false)}
          onSave={(newCust) => {
            setCustomers([...customers, newCust]);
            setIsAddingCustomer(false);
          }}
        />
      )}

      {(isAddingExpense || editingExpense) && (
        <AddExpenseModal
          initialExpense={editingExpense || undefined}
          onClose={() => {
            setIsAddingExpense(false);
            setEditingExpense(null);
          }}
          onSave={handleSaveExpense}
          onDelete={handleDeleteExpense}
        />
      )}

      {(isAddingPurchase || editingPurchase) && (
        <AddPurchaseModal
          suppliers={suppliers}
          products={products}
          nextPurchaseNum={nextPurchaseNumber}
          initialPurchase={editingPurchase || undefined}
          onClose={() => {
            setIsAddingPurchase(false);
            setEditingPurchase(null);
          }}
          onSave={handleSavePurchase}
          onDelete={handleDeletePurchase}
        />
      )}

      {isLogoModalOpen && (
        <LogoUploadModal
          company={company}
          onClose={() => setIsLogoModalOpen(false)}
          onSaveLogo={handleSaveLogo}
        />
      )}
    </div>
  );
}
