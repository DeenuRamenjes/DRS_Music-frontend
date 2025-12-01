import { useRef, useEffect } from 'react';
import usePlayerStore from '@/store/usePlayerStore'

const AudioPlayer = () => {

  const audioRef = useRef<HTMLAudioElement>(null)
  const nextAudioRef = useRef<HTMLAudioElement>(null)
  const prevSongRef = useRef<string | null>(null)

  const { currentSong, isPlaying, playNext, getAudioUrl, crossfade } = usePlayerStore()

//Handle Play and Pause 
  useEffect(() => {
    if (isPlaying){
      audioRef.current?.play()
    }
    else {
      audioRef.current?.pause()
    }
  }, [isPlaying])

//Handle song ends
  useEffect(() => {
    const audio = audioRef.current
    const nextAudio = nextAudioRef.current
    
    const handleEnded = () => {
      if (crossfade) {
        // Crossfade logic will be handled in the time update effect
        return
      } else {
        playNext()
      }
    }
    
    const handleTimeUpdate = () => {
      if (!audio || !crossfade || !nextAudio) return
      
      const currentTime = audio.currentTime
      const duration = audio.duration
      const timeRemaining = duration - currentTime
      
      // Start crossfade when 3 seconds remaining
      if (timeRemaining <= 3 && timeRemaining > 0 && !nextAudio.src) {
        // Preload next song
        const { queue, currentIndex } = usePlayerStore.getState()
        const nextIndex = currentIndex + 1
        
        if (nextIndex < queue.length) {
          const nextSong = queue[nextIndex]
          const nextAudioUrl = getAudioUrl(nextSong)
          nextAudio.src = nextAudioUrl
          nextAudio.volume = 0
          nextAudio.play().catch(() => {
            // Handle autoplay restrictions
          })
        }
      }
      
      // Perform crossfade
      if (timeRemaining <= 2 && timeRemaining > 0 && nextAudio.src && !nextAudio.paused) {
        const fadeProgress = 1 - (timeRemaining / 2)
        audio.volume = 1 - fadeProgress
        nextAudio.volume = fadeProgress
      }
      
      // Complete transition
      if (timeRemaining <= 0.1 && nextAudio.src && !nextAudio.paused) {
        audio.volume = 0
        nextAudio.volume = 1
        playNext()
      }
    }
    
    audio?.addEventListener('ended', handleEnded)
    audio?.addEventListener('timeupdate', handleTimeUpdate)
    
    return () => {
      audio?.removeEventListener('ended', handleEnded)
      audio?.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [playNext, crossfade, getAudioUrl])

//Handle song change
  useEffect(() => {
    if (!currentSong) return
    
    const currentAudioUrl = getAudioUrl(currentSong)
    const isSongChanged = prevSongRef.current !== currentAudioUrl
    const audio = audioRef.current
    const nextAudio = nextAudioRef.current
    
    if (!audio) return

    if(isSongChanged) {
      // Reset crossfade elements
      if (nextAudio) {
        nextAudio.src = ''
        nextAudio.volume = 1
      }
      
      audio.src = currentAudioUrl
      audio.currentTime = 0
      audio.volume = 1
      prevSongRef.current = currentAudioUrl

      if (isPlaying) {
        audio.play()
      }
    }
    
  }, [currentSong, isPlaying, getAudioUrl])

  return (
    <>
      <audio ref={audioRef} />
      <audio ref={nextAudioRef} />
    </>
  )
}

export default AudioPlayer