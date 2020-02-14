import React, { useRef, useState } from 'react'
import { FileDoc } from '.'

import { ContentProps } from '../../Content'
import * as ContentTypes from '../../../ContentTypes'
import { useDocument } from '../../../Hooks'
import './AudioContent.css'

interface AudioState {
  paused: boolean
  time: number
}
export default function AudioContent({ hypermergeUrl }: ContentProps) {
  const audioElement = useRef<HTMLAudioElement>(null)
  const progressElement = useRef<HTMLDivElement>(null)
  const progressBarElement = useRef<HTMLDivElement>(null)
  const [audioState, setAudioState] = useState<AudioState>({ paused: true, time: 0 })

  const [doc] = useDocument<FileDoc>(hypermergeUrl)
  if (!(doc && doc.hyperfileUrl)) {
    return null
  }

  function playAudio() {
    if (!audioElement.current) return
    setAudioState({ ...audioState, paused: false })
    audioElement.current.play()
  }
  function pauseAudio() {
    if (!audioElement.current) return
    setAudioState({ ...audioState, paused: true })
    audioElement.current.pause()
  }
  function scrubToTime(time: number) {
    if (!audioElement.current) return
    updateTime(time)
    audioElement.current.currentTime = time
  }
  function updateTime(time: number) {
    if (!audioElement.current || !progressBarElement.current) return
    progressBarElement.current.style.width = `${(time / audioElement.current.duration) * 100}%`
    setAudioState({ ...audioState, time })
  }
  function handlePlayPause() {
    if (audioState.paused) {
      playAudio()
    } else {
      pauseAudio()
    }
  }
  function handleEnd() {
    if (!audioElement.current) return
    setAudioState({ paused: true, time: 0 })
    audioElement.current.currentTime = 0
  }
  function handleAudioProgress() {
    if (audioElement.current) updateTime(audioElement.current.currentTime)
  }
  function handleScrubClick(e: React.MouseEvent) {
    if (audioElement.current && progressElement.current) {
      const position = e.nativeEvent.offsetX / progressElement.current.offsetWidth
      const time = position * audioElement.current.duration
      scrubToTime(time)
    }
  }

  return (
    <div className="audioWrapper">
      <audio
        src={doc.hyperfileUrl}
        ref={audioElement}
        onTimeUpdate={handleAudioProgress}
        onEnded={handleEnd}
      />
      <div className="audioControls">
        <i
          onClick={handlePlayPause}
          className={`playPause fa fa-${audioState.paused ? 'play' : 'pause'}`}
        />
        <div className="progressContainer" ref={progressElement} onClick={handleScrubClick}>
          <div className="progressBar" ref={progressBarElement} />
        </div>
      </div>
    </div>
  )
}

const supportsMimeType = (mimeType) => !!mimeType.match('audio/')

ContentTypes.register({
  type: 'audio',
  name: 'Audio',
  icon: 'file-audio-o',
  unlisted: true,
  contexts: {
    workspace: AudioContent,
    board: AudioContent,
  },
  supportsMimeType,
})
