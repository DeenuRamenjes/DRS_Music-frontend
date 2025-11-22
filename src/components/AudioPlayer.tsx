import { useEffect, useRef, useState } from 'react';
import usePlayerStore from '@/store/usePlayerStore';
import { useChatStore } from '@/stores/useChatStore';
import { useUser } from '@clerk/clerk-react';

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTimeRef = useRef(0);
  const prevSongIdRef = useRef<string | null>(null);

  const { user } = useUser();
  const { socket } = useChatStore();
  const { 
    currentSong, 
    isPlaying, 
    volume, 
    isMuted,
    currentTime,
    setCurrentTime,
    setDuration,
    playNext,
    playPrevious,
    playSong,
    pauseSong,
  } = usePlayerStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    const newSongId = currentSong?._id ?? null;
    const prevSongId = prevSongIdRef.current;

    if (newSongId && prevSongId && newSongId !== prevSongId) {
      currentTimeRef.current = 0;
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    }

    prevSongIdRef.current = newSongId;
  }, [currentSong?._id, setCurrentTime]);

  useEffect(() => {
    if (!audioRef.current || !currentSong) return;
    const audio = audioRef.current;
    audio.pause();
    audio.currentTime = 0;
    audio.load();
  }, [currentSong?._id]);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
      setDuration(audio.duration);
      if (isPlaying) {
        audio.play().catch(err => {
          console.error('Error playing audio:', err);
          setError('Failed to play audio');
        });
      }
    };

    const handleError = () => {
      setIsLoading(false);
      setError(`Error loading ${currentSong?.title ?? 'audio'}. Skipping...`);
      console.error('Audio error:', audio.error);
      playNext();
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      const targetTime = currentTimeRef.current;
      if (targetTime && Math.abs(audio.currentTime - targetTime) > 0.25) {
        audio.currentTime = targetTime;
      } else if (!targetTime && audio.currentTime !== 0) {
        audio.currentTime = 0;
      }
    };

    const handleEnded = () => {
      playNext();
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentSong, isPlaying, setCurrentTime, setDuration, playNext]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          setError('Failed to play audio');
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (!audioRef.current || !currentSong) return;
    if (Math.abs(audioRef.current.currentTime - currentTime) > 0.25) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentSong?._id, currentTime]);

  useEffect(() => {
    if (!currentSong) return;
    if (user && socket) {
      const activity = isPlaying 
        ? `Listening to ${currentSong.title} by ${currentSong.artist}`
        : '';
      socket.emit('update_activity', { userId: user.id, activity });
    }
  }, [currentSong, isPlaying, user, socket]);

  useEffect(() => {
    if (!currentSong || typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }

    const artwork = currentSong.imageUrl
      ? [
          {
            src: currentSong.imageUrl,
            type: 'image/png',
          },
        ]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      artwork,
    });

    navigator.mediaSession.setActionHandler('play', () => {
      playSong(currentSong);
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      pauseSong();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      playNext();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      playPrevious();
    });

    return () => {
      if (!('mediaSession' in navigator)) return;
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
    };
  }, [currentSong, playNext, playPrevious, playSong, pauseSong]);

  if (!currentSong) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={currentSong.audioUrl}
        preload="auto"
      />
      {isLoading && (
        <div></div>
        // <div className="fixed bottom-20 left-0 right-0 text-white p-2 text-center">
        //   Loading audio...
        // </div>
      )}
      {error && (
        <div className="fixed bottom-20 left-0 right-0 bg-red-900 text-white p-2 text-center">
          {error}
        </div>
      )}
    </>
  );
};

export default AudioPlayer; 