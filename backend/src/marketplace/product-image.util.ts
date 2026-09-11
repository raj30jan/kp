import * as fs from 'fs'
import * as path from 'path'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { ProductImage } from './entities/product.entity'

/**
 * Root folder on disk where product images live. Served statically at
 * /uploads by main.ts (app.useStaticAssets). Layout:
 *
 *   uploads/products/{category}/{productId}/full/{file}.jpg
 *   uploads/products/{category}/{productId}/thumb/{file}.jpg
 */
export const UPLOADS_ROOT = path.join(process.cwd(), 'uploads')
const PRODUCTS_ROOT = path.join(UPLOADS_ROOT, 'products')

function productDir(category: string, productId: string) {
  const safeCategory = (category || 'other').replace(/[^a-z0-9_-]/gi, '_')
  return path.join(PRODUCTS_ROOT, safeCategory, productId)
}

/**
 * Save uploaded files (multer in-memory buffers) to disk as full-size +
 * thumbnail (400px wide) JPEGs, and return their public URLs.
 */
export async function saveProductImages(
  category: string,
  productId: string,
  files: Array<{ buffer: Buffer; originalname: string }>,
): Promise<ProductImage[]> {
  const dir = productDir(category, productId)
  const fullDir = path.join(dir, 'full')
  const thumbDir = path.join(dir, 'thumb')
  fs.mkdirSync(fullDir, { recursive: true })
  fs.mkdirSync(thumbDir, { recursive: true })

  const results: ProductImage[] = []
  for (const file of files) {
    const filename = `${uuidv4()}.jpg`
    const fullPath = path.join(fullDir, filename)
    const thumbPath = path.join(thumbDir, filename)

    await sharp(file.buffer).rotate().jpeg({ quality: 85 }).toFile(fullPath)
    await sharp(file.buffer).rotate().resize(400, 400, { fit: 'inside' }).jpeg({ quality: 80 }).toFile(thumbPath)

    const safeCategory = (category || 'other').replace(/[^a-z0-9_-]/gi, '_')
    results.push({
      full: `/uploads/products/${safeCategory}/${productId}/full/${filename}`,
      thumb: `/uploads/products/${safeCategory}/${productId}/thumb/${filename}`,
    })
  }
  return results
}

/** Recursively delete a product's entire image folder (full + thumb). */
export function deleteProductImages(category: string, productId: string): void {
  const dir = productDir(category, productId)
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}
