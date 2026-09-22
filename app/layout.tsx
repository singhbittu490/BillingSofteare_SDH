import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'SmartBill - GST Billing & Invoicing Software',
  description: 'Production-ready web-based Billing & GST Invoice Management System with complete customer, supplier, inventory, invoice, and GST tax management.',
  openGraph: {
    title: 'SmartBill - GST Billing & Invoicing Software',
    description: 'Production-ready web-based Billing & GST Invoice Management System with complete customer, supplier, inventory, invoice, and GST tax management.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SmartBill - GST Billing & Invoicing Software',
    description: 'Production-ready web-based Billing & GST Invoice Management System with complete customer, supplier, inventory, invoice, and GST tax management.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
