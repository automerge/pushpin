import assert from 'assert'

import ContentTypes from '../src/renderer/content-types'

class UrlContent {}

describe('ContentTypes', () => {
  describe('should be able to register a type', () => {
    ContentTypes.register({
      component: UrlContent,
      type: 'url',
      context: ['workspace', 'board'],
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
      ContentTypes.register({
        component: DefaultListContent,
        type: 'default',
        context: ['list'],
        name: 'URL',
        icon: 'chain'
      })
      const type = ContentTypes.lookup({ type: 'url', context: 'list' })
      assert.strictEqual(type.component, DefaultListContent)
    })

    it('should use a specific option if available for a context', () => {
      class ImageInListContent {}
      ContentTypes.register({
        component: ImageInListContent,
        type: 'image',
        context: ['list'],
        name: 'Image',
        icon: 'chain'
      })
      const type = ContentTypes.lookup({ type: 'image', context: 'list' })
      assert.strictEqual(type.component, ImageInListContent)
    })
  })
})
