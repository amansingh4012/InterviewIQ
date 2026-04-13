import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

const connectSrc = [
  "'self'",
  "https://*.clerk.com",
  "https://clerk.com",
  "https://*.clerk.accounts.dev",
  "https://clerk.accounts.dev",
  "wss://*.clerk.com",
  "wss://*.clerk.accounts.dev",
];

// Add the API URL to connect-src (production or development)
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (apiUrl) {
  try {
    const apiOrigin = new URL(apiUrl).origin;
    if (!connectSrc.includes(apiOrigin)) {
      connectSrc.push(apiOrigin);
    }
  } catch {
    // Invalid URL, skip
  }
}

if (isDevelopment) {
  connectSrc.push(
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "ws://localhost:3000",
    "ws://127.0.0.1:3000"
  );
}

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(self), geolocation=(), payment=(), usb=()'
  },
  // SECURITY: Content Security Policy to prevent XSS
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.com https://clerk.com https://*.clerk.accounts.dev https://clerk.accounts.dev",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "media-src 'self' blob:",
      `connect-src ${connectSrc.join(" ")}`,
      "frame-src 'self' https://*.clerk.com https://clerk.com https://*.clerk.accounts.dev https://clerk.accounts.dev",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  },
];

// Add HSTS only in production
if (process.env.NODE_ENV === 'production') {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  });
}

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },

  // Security headers for all routes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Configure allowed image domains if using next/image
  images: {
    remotePatterns: [
      // Add trusted image domains here if needed
    ],
  },
  
  // Enable strict mode for better security
  reactStrictMode: true,
};

export default nextConfig;
