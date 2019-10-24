interface InboundHtmlMessage {
  contentType: 'HTML'
  src: string
  content: string
}

interface InboundTextMessage {
  contentType: 'Text'
  content: string
}

interface InboundImageMessage {
  contentType: 'Image'
  content: string
}

export type InboundMessage = InboundHtmlMessage | InboundTextMessage | InboundImageMessage

interface AckMessage {
  type: 'Ack'
}
export type OutboundMessage = AckMessage
