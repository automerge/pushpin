/* URI lists
 * (mimetype: application/uri-list)
 */

export const MIME_TYPE = 'application/uri-list'

export function parse(uriList: string): string[] {
  return uriList.split('\n').filter((s) => s && s[0] !== '#')
}

export function stringify(uris: string[]): string {
  return uris.join('\n')
}
