import { useRef, useEffect } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore'


const AudioPlayer = () => {

  const audioRef = useRef<HTMLAudioElement>(null)
  const prevSongRef = useRef<string | null>(null)

  const { currentSong, isPlaying ,playNext} = usePlayerStore()

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
    const audio=audioRef.current
    const handleEnded = () => {
      playNext()
    }
    audio?.addEventListener('ended', handleEnded)
    return () => {
      audio?.removeEventListener('ended', handleEnded)
    }
  },[playNext])

//Handle song change
  useEffect(() => {
    if (!currentSong || !currentSong) return
    
    
    const isSongChanged = prevSongRef.current !== currentSong?.audioUrl
    const audio = audioRef.current
    if (!audio) return

    if(isSongChanged) {
      audio.src = currentSong?.audioUrl
      audio.currentTime = 0
      prevSongRef.current = currentSong?.audioUrl

      if (isPlaying) {
        audio.play()
      }
    }
    
  }, [currentSong, isPlaying])
  


  return (
    <audio ref={audioRef} />
  )
}

export default AudioPlayer