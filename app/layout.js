import './globals.css';
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'WindVeal',
  description: 'Hybrid AI Assistant',
  icons: {
    icon: [
      { url: '/images/favicon.ico', sizes: 'any' },
      { url: '/images/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/images/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/images/android-chrome-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/images/android-chrome-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/images/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
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