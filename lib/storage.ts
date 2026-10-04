import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * Backblaze B2 through its S3-compatible API. Photos go in a public bucket
 * under unguessable keys, and the resulting URL is stored on the wish — so the
 * card renders a plain <img> with no signing and nothing to expire.
 */

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** Extension comes from the sniffed type, never from the filename. */
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/heic": "heic",
};

export function isAllowedImage(type: string): boolean {
  return type in MIME_EXT;
}

type Config = {
  bucket: string;
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBase: string;
};

function config(): Config | null {
  const bucket = process.env.B2_BUCKET;
  const endpoint = process.env.B2_ENDPOINT;
  const accessKeyId = process.env.B2_KEY_ID;
  const secretAccessKey = process.env.B2_APP_KEY;
  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) return null;

  // B2 endpoints look like https://s3.us-west-004.backblazeb2.com
  const region = process.env.B2_REGION ?? endpoint.match(/s3\.([^.]+)\./)?.[1] ?? "us-east-005";
  const publicBase = (
    process.env.B2_PUBLIC_BASE_URL ?? `${endpoint.replace("://", `://${bucket}.`)}`
  ).replace(/\/$/, "");

  return { bucket, endpoint, region, accessKeyId, secretAccessKey, publicBase };
}

export function storageReady(): boolean {
  return config() !== null;
}

let client: S3Client | null = null;

function s3(cfg: Config): S3Client {
  client ??= new S3Client({
    endpoint: cfg.endpoint,
    region: cfg.region,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  });
  return client;
}

/** Returns the public URL of the stored object. */
export async function uploadImage(body: Uint8Array, contentType: string): Promise<string> {
  const cfg = config();
  if (!cfg) throw new Error("Photo storage is not configured.");

  const key = `wishes/${crypto.randomUUID()}.${MIME_EXT[contentType]}`;

  await s3(cfg).send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Keys are unique per upload, so the object never needs revalidating.
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return `${cfg.publicBase}/${key}`;
}
