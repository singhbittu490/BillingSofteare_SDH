import { CustomerPortalView } from '@/components/customer/CustomerPortalView';

export const metadata = {
  title: 'Customer Registration & Login Portal | SmartBill',
  description: 'Secure customer registration, mobile OTP verification, and authenticated dashboard access.',
};

export default function CustomerPortalPage() {
  return <CustomerPortalView />;
}
