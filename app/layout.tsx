import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OrderCheck — Order Comparison Tool',
  description: 'Compare customer PO against entered order to catch discrepancies',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
