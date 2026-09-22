export interface CompanySettings {
  companyName: string;
  legalName: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  mobile: string;
  email: string;
  gstin: string;
  pan: string;
  stateCode: string;
  invoicePrefix: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
  termsConditions: string;
  authorizedSignatory: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Accountant' | 'Sales Staff';
  phone?: string;
  lastLogin: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  hsnSac: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  gstRate: number;
  currentStock: number;
  minimumStock: number;
  description?: string;
}

export interface Customer {
  id: number;
  name: string;
  businessName?: string;
  mobile: string;
  email?: string;
  billingAddress: string;
  gstin?: string;
  pan?: string;
  state: string;
  stateCode: string;
  customerType: 'Registered' | 'Unregistered' | 'Composition' | 'Consumer';
  outstandingBalance: number;
}

export interface Supplier {
  id: number;
  name: string;
  businessName?: string;
  mobile: string;
  email?: string;
  address: string;
  gstin?: string;
  state: string;
  stateCode: string;
}

export interface InvoiceItem {
  id: string;
  productId: number;
  productName: string;
  hsnSac: string;
  quantity: number;
  unit: string;
  rate: number;
  discountPercent: number;
  taxableAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerId: number;
  customerName: string;
  customerGstin?: string;
  customerAddress: string;
  customerState: string;
  customerStateCode: string;
  placeOfSupply: string;
  isInterState: boolean;
  reverseCharge?: boolean;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid';
  paymentMode?: string;
  notes?: string;
  createdAt: string;
}

export interface Payment {
  id: number;
  paymentDate: string;
  customerId: number;
  invoiceId: number;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}

export interface PurchaseItem {
  id: string;
  productId: number;
  productName: string;
  quantity: number;
  purchasePrice: number;
  gstRate: number;
  total: number;
}

export interface Purchase {
  id: number;
  purchaseNumber: string;
  supplierId: number;
  supplierName: string;
  supplierBillNumber?: string;
  purchaseDate: string;
  items: PurchaseItem[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  paymentStatus: 'Paid' | 'Unpaid';
  notes?: string;
}

export interface Expense {
  id: number;
  expenseDate: string;
  category: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  description: string;
}
