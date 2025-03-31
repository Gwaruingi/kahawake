'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 5000,
        style: {
          background: '#fff',
          color: '#333',
        },
        success: {
          style: {
            background: '#ECFDF5',
            color: '#065F46',
            border: '1px solid #D1FAE5',
          },
        },
        error: {
          style: {
            background: '#FEF2F2',
            color: '#B91C1C',
            border: '1px solid #FEE2E2',
          },
        },
      }}
    />
  );
}
