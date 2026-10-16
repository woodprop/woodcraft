// Домен нашего хранилища Vercel Blob. Без "server-only": нужен и next.config.ts.
// Публичные файлы store_AbC123 отдаются с abc123.public.blob.vercel-storage.com.

/** id store из BLOB_STORE_ID (OIDC) или из старого токена vercel_blob_rw_<id>_<секрет> */
export function blobHost(env: Record<string, string | undefined> = process.env) {
  const id = env.BLOB_STORE_ID?.replace(/^store_/, "") ?? env.BLOB_READ_WRITE_TOKEN?.split("_")[3];
  return id && /^[A-Za-z0-9]+$/.test(id) ? `${id.toLowerCase()}.public.blob.vercel-storage.com` : undefined;
}
