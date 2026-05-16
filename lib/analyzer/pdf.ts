// pdf-parse must be listed in serverExternalPackages (next.config.ts) so the
// Next.js bundler doesn't try to inline it — the package needs Node.js file
// system access at runtime.
import { PDFParse } from 'pdf-parse'

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  const result = await parser.getText()
  return result.text
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
