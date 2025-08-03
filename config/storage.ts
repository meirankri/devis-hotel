import { S3Client } from "@aws-sdk/client-s3";
import env from "@/lib/env";

export const R2 = new S3Client({
  region: env.CLOUDFLARE_REGION || 'auto',
  endpoint: env.CLOUDFLARE_ENDPOINT || `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_ACCESS_KEY || '',
    secretAccessKey: env.CLOUDFLARE_SECRET_KEY || '',
  },
  forcePathStyle: true,
  requestHandler: {
    connectionTimeout: 10000,
    socketTimeout: 10000,
  },
});
