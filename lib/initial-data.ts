import { CompanySettings, Customer, Expense, Invoice, Product, Purchase, Supplier } from './types';

export const DEFAULT_BRAND_LOGO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' width='200' height='200'%3E%3Cdefs%3E%3ClinearGradient id='bgGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%231e3a8a'/%3E%3Cstop offset='50%25' stop-color='%232563eb'/%3E%3Cstop offset='100%25' stop-color='%230ea5e9'/%3E%3C/linearGradient%3E%3ClinearGradient id='accentGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f59e0b'/%3E%3Cstop offset='100%25' stop-color='%23d97706'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='200' height='200' rx='36' fill='url(%23bgGrad)'/%3E%3Ccircle cx='100' cy='100' r='76' fill='none' stroke='white' stroke-opacity='0.2' stroke-width='3'/%3E%3Cpath d='M60 70 L100 45 L140 70 L140 130 L100 155 L60 130 Z' fill='none' stroke='white' stroke-width='8' stroke-linejoin='round'/%3E%3Cpath d='M80 88 C80 80 87 74 95 74 L110 74 C118 74 124 80 124 87 C124 94 118 100 110 100 L90 100 C82 100 76 106 76 113 C76 120 82 126 90 126 L115 126' fill='none' stroke='white' stroke-width='9' stroke-linecap='round'/%3E%3Cpolygon points='105,60 122,88 108,88 116,118 96,82 108,82' fill='url(%23accentGrad)'/%3E%3C/svg%3E";

export const initialCompanySettings: CompanySettings = {
  companyName: 'SmartBill Infotech',
  legalName: 'SmartBill Technologies Private Limited',
  logoUrl: DEFAULT_BRAND_LOGO,
  address: 'Office No. 504, Business Park, S.V. Road',
  city: 'Mumbai',
  state: 'Maharashtra',
  pinCode: '400053',
  mobile: '+91 98200 12345',
  email: 'billing@smartbill.in',
  gstin: '27AABCS1429B1Z5',
  pan: 'AABCS1429B',
  stateCode: '27',
  invoicePrefix: 'INV-2026',
  bankName: 'State Bank of India',
  accountNumber: '38491029384',
  ifsc: 'SBIN0001234',
  upiId: 'smartbill@sbi',
  termsConditions: '1. Goods once sold will not be taken back or exchanged.\n2. Payments must be cleared within 15 days of invoice date.\n3. All disputes are subject to Mumbai Jurisdiction.',
  authorizedSignatory: 'For SmartBill Technologies Pvt Ltd',
};

export const initialProducts: Product[] = [
  {
    id: 1,
    name: 'Wireless Optical Mouse',
    sku: 'ELEC-MOU-01',
    barcode: '8901234567890',
    category: 'Electronics & Hardware',
    hsnSac: '8471',
    unit: 'PCS',
    purchasePrice: 320.0,
    sellingPrice: 550.0,
    mrp: 699.0,
    gstRate: 18.0,
    currentStock: 25,
    minimumStock: 5,
    description: '2.4GHz ergonomically designed wireless mouse with nano receiver',
  },
  {
    id: 2,
    name: 'Mechanical USB Keyboard',
    sku: 'ELEC-KEY-02',
    barcode: '8901234567891',
    category: 'Electronics & Hardware',
    hsnSac: '8471',
    unit: 'PCS',
    purchasePrice: 1200.0,
    sellingPrice: 1850.0,
    mrp: 2200.0,
    gstRate: 18.0,
    currentStock: 15,
    minimumStock: 4,
    description: 'RGB Backlit mechanical keyboard with tactile blue switches',
  },
  {
    id: 3,
    name: 'A4 Copy Paper Ream 75 GSM (500 Sheets)',
    sku: 'STAT-PPR-01',
    barcode: '8901234567892',
    category: 'Office Supplies & Stationery',
    hsnSac: '4802',
    unit: 'BOX',
    purchasePrice: 190.0,
    sellingPrice: 280.0,
    mrp: 320.0,
    gstRate: 12.0,
    currentStock: 50,
    minimumStock: 10,
    description: 'Premium brightness 75 GSM high-speed xerox laser paper',
  },
  {
    id: 4,
    name: 'Fast Charging USB-C Cable (1.5m)',
    sku: 'ELEC-CAB-01',
    barcode: '8901234567893',
    category: 'Electronics & Hardware',
    hsnSac: '8544',
    unit: 'PCS',
    purchasePrice: 95.0,
    sellingPrice: 220.0,
    mrp: 299.0,
    gstRate: 18.0,
    currentStock: 40,
    minimumStock: 8,
    description: 'Braided 65W fast data sync & PD charging cord',
  },
  {
    id: 5,
    name: 'Annual GST Billing & ERP Support',
    sku: 'SERV-GST-01',
    barcode: '',
    category: 'Services & Consulting',
    hsnSac: '9983',
    unit: 'SET',
    purchasePrice: 2500.0,
    sellingPrice: 5000.0,
    mrp: 5000.0,
    gstRate: 18.0,
    currentStock: 999,
    minimumStock: 0,
    description: 'Comprehensive annual maintenance and GST compliance support',
  },
];

