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
  // If we can identify html that's a simple image, import the image.
  const html = dataTransfer.getData('text/html')
  if (html) {
    importImagesFromHTML(html, callback)
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

function importImagesFromHTML(html: string, callback: CreatedContentCallback) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('sandbox', '')
  try {
    document.body.appendChild(iframe)
    iframe.contentDocument!.documentElement.innerHTML = html
    const images = iframe.contentDocument!.getElementsByTagName('img')
    if (images.length > 0) {
      determineUrlContents(images[0].src, callback)
    }
  } finally {
    iframe.remove()
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
      if (!response.ok) throw Error('Fetch failed, just make a URL card.')
      const contentType = response.headers.get('Content-Type')
      if (contentType && contentType.indexOf('text/html') !== -1) {
        // looks like we got ourselves a website
        throw Error('Found text/html, just make a URL card.')
        // XXX: this is bad
      }
      return response.blob()
    })
    .then((blob) => {
      if (!blob) {
        return
      }
      // XXX: come back and look at this
      const file = new File([blob], url, { type: blob.type, lastModified: Date.now() })
      ContentTypes.createFromFile(file, (contentUrl) => callback(contentUrl, 0))
    })
    .catch((error) => {
      // this is fine, really -- the URL upgrade to content is optional.
      // it'd be nice to do something more sophisticated, perhaps
      ContentTypes.create('url', { url: url.toString() }, (contentUrl) => callback(contentUrl, 0))
    })
}
