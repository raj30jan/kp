import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { UPLOADS_ROOT } from '../marketplace/product-image.util'

/**
 * Save a non-image document (Aadhaar card, resume/CV) to disk as-is and
 * return its public URL. Unlike saveProductImages these are NOT re-encoded
 * — providers may upload PDFs or photos of documents, so we keep the
 * original bytes and extension. Served statically at /uploads by main.ts.
 *
 *   uploads/services/{serviceId}/docs/{uuid}.{ext}
 */
const SERVICES_ROOT = path.join(UPLOADS_ROOT, 'services')

const EXT_BY_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

export function saveServiceDocument(
  serviceId: string,
  file: { buffer: Buffer; originalname: string; mimetype?: string },
): string {
  const dir = path.join(SERVICES_ROOT, serviceId, 'docs')
  fs.mkdirSync(dir, { recursive: true })

  const ext =
    EXT_BY_MIME[file.mimetype || ''] ||
    (path.extname(file.originalname || '').toLowerCase().match(/^\.[a-z0-9]{1,5}$/)?.[0] ?? '.bin')
  const filename = `${uuidv4()}${ext}`
  fs.writeFileSync(path.join(dir, filename), file.buffer)

  return `/uploads/services/${serviceId}/docs/${filename}`
}

/** Remove all stored docs for a service (used on permanent delete). */
export function deleteServiceDocuments(serviceId: string) {
  try {
    fs.rmSync(path.join(SERVICES_ROOT, serviceId), { recursive: true, force: true })
  } catch {}
}