export const initialCustomers: Customer[] = [
  {
    id: 1,
    name: 'Rajesh Sharma',
    businessName: 'Apex Traders',
    mobile: '9821098210',
    email: 'rajesh@apextraders.com',
    billingAddress: 'Shop 12, Market Yard, Pune, Maharashtra - 411037',
    gstin: '27AADCA1234A1Z1',
    pan: 'AADCA1234A',
    state: 'Maharashtra',
    stateCode: '27',
    customerType: 'Registered',
    outstandingBalance: 0.0,
  },
  {
    id: 2,
    name: 'Sunil Patel',
    businessName: 'Gujarat Hardware Mart',
    mobile: '9898012345',
    email: 'sunil@gujhardware.in',
    billingAddress: 'Plot 44, Near Ring Road, Surat, Gujarat - 395002',
    gstin: '24AABCP5678B1Z2',
    pan: 'AABCP5678B',
    state: 'Gujarat',
    stateCode: '24',
    customerType: 'Registered',
    outstandingBalance: 2136.0,
  },
  {
    id: 3,
    name: 'Amit Verma',
    businessName: 'Verma Enterprises',
    mobile: '9811234567',
    email: 'amit@vermaent.com',
    billingAddress: 'B-14, Sector 18, Noida, Uttar Pradesh - 201301',
    gstin: '09ABCDE1234F1Z5',
    pan: 'ABCDE1234F',
    state: 'Uttar Pradesh',
    stateCode: '09',
    customerType: 'Registered',
    outstandingBalance: 0.0,
  },
  {
    id: 4,
    name: 'Vikram Malhotra',
    businessName: 'Local Retail Buyer',
    mobile: '9876500001',
    email: 'vikram@gmail.com',
    billingAddress: 'Flat 302, Andheri West, Mumbai, Maharashtra - 400058',
    gstin: '',
    pan: '',
    state: 'Maharashtra',
    stateCode: '27',
    customerType: 'Consumer',
    outstandingBalance: 0.0,
  },
];

export const initialSuppliers: Supplier[] = [
  {
    id: 1,
    name: 'National Tech Distributors',
    businessName: 'National Tech Dist Ltd',
    mobile: '9833011223',
    email: 'sales@nationaltech.com',
    address: 'Lamington Road, Grant Road, Mumbai, Maharashtra - 400007',
    gstin: '27AABCN8899K1Z4',
    state: 'Maharashtra',
    stateCode: '27',
  },
  {
    id: 2,
    name: 'Global Impex Goods',
    businessName: 'Global Impex Corp',
    mobile: '9844055667',
    email: 'orders@globalimpex.in',
    address: 'Phase 2, Gandhinagar GIDC, Gujarat - 382028',
    gstin: '24AABCG3344J1Z8',
    state: 'Gujarat',
    stateCode: '24',
  },
];

