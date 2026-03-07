/** @type {import('next').NextConfig} */
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers () {
    return [
      {
        source: '/(.*)',
        headers: [
          // Permitimos popups (requerido por GSI popup)
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          
          // Security headers
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { 
            key: 'Strict-Transport-Security', 
            value: 'max-age=31536000; includeSubDomains' 
          },
        ],
      },
    ]
  },
};

export default nextConfig
