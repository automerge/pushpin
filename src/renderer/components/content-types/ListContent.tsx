import React, { useCallback, useImperativeHandle, useEffect } from 'react'
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'
import uuid from 'uuid'

import * as ContentTypes from '../../ContentTypes'
import Content, { ContentProps } from '../Content'
import { HypermergeUrl, PushpinUrl } from '../../ShareLink'
import { useDocument } from '../../Hooks'
import * as ImportData from '../../ImportData'

import './ListContent.css'

export type CardId = string & { cardId: true }

export interface ListDocCard {
  id: CardId
  url: PushpinUrl
}

export interface ListDoc {
  title: string
  backgroundColor: string
  cards: ListDocCard[]
  hypermergeUrl: HypermergeUrl // added by workspace
  authorIds: HypermergeUrl[]
}

ListContent.minWidth = 9
ListContent.minHeight = 6
ListContent.defaultWidth = 16
ListContent.defaultHeight = 18
ListContent.maxWidth = 24
ListContent.maxHeight = 36

/* demo helpers */

const grid = 10

const getItemStyle = (draggableStyle, isDragging) => ({
  // some basic styles to make the items look a bit nicer
  userSelect: 'none',
  padding: grid * 2,
  margin: `0 0 ${grid}px 0`,

  // change background colour if dragging
  background: isDragging && 'lightgreen',

  // styles we need to apply on draggables
  ...draggableStyle,
})

const getListStyle = (isDraggingOver) => ({
  background: isDraggingOver ? 'lightblue' : 'white',
  padding: grid,
  position: 'relative',
  width: '100%',
  overflowY: 'auto',
})

/* demo helpers end */

export default function ListContent(props: ContentProps) {
  useImperativeHandle(props.contentRef, () => ({
    onContent: (url: PushpinUrl) => onContent(url),
  }))
  const [doc, changeDoc] = useDocument<ListDoc>(props.hypermergeUrl)

  const onContent = useCallback(
    (url: PushpinUrl) => {
      changeDoc((doc) => {
        const id = uuid() as CardId
        doc.cards.unshift({ id, url })
      })
      return true
    },
    [doc]
  )

  const onPaste = useCallback(
    (e: ClipboardEvent) => {
      console.log('onPaste', e)
      e.preventDefault()
      e.stopPropagation()

      if (!e.clipboardData) {
        return
      }

      ImportData.importDataTransfer(e.clipboardData, (url, importCount) => {
        console.log('imported', url)
        changeDoc((doc) => {
          const id = uuid() as CardId
          doc.cards.unshift({ id, url })
        })
      })
    },
    [doc]
  )

  useEffect(() => {
    document.addEventListener('paste', onPaste)
    return () => {
      document.removeEventListener('paste', onPaste)
    }
  }, [onPaste])

  const onDragEnd = useCallback(
    (result) => {
      // dropped outside the list
      if (!result.destination) {
        return
      }
      changeDoc((doc) => {
        const from = result.source.index
        const to = result.destination.index
        const [removed] = doc.cards.splice(from, 1)
        doc.cards.splice(to, 0, removed)
      })
    },
    [doc]
  )

  if (!doc) {
    return null
  }

  // TODO: droppableId must be unique, but if you have two instances of the
  //    same list on a board this will probably fail in creative ways
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId={`droppable-${props.hypermergeUrl}`}>
        {(provided, snapshot) => (
          <div
            className="BoardCard--standard"
            ref={provided.innerRef}
            style={getListStyle(snapshot.isDraggingOver)}
            {...provided.droppableProps}
          >
            {doc.cards.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided, snapshot) => (
                  <div>
                    <div
                      ref={provided.innerRef}
                      {...provided.dragHandleProps}
                      {...provided.draggableProps}
                      style={getItemStyle(provided.draggableProps.style, snapshot.isDragging)}
                    >
                      <Content context="board" url={item.url} />
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}

function create(unusedAttrs, handle) {
  handle.change((doc) => {
    doc.cards = []
  })
}

ContentTypes.register({
  type: 'list',
  name: 'List',
  icon: 'list',
  contexts: {
    workspace: ListContent,
    board: ListContent,
  },
  create,
})
