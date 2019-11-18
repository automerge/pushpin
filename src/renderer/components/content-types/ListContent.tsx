import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'

import React, { useState, useCallback } from 'react'

import * as ContentTypes from '../../ContentTypes'
import Content, { ContentProps } from '../Content'
import { createDocumentLink, HypermergeUrl, PushpinUrl } from '../../ShareLink'
import { useDocument } from '../../Hooks'
import './ListContent.css'
import { string } from 'prop-types'

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

// fake data generator
const getItems = (count): ListItem[] =>
  Array.from({ length: count }, (v, k) => k).map((k) => ({
    id: `item-${k}`,
    content: `item ${k}`,
  }))

interface ListItem {
  id: string
  content: string
}

// a little function to help us with reordering the result
const reorder = (list: ListItem[], startIndex, endIndex): ListItem[] => {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)

  return result
}

const grid = 8

const getItemStyle = (draggableStyle, isDragging) => ({
  // some basic styles to make the items look a bit nicer
  userSelect: 'none',
  padding: grid * 2,
  margin: `0 0 ${grid}px 0`,

  // change background colour if dragging
  background: isDragging ? 'lightgreen' : 'grey',

  // styles we need to apply on draggables
  ...draggableStyle,
})

const getListStyle = (isDraggingOver) => ({
  background: isDraggingOver ? 'lightblue' : 'lightgrey',
  padding: grid,
  width: 250,
})

/* demo helpers end */

export default function ListContent(props: ContentProps) {
  const [items, setItems] = useState<ListItem[]>(getItems(10))
  const [doc, changeDoc] = useDocument<ListDoc>(props.hypermergeUrl)

  const onDragEnd = useCallback(
    (result) => {
      // dropped outside the list
      if (!result.destination) {
        return
      }

      setItems(reorder(items, result.source.index, result.destination.index))
    },
    [items]
  )

  if (!doc) {
    return null
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            style={getListStyle(snapshot.isDraggingOver)}
            {...provided.droppableProps}
          >
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided, snapshot) => (
                  <div>
                    <div
                      ref={provided.innerRef}
                      {...provided.dragHandleProps}
                      {...provided.draggableProps}
                      style={getItemStyle(provided.draggableProps.style, snapshot.isDragging)}
                    >
                      {item.content}
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
    doc.cards = {}
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
