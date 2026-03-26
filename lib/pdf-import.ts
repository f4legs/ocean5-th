const PDF_IMPORT_SIGNATURE = 'ocean5-th:pdf-import:v1'
const PDF_IMPORT_SIGNATURE_KEY = 'OCEANSignature'
const PDF_IMPORT_PAYLOAD_KEY = 'OCEANPayload'

export const PDF_UPLOAD_MAX_BYTES = 2 * 1024 * 1024 // 2 MB

interface PdfImportEnvelope {
  app: 'ocean5-th'
  format: 'ocean-export'
  version: 1
  exportData: unknown
}

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function decodePdfLiteralString(value: string): string {
  let result = ''

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i]
    if (char !== '\\') {
      result += char
      continue
    }

    const next = value[i + 1]
    if (!next) break
    i += 1

    if (next === 'n') { result += '\n'; continue }
    if (next === 'r') { result += '\r'; continue }
    if (next === 't') { result += '\t'; continue }
    if (next === 'b') { result += '\b'; continue }
    if (next === 'f') { result += '\f'; continue }
    if (next === '\\' || next === '(' || next === ')') { result += next; continue }
    if (next === '\n') continue
    if (next === '\r') {
      if (value[i + 1] === '\n') i += 1
      continue
    }

    if (/[0-7]/.test(next)) {
      let octal = next
      while (octal.length < 3 && /[0-7]/.test(value[i + 1] ?? '')) {
        octal += value[i + 1]
        i += 1
      }
      result += String.fromCharCode(parseInt(octal, 8))
      continue
    }

    result += next
  }

  return result
}

function extractInfoValue(pdfSource: string, key: string): string | null {
  const keyRefRegex = new RegExp(`/${escapeForRegex(key)}\\s+(\\d+)\\s+0\\s+R`)
  const keyRefMatch = keyRefRegex.exec(pdfSource)
  if (!keyRefMatch) return null

  const objectId = keyRefMatch[1]
  const objectRegex = new RegExp(`${objectId}\\s+0\\s+obj\\s*([\\s\\S]*?)\\s*endobj`)
  const objectMatch = objectRegex.exec(pdfSource)
  if (!objectMatch) return null

  const rawValue = objectMatch[1].trim()
  if (rawValue.startsWith('<') && rawValue.endsWith('>')) {
    const hex = rawValue.slice(1, -1).replace(/\s+/g, '')
    const normalized = hex.length % 2 === 0 ? hex : `${hex}0`
    return Buffer.from(normalized, 'hex').toString('utf8')
  }

  if (rawValue.startsWith('(') && rawValue.endsWith(')')) {
    return decodePdfLiteralString(rawValue.slice(1, -1))
  }

  return null
}

function isPdfImportEnvelope(value: unknown): value is PdfImportEnvelope {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<PdfImportEnvelope>
  return (
    candidate.app === 'ocean5-th' &&
    candidate.format === 'ocean-export' &&
    candidate.version === 1 &&
    'exportData' in candidate
  )
}

export function buildPdfImportMetadata(exportData: unknown): Record<string, Buffer> {
  const payload: PdfImportEnvelope = {
    app: 'ocean5-th',
    format: 'ocean-export',
    version: 1,
    exportData,
  }

  return {
    [PDF_IMPORT_SIGNATURE_KEY]: Buffer.from(PDF_IMPORT_SIGNATURE, 'utf8'),
    [PDF_IMPORT_PAYLOAD_KEY]: Buffer.from(JSON.stringify(payload), 'utf8'),
  }
}

export function extractExportDataFromPdf(buffer: Buffer): unknown {
  const pdfSource = buffer.toString('latin1')
  const signature = extractInfoValue(pdfSource, PDF_IMPORT_SIGNATURE_KEY)
  if (signature !== PDF_IMPORT_SIGNATURE) {
    throw new Error('Unsupported PDF signature')
  }

  const rawPayload = extractInfoValue(pdfSource, PDF_IMPORT_PAYLOAD_KEY)
  if (!rawPayload) {
    throw new Error('Missing embedded payload')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawPayload)
  } catch {
    throw new Error('Invalid embedded payload')
  }

  if (!isPdfImportEnvelope(parsed)) {
    throw new Error('Malformed embedded payload')
  }

  return parsed.exportData
}
