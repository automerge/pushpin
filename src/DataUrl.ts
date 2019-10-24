export interface DataUrlInfo {
  mimeType: string
  data: string
  isBase64: boolean
}

const PATTERN = /^data:(?<mimeType>[^;,]*)(?<isBase64>;base64)?,(?<data>.*)$/

export function parse(dataUrl: string): DataUrlInfo | null {
  const match = dataUrl.match(PATTERN)
  if (!match || !match.groups) return null
  return {
    mimeType: match.groups.mimeType || 'text/plain',
    data: match.groups.data,
    isBase64: !!match.groups.isBase64,
  }
}
