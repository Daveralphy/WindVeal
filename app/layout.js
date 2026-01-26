import './globals.css';
import { Inter } from 'next/font/google'
import favicon from '@/images/favicon.ico';
import favicon32 from '@/images/favicon-32x32.png';
import favicon16 from '@/images/favicon-16x16.png';
import android192 from '@/images/android-chrome-192x192.png';
import android512 from '@/images/android-chrome-512x512.png';
import appleIcon from '@/images/apple-touch-icon.png';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'WindVeal',
  description: 'Hybrid AI Assistant',
  icons: {
    icon: [
      { url: favicon.src, sizes: 'any' },
      { url: favicon32.src, type: 'image/png', sizes: '32x32' },
      { url: favicon16.src, type: 'image/png', sizes: '16x16' },
      { url: android192.src, type: 'image/png', sizes: '192x192' },
      { url: android512.src, type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: appleIcon.src, sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/images/site.webmanifest',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}