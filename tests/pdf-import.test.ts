// @vitest-environment node

import PDFDocument from 'pdfkit'
import { describe, expect, it } from 'vitest'
import { buildPdfImportMetadata, extractExportDataFromPdf } from '@/lib/pdf-import'

function createPdfBuffer(extraInfo: Record<string, string | Buffer> = {}): Promise<Buffer> {
  const doc = new PDFDocument({
    info: {
      Title: 'Test PDF',
      Author: 'Test',
      Subject: 'Test',
      Keywords: 'test',
      ...extraInfo,
    },
  })

  const chunks: Buffer[] = []

  return new Promise((resolve, reject) => {
    doc.on('data', chunk => chunks.push(Buffer.from(chunk)))
    doc.on('error', reject)
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.text('hello')
    doc.end()
  })
}

describe('pdf import metadata', () => {
  it('extracts embedded export data from app-generated metadata', async () => {
    const exportData = {
      testId: 'ipip-neo-120-th',
      scores: {
        raw: { O: 11, C: 22, E: 33, A: 44, N: 55 },
        pct: { O: 10, C: 20, E: 30, A: 40, N: 50 },
      },
      profile: null,
      answers: null,
    }

    const pdfBuffer = await createPdfBuffer(buildPdfImportMetadata(exportData))
    const parsed = extractExportDataFromPdf(pdfBuffer)

    expect(parsed).toEqual(exportData)
  })

  it('rejects PDF without app signature metadata', async () => {
    const pdfBuffer = await createPdfBuffer()

    expect(() => extractExportDataFromPdf(pdfBuffer)).toThrow('Unsupported PDF signature')
  })

  it('rejects malformed embedded payload JSON', async () => {
    const pdfBuffer = await createPdfBuffer({
      OCEANSignature: Buffer.from('ocean5-th:pdf-import:v1', 'utf8'),
      OCEANPayload: Buffer.from('{invalid-json', 'utf8'),
    })

    expect(() => extractExportDataFromPdf(pdfBuffer)).toThrow('Invalid embedded payload')
  })
})
