import type { NextConfig } from "next";
const nextConfig:NextConfig={reactStrictMode:true,serverExternalPackages:["@remotion/bundler","@remotion/renderer"],experimental:{serverActions:{bodySizeLimit:"5mb"}}};
export default nextConfig;
