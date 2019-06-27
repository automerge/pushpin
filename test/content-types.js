import assert from 'assert'

import ContentTypes from '../src/renderer/content-types'

class UrlContent { }

describe('ContentTypes', () => {
  describe('registers a type', () => {
    ContentTypes.register({
      type: 'url',
      contexts: { workspace: UrlContent, board: UrlContent },
      name: 'URL',
      icon: 'chain'
    })

    it('finds the registered type', () => {
      const type = ContentTypes.lookup({ type: 'url', context: 'workspace' })
      assert.equal(type.component, UrlContent)
    })

    it('lists types for a given context', () => {
      const types = ContentTypes.list({ context: 'board' })
      assert.deepEqual(types.map(t => t.component), [UrlContent])
    })

    it('lists no types for unregistered contexts', () => {
      const types = ContentTypes.list({ context: 'foo' })
      assert.deepEqual(types, [])
    })

    it('does not find the registered type for other contexts', () => {
      const type = ContentTypes.lookup({ type: 'url', context: 'list' })
      assert.strictEqual(type, null)
    })

    it('defaults to a sensible default for a context', () => {
      class DefaultListContent { }
      ContentTypes.registerDefault({
        component: DefaultListContent,
        context: 'list'
      })
      const type = ContentTypes.lookup({ type: 'url', context: 'list' })
      assert.strictEqual(type.component, DefaultListContent)
    })

    it('preserves the type-name and icon when returning a default renderer', () => {
      const type = ContentTypes.lookup({ type: 'url', context: 'list' })
      assert.strictEqual(type.name, 'URL')
      assert.strictEqual(type.icon, 'chain')
    })

    it('uses a specific option if available for a context', () => {
      class ImageInListContent { }
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