export const initialInvoices: Invoice[] = [
  {
    id: 1,
    invoiceNumber: 'INV-2026-1001',
    invoiceDate: '2026-09-20',
    dueDate: '2026-10-05',
    customerId: 1,
    customerName: 'Rajesh Sharma (Apex Traders)',
    customerGstin: '27AADCA1234A1Z1',
    customerAddress: 'Shop 12, Market Yard, Pune, Maharashtra - 411037',
    customerState: 'Maharashtra',
    customerStateCode: '27',
    placeOfSupply: 'Maharashtra (27)',
    isInterState: false,
    items: [
      {
        id: '1-1',
        productId: 1,
        productName: 'Wireless Optical Mouse',
        hsnSac: '8471',
        quantity: 2,
        unit: 'PCS',
        rate: 550,
        discountPercent: 0,
        taxableAmount: 1100,
        gstRate: 18,
        cgst: 99,
        sgst: 99,
        igst: 0,
        total: 1298,
      },
      {
        id: '1-2',
        productId: 2,
        productName: 'Mechanical USB Keyboard',
        hsnSac: '8471',
        quantity: 1,
        unit: 'PCS',
        rate: 1850,
        discountPercent: 5.4,
        taxableAmount: 1750,
        gstRate: 18,
        cgst: 157.5,
        sgst: 157.5,
        igst: 0,
        total: 2065,
      },
      {
        id: '1-3',
        productId: 3,
        productName: 'A4 Copy Paper Ream 75 GSM (500 Sheets)',
        hsnSac: '4802',
        quantity: 3,
        unit: 'BOX',
        rate: 280,
        discountPercent: 0,
        taxableAmount: 840,
        gstRate: 12,
        cgst: 50.4,
        sgst: 50.4,
        igst: 0,
        total: 940.8,
      },
    ],
    subtotal: 3790,
    discountTotal: 100,
    taxableAmount: 3690,
    cgstTotal: 306.9,
    sgstTotal: 306.9,
    igstTotal: 0,
    roundOff: 0.2,
    grandTotal: 4304,
    paidAmount: 4304,
    outstandingAmount: 0,
    paymentStatus: 'Paid',
    paymentMode: 'UPI (Ref: UPI/2026/894819028)',
    notes: 'Delivered via Express Courier. Thank you for your business!',
    createdAt: '2026-09-20T10:30:00Z',
  },
  {
    id: 2,
    invoiceNumber: 'INV-2026-1002',
    invoiceDate: '2026-09-21',
    dueDate: '2026-10-06',
    customerId: 2,
    customerName: 'Sunil Patel (Gujarat Hardware Mart)',
    customerGstin: '24AABCP5678B1Z2',
    customerAddress: 'Plot 44, Near Ring Road, Surat, Gujarat - 395002',
    customerState: 'Gujarat',
    customerStateCode: '24',
    placeOfSupply: 'Gujarat (24)',
    isInterState: true,
    items: [
      {
        id: '2-1',
        productId: 3,
        productName: 'A4 Copy Paper Ream 75 GSM (500 Sheets)',
        hsnSac: '4802',
        quantity: 10,
        unit: 'BOX',
        rate: 280,
        discountPercent: 0,
        taxableAmount: 2800,
        gstRate: 12,
        cgst: 0,
        sgst: 0,
        igst: 336,
        total: 3136,
      },
    ],
    subtotal: 2800,
    discountTotal: 0,
    taxableAmount: 2800,
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 336,
    roundOff: 0,
    grandTotal: 3136,
    paidAmount: 1000,
    outstandingAmount: 2136,
    paymentStatus: 'Partially Paid',
    paymentMode: 'Bank Transfer (NEFT-SBIN20260901)',
    notes: 'Advance token of ₹1,000 received. Balance payable upon delivery.',
    createdAt: '2026-09-21T14:15:00Z',
  },
];

export const initialPurchases: Purchase[] = [
  {
    id: 1,
    purchaseNumber: 'PUR-2026-0001',
    supplierId: 1,
    supplierName: 'National Tech Distributors',
    supplierBillNumber: 'NT-2026-88',
    purchaseDate: '2026-09-18',
    items: [
      {
        id: 'p-1',
        productId: 1,
        productName: 'Wireless Optical Mouse',
        quantity: 20,
        purchasePrice: 320,
        gstRate: 18,
        total: 7552,
      },
    ],
    subtotal: 6400,
    taxAmount: 1152,
    grandTotal: 7552,
    paymentStatus: 'Paid',
    notes: 'Initial stock replenishment of optical mice',
  },
];

export const initialExpenses: Expense[] = [
  {
    id: 1,
    expenseDate: '2026-09-20',
    category: 'Internet & Telecom',
    amount: 1499,
    paymentMethod: 'UPI',
    referenceNumber: 'AIRTEL-JAN-26',
    description: 'High-speed Fiber Internet Office Plan (300 Mbps)',
  },
  {
    id: 2,
    expenseDate: '2026-09-21',
    category: 'Office Expense',
    amount: 450,
    paymentMethod: 'Cash',
    referenceNumber: 'VOUCH-001',
    description: 'Staff Pantry Refreshments, Tea & Snacks',
  },
];

export const indianStates = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
];

export function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
}

export function numberToWordsINR(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Rupees Zero Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertChunk(n: number): string {
    let str = '';
    if (n >= 100) {
      str += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 10 && n <= 19) {
      str += teens[n - 10] + ' ';
    } else if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      if (n % 10 > 0) str += units[n % 10] + ' ';
    } else if (n > 0) {
      str += units[n] + ' ';
    }
    return str.trim();
  }

  let num = rounded;
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remainder = num;

  let words = '';
  if (crore > 0) words += convertChunk(crore) + ' Crore ';
  if (lakh > 0) words += convertChunk(lakh) + ' Lakh ';
  if (thousand > 0) words += convertChunk(thousand) + ' Thousand ';
  if (remainder > 0) words += convertChunk(remainder);

  return `Rupees ${words.trim()} Only`;
}
