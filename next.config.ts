import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb', // বড় ভিডিও এবং ছবি আপলোডের সাইজ লিমিট বাড়ানোর জন্য
    },
  },
};

export default nextConfig;