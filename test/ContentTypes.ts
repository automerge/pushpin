import assert from 'assert'

import * as ContentTypes from '../src/renderer/ContentTypes'

class UrlContent {}

describe('ContentTypes', () => {
  describe('registers a type', () => {
    ContentTypes.register({
      type: 'url',
      contexts: { workspace: UrlContent as any, board: UrlContent as any },
      name: 'URL',
      icon: 'chain',
    })

    it('finds the registered type', () => {
      const type = ContentTypes.lookup({ type: 'url', context: 'workspace' })
      assert.equal(type && type.component, UrlContent)
    })

    it('lists types for a given context', () => {
      const types = ContentTypes.list({ context: 'board' })
      assert.deepEqual(
        types.map((t) => t.component),
        [UrlContent]
      )
    })

    it('lists no types for unregistered contexts', () => {
      const types = ContentTypes.list({ context: 'foo' as any })
      assert.deepEqual(types, [])
    })

    it('does not find the registered type for other contexts', () => {
      const type = ContentTypes.lookup({ type: 'url', context: 'list' })
      assert.strictEqual(type, null)
    })

    it('defaults to a sensible default for a context', () => {
      class DefaultListContent {}
      ContentTypes.registerDefault({
        component: DefaultListContent as any,
        context: 'list',
      })
      const type = ContentTypes.lookup({ type: 'url', context: 'list' })
      assert.strictEqual(type && type.component, DefaultListContent)
    })

    it('preserves the type-name and icon when returning a default renderer', () => {
      const type = ContentTypes.lookup({ type: 'url', context: 'list' })
      assert.strictEqual(type && type.name, 'URL')
      assert.strictEqual(type && type.icon, 'chain')
    })

    it('uses a specific option if available for a context', () => {
      class ImageInListContent {}
      ContentTypes.register({
        type: 'image',
        contexts: { list: ImageInListContent as any },
        name: 'Image',
        icon: 'chain',
      })
      const type = ContentTypes.lookup({ type: 'image', context: 'list' })
      assert.strictEqual(type && type.component, ImageInListContent)
    })
  })
})
