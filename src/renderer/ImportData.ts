import path from 'path'
import { isPushpinUrl, PushpinUrl } from './ShareLink'
import ContentTypes from './ContentTypes'

export type CreatedContentCallback = (contentUrl: PushpinUrl, index: number) => void

export function importDataTransfer(dataTransfer: DataTransfer, callback: CreatedContentCallback) {
  const url = dataTransfer.getData('application/pushpin-url')
  if (url) {
    callback(url as PushpinUrl, 0)
    return
  }

  if (dataTransfer.files.length > 0) {
    importFileList(dataTransfer.files, callback)
    return
  }

  // If we can't get the item as a bunch of files, let's hope it works as plaintext.
  const plainText = dataTransfer.getData('text/plain')
  if (plainText) {
    importPlainText(plainText, callback)
  }
}

export function importFileList(files: FileList, callback: CreatedContentCallback) {
  /* Adapted from:
    https://www.meziantou.net/2017/09/04/upload-files-and-directories-using-an-input-drag-and-drop-or-copy-and-paste-with */
  const { length } = files
  // fun fact: as of this writing, onDrop dataTransfer doesn't support iterators, but onPaste does
  // hence the oldschool iteration code
  for (let i = 0; i < length; i += 1) {
    const entry = files[i]
    ContentTypes.createFromFile(entry, (url) => callback(url, i))
  }
}

function importPlainText(plainText: string, callback: CreatedContentCallback) {
  try {
    // wait!? is this some kind of URL?
    const url = new URL(plainText)
    // for pushpin URLs pasted in, let's turn them into cards
    if (isPushpinUrl(plainText)) {
      callback(plainText, 0)
    } else {
      determineUrlContents(url, callback)
    }
  } catch (e) {
    // i guess it's not a URL after all, we'lll just make a text card
    ContentTypes.create('text', { text: plainText }, (url) => callback(url, 0))
  }
}

function determineUrlContents(url, callback: CreatedContentCallback) {
  fetch(url)
    .then((response) => {
      if (!response.ok) throw Error('Fetch failed, just keep the text.')
      return response.blob()
    })
    .then((blob) => {
      if (!blob) {
        return
      }
      const { pathname } = url
      const filename = path.basename(pathname)
      const file = new File([blob], filename, { type: blob.type, lastModified: Date.now() })
      ContentTypes.createFromFile(file, (contentUrl) => callback(contentUrl, 0))
    })
    .catch((error) => {
      // this is fine, really -- the URL upgrade to content is optional.
      // it'd be nice to do something more sophisticated, perhaps
      ContentTypes.create('text', { text: url.toString() }, (contentUrl) => callback(contentUrl, 0))
    })
}
