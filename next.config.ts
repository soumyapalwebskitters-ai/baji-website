import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import { release } from 'node:os';

// macOS 12 cannot run workerd; reviews use local SQLite during development there.
if (process.platform !== 'darwin' || Number(release().split('.')[0]) >= 22) {
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.6.192'],
};

export default nextConfig;
