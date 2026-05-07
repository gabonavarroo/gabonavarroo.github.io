/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: '',
  webpack(config) {
    config.module.rules.push({
      test: /\.(glsl|frag|vert)$/i,
      type: 'asset/source',
    });

    return config;
  },
};

module.exports = nextConfig;
