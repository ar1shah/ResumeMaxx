import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // pdf-parse accesses the file system at import time; keeping it external
  // prevents the Next.js bundler from inlining it and triggering that path.
  serverExternalPackages: ['pdf-parse'],
}

export default nextConfig
