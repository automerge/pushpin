import assert from 'assert'

import ContentTypes from '../src/renderer/content-types'

class UrlContent {}

describe('ContentTypes', () => {
  describe('should be able to register a type', () => {
    ContentTypes.register({
      type: 'url',
      contexts: { workspace: UrlContent, board: UrlContent },
      name: 'URL',
      icon: 'chain'
    })

    it('should find the registered type', () => {
      const type = ContentTypes.lookup({ type: 'url', context: 'workspace' })
      assert.equal(type.component, UrlContent)
    })
    it('should not find the registered type for other contexts', () => {
      const type = ContentTypes.lookup({ type: 'url', context: 'list' })
      assert.strictEqual(type, null)
    })

    it('should default to a sensible default for a context', () => {
      class DefaultListContent {}
      ContentTypes.registerDefault({
        component: DefaultListContent,
        context: 'list'
      })
      const type = ContentTypes.lookup({ type: 'url', context: 'list' })
      console.log('should default', type)
      assert.strictEqual(type.component, DefaultListContent)
    })

    it('should preserve the type-name and icon when returning a default renderer', () => {
      const type = ContentTypes.lookup({ type: 'url', context: 'list' })
      assert.strictEqual(type.name, 'URL')
      assert.strictEqual(type.icon, 'chain')
    })

    it('should use a specific option if available for a context', () => {
      class ImageInListContent {}
      ContentTypes.register({
        type: 'image',
        contexts: { list: ImageInListContent },
        name: 'Image',
        icon: 'chain'
      })
      const type = ContentTypes.lookup({ type: 'image', context: 'list' })
      assert.strictEqual(type.component, ImageInListContent)
    })
  })
})
