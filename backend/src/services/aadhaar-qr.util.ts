import * as zlib from 'zlib'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import sharp from 'sharp'
import jsQR from 'jsqr'

/**
 * Aadhaar Secure QR verification — fully offline, no UIDAI API/registration.
 *
 * Every e-Aadhaar / PVC card carries a "secure QR" whose text is a base-10
 * big-integer. Decoding it yields a gzip payload of 0xFF-delimited
 * demographic fields + a JP2000 photo + optional email/mobile hashes +
 * a trailing 256-byte RSA-SHA256 signature. We verify that signature
 * against UIDAI's published public certificates (bundled in certs/uidai),
 * which proves the card data is authentic and untampered.
 */

const CERT_DIR = path.join(process.cwd(), 'certs', 'uidai')
const SIG_LEN = 256
const DELIM = 0xff
const TEXT_FIELD_COUNT = 16 // indicator + 15 demographic fields (…VTC)

export interface AadhaarQrResult {
  found: boolean
  verified: boolean
  name?: string
  dob?: string
  gender?: string
  pincode?: string
  address?: string
  last4?: string
  error?: string
}

let cachedKeys: crypto.KeyObject[] | null = null

/** Load every bundled UIDAI public certificate as a verify key. */
function uidaiKeys(): crypto.KeyObject[] {
  if (cachedKeys) return cachedKeys
  cachedKeys = []
  try {
    for (const f of fs.readdirSync(CERT_DIR)) {
      if (!f.endsWith('.cer') && !f.endsWith('.crt') && !f.endsWith('.pem')) continue
      try {
        const der = fs.readFileSync(path.join(CERT_DIR, f))
        const x509 = new crypto.X509Certificate(der)
        cachedKeys.push(x509.publicKey)
      } catch {}
    }
  } catch {}
  return cachedKeys
}

/** Decode the QR text out of an uploaded image buffer. */
async function readQrText(image: Buffer): Promise<string | null> {
  try {
    const { data, info } = await sharp(image)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const qr = jsQR(new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), info.width, info.height)
    return qr?.data?.trim() || null
  } catch {
    return null
  }
}

/** base-10 big-integer string -> byte array (strip sign byte). */
function decimalToBytes(dec: string): Buffer {
  let hex = BigInt(dec).toString(16)
  if (hex.length % 2) hex = '0' + hex
  let buf = Buffer.from(hex, 'hex')
  if (buf.length && buf[0] === 0) buf = buf.subarray(1)
  return buf
}

/** Split the leading 0xFF-delimited text fields (up to VTC). */
function parseTextFields(signed: Buffer): string[] {
  const fields: string[] = []
  let start = 0
  for (let i = 0; i < signed.length && fields.length < TEXT_FIELD_COUNT; i++) {
    if (signed[i] === DELIM) {
      fields.push(signed.subarray(start, i).toString('latin1'))
      start = i + 1
    }
  }
  return fields
}

/**
 * Verify an uploaded Aadhaar card image. Returns found=false when no QR is
 * present (e.g. a photo of an old card or a non-Aadhaar image) — the caller
 * should treat that as "needs manual review", not as fraud.
 */
export async function verifyAadhaarQr(image: Buffer): Promise<AadhaarQrResult> {
  const qrText = await readQrText(image)
  if (!qrText) return { found: false, verified: false, error: 'no QR code found' }
  if (!/^\d+$/.test(qrText)) return { found: false, verified: false, error: 'QR is not an Aadhaar secure code' }

  let payload: Buffer
  try {
    const raw = decimalToBytes(qrText)
    try {
      payload = zlib.gunzipSync(raw)
    } catch {
      try {
        payload = zlib.inflateSync(raw)
      } catch {
        payload = raw
      }
    }
  } catch {
    return { found: true, verified: false, error: 'could not decode QR payload' }
  }

  if (payload.length <= SIG_LEN) return { found: true, verified: false, error: 'payload too short' }
  const signature = payload.subarray(payload.length - SIG_LEN)
  const signed = payload.subarray(0, payload.length - SIG_LEN)

  // Verify RSA-SHA256 over the signed region against each UIDAI cert.
  let verified = false
  for (const key of uidaiKeys()) {
    try {
      if (crypto.verify('RSA-SHA256', signed, key, signature)) { verified = true; break }
      if (crypto.verify('RSA-SHA256', signed, { key, padding: crypto.constants.RSA_PKCS1_PSS_PADDING }, signature)) { verified = true; break }
    } catch {}
  }

  const f = parseTextFields(signed)
  const refId = f[1] || ''
  const addressParts = [f[8], f[9], f[7], f[13], f[14], f[6], f[15], f[12], f[10]]
    .filter((s) => s && s.trim())

  return {
    found: true,
    verified,
    name: f[2] || undefined,
    dob: f[3] || undefined,
    gender: f[4] || undefined,
    pincode: f[10] || undefined,
    address: addressParts.join(', ') || undefined,
    last4: refId.slice(0, 4) || undefined,
  }
}
