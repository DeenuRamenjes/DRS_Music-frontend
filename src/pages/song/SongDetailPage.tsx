import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, Pause, Clock, CalendarDays, Music2, Shuffle, Repeat, SkipBack, SkipForward, ListMusic, ChevronUp, ChevronDown, Heart, Volume2, VolumeX, MoreVertical, Share, Download } from "lucide-react";
import usePlayerStore from "@/store/usePlayerStore";
import useDownloadStore from "@/store/useDownloadStore";
import { cn } from "@/lib/utils";
import { useMusicStore } from "@/stores/useMusicStore";
import { Song } from "@/types";
import { axiosInstance } from "@/lib/axios";

const formatDurationDisplay = (duration?: number | string) => {
  if (typeof duration === "number") {
    if (duration <= 0) return "0:00";
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  if (typeof duration === "string") {
    const numeric = Number(duration);
    if (!Number.isNaN(numeric)) {
      return formatDurationDisplay(numeric);
    }
    return duration;
  }

  return "0:00";
};

const clampValue = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const SongDetailPage = () => {
  const { songId } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [queueButtonPosition, setQueueButtonPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== "undefined") {
      const padding = 16;
      const fallbackWidth = 140;
      const fallbackHeight = 48;
      return {
        x: window.innerWidth - fallbackWidth - padding,
        y: window.innerHeight - fallbackHeight - padding,
      };
    }
    return { x: 0, y: 0 };
  });
  const [isDraggingQueueButton, setIsDraggingQueueButton] = useState(false);
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    currentIndex,
    isShuffle,
    isLooping,
    volume,
    isMuted,
    playSong,
    pauseSong,
    setCurrentTime,
    playNext,
    playPrevious,
    queue,
    shuffleQueue,
    toggleShuffle,
    toggleLoop,
    setVolume,
    toggleMute,
  } = usePlayerStore();

  const { getDownloadUrl } = useDownloadStore();

  const {
    fetchLikedSongs,
    likedSongs,
    likedSongsInitialized,
    likeSong: likeSongAction,
    unlikeSong: unlikeSongAction,
  } = useMusicStore();

  const volumeRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const queueButtonRef = useRef<HTMLButtonElement | null>(null);
  const queueButtonDragOffsetRef = useRef({ x: 0, y: 0 });
  const queueButtonDragStartRef = useRef({ x: 0, y: 0 });
  const queueButtonDidDragRef = useRef(false);
  const initializedQueueButtonPositionRef = useRef(false);

  const likedSongIds = useMemo(() => new Set(likedSongs.map((likedSong) => likedSong._id)), [likedSongs]);

  const queuedSongMatch = useMemo(() => {
    if (!songId) return null;
    return queue.find((queuedSong) => queuedSong._id === songId) ?? null;
  }, [queue, songId]);

  const upcomingQueue = useMemo(() => {
    if (!queue.length) return [];

    if (isShuffle) {
      if (shuffleQueue.length) {
        return shuffleQueue;
      }

      if (isLooping) {
        return queue.filter((queuedSong) => queuedSong._id !== currentSong?._id);
      }

      return [];
    }

    if (currentIndex === -1) return queue;

    const afterCurrent = queue.slice(currentIndex + 1);
    const beforeCurrent = queue.slice(0, currentIndex);
    return [...afterCurrent, ...beforeCurrent];
  }, [queue, currentIndex, isShuffle, isLooping, shuffleQueue, currentSong?._id]);

  useEffect(() => {
    if (!currentSong) return;
    if (currentSong._id !== songId) {
      navigate(`/songs/${currentSong._id}`, { replace: true });
    }
  }, [currentSong?._id, songId, navigate]);

  useEffect(() => {
    if (!songId) return;

    // Prefer currently playing song or queued data before fetching
    if (currentSong && currentSong._id === songId) {
      setSong(currentSong);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (queuedSongMatch) {
      setSong(queuedSongMatch);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchSong = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { data } = await axiosInstance.get(`/songs/${songId}`);
        setSong(data);
      } catch (err: any) {
        console.error("Error fetching song", err);
        const message = err.response?.data?.message ?? "Failed to load song";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSong();
  }, [songId, currentSong, queuedSongMatch]);

  useEffect(() => {
    if (!likedSongsInitialized) {
      fetchLikedSongs();
    }
  }, [likedSongsInitialized, fetchLikedSongs]);

  useEffect(() => {
    setSong((prev: Song | null) => {
      if (!prev) return prev;
      const liked = likedSongIds.has(prev._id);
      if (prev.isLiked === liked) return prev;
      return { ...prev, isLiked: liked };
    });
  }, [likedSongIds]);

  const isSongLiked = song ? (song.isLiked ?? likedSongIds.has(song._id)) : false;

  const handleTogglePlayback = () => {
    if (!song) return;
    if (currentSong?._id === song._id && isPlaying) {
      pauseSong();
    } else {
      playSong(song);
    }
  };

  const handleDownloadSong = async () => {
    if (!song) return;
    try {
      setIsDownloading(true);
      // Use the download quality setting to get the appropriate URL
      const downloadUrl = getDownloadUrl(song.audioUrl);
      const response = await fetch(downloadUrl, { mode: 'cors' });
      if (!response.ok) {
        throw new Error('Failed to download song');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extension = blob.type.includes('audio/') ? blob.type.split('/')[1] : 'mp3';
      
      // Add quality info to filename
      const qualitySuffix = downloadUrl !== song.audioUrl ? `_${getDownloadUrl(song.audioUrl).includes('low') ? 'low' : getDownloadUrl(song.audioUrl).includes('normal') ? 'normal' : 'high'}` : '';
      link.download = `${song.title ?? 'song'}${qualitySuffix}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download song', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!duration) return;
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    const audio = document.querySelector("audio");
    if (audio) {
      audio.currentTime = newTime;
    }
  };

  useEffect(() => {
    if (!isVolumeOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (volumeRef.current && !volumeRef.current.contains(event.target as Node)) {
        setIsVolumeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVolumeOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const padding = 16;

    const updatePositionWithinBounds = () => {
      const width = queueButtonRef.current?.offsetWidth ?? 140;
      const height = queueButtonRef.current?.offsetHeight ?? 48;
      setQueueButtonPosition((prev) => {
        if (!initializedQueueButtonPositionRef.current) {
          initializedQueueButtonPositionRef.current = true;
          return {
            x: window.innerWidth - width - padding,
            y: window.innerHeight - height - padding,
          };
        }

        const maxX = Math.max(padding, window.innerWidth - width - padding);
        const maxY = Math.max(padding, window.innerHeight - height - padding);

        return {
          x: clampValue(prev.x, padding, maxX),
          y: clampValue(prev.y, padding, maxY),
        };
      });
    };

    updatePositionWithinBounds();
    window.addEventListener("resize", updatePositionWithinBounds);
    return () => window.removeEventListener("resize", updatePositionWithinBounds);
  }, []);

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
  };

  const handleQueueButtonPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    queueButtonDidDragRef.current = false;
    queueButtonDragStartRef.current = { x: event.clientX, y: event.clientY };
    queueButtonDragOffsetRef.current = {
      x: event.clientX - queueButtonPosition.x,
      y: event.clientY - queueButtonPosition.y,
    };
    setIsDraggingQueueButton(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleQueueButtonPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDraggingQueueButton) return;
    const deltaX = Math.abs(event.clientX - queueButtonDragStartRef.current.x);
    const deltaY = Math.abs(event.clientY - queueButtonDragStartRef.current.y);
    if (deltaX > 3 || deltaY > 3) {
      queueButtonDidDragRef.current = true;
    }

    if (typeof window === "undefined") return;

    const padding = 12;
    const width = queueButtonRef.current?.offsetWidth ?? 0;
    const height = queueButtonRef.current?.offsetHeight ?? 0;
    const maxX = Math.max(padding, window.innerWidth - width - padding);
    const maxY = Math.max(padding, window.innerHeight - height - padding);

    setQueueButtonPosition({
      x: clampValue(event.clientX - queueButtonDragOffsetRef.current.x, padding, maxX),
      y: clampValue(event.clientY - queueButtonDragOffsetRef.current.y, padding, maxY),
    });
  };

  const stopQueueButtonDrag = (event?: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDraggingQueueButton) return;
    setIsDraggingQueueButton(false);
    if (event) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore errors if pointer capture is not active
      }
    }
  };

  const handleQueueButtonPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    stopQueueButtonDrag(event);
  };

  const handleQueueButtonPointerCancel = (event: React.PointerEvent<HTMLButtonElement>) => {
    stopQueueButtonDrag(event);
  };

  const handleQueueToggleButtonClick = () => {
    if (queueButtonDidDragRef.current) {
      queueButtonDidDragRef.current = false;
      return;
    }
    setIsQueueOpen((prev) => !prev);
  };

  const handleShare = async () => {
    try {
      if (navigator?.share) {
        await navigator.share({
          title: song?.title ?? 'Listen to this song',
          text: song ? `Listen to ${song.title}` : undefined,
          url: window.location.href,
        });
      } else {
        await navigator?.clipboard?.writeText(window.location.href);
      }
    } catch (error) {
      console.warn('Share action cancelled or failed', error);
    } finally {
      setIsMenuOpen(false);
    }
  };

  const handleToggleLike = async () => {
    if (!song) return;
    const targetLiked = !isSongLiked;
    try {
      if (targetLiked) {
        await likeSongAction(song._id);
      } else {
        await unlikeSongAction(song._id);
      }
      setSong((prev: Song | null) => (prev ? { ...prev, isLiked: targetLiked } : prev));
    } catch (error) {
      console.error('Error toggling like', error);
    }
  };

  if (!songId) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 text-white">
        <p className="text-lg">No song selected</p>
        <button
          className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition"
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-white gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500" />
        <p className="text-sm text-gray-300">Loading song…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 text-white">
        <p className="text-red-400">{error}</p>
        <button
          className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition"
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-white">
        <p>Song unavailable.</p>
      </div>
    );
  }

  const isCurrentSong = currentSong?._id === song._id;
  const heroGradient = {
    backgroundImage: `linear-gradient(135deg, rgba(13,148,136,0.35), rgba(59,7,100,0.55))`,
  };

  const formatTime = (time: number) => {
    if (!time && time !== 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handlePlayFromQueue = (queuedSong: Song) => {
    playSong(queuedSong);
    navigate(`/songs/${queuedSong._id}`, { replace: true });
  };

  const handleBackClick = () => {
    try {
      const storedPath = localStorage.getItem('app:lastNonSongPath');
      if (storedPath && !storedPath.startsWith('/songs/')) {
        navigate(storedPath, { replace: true });
        return;
      }
    } catch (error) {
      console.warn('Unable to read last non-song path', error);
    }

    navigate('/songs');
  };

  return (
    <div className="flex h-full w-full bg-gradient-to-b from-black via-zinc-950 to-black overflow-y-auto custom-scrollbar [scrollbar-width:none] [-ms-overflow-style:'none'] [&::-webkit-scrollbar]:hidden">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-6 text-white flex flex-col gap-6">
        <div className="flex items-center justify-between flex-shrink-0">
          <button
            onClick={handleBackClick}
            className="inline-flex items-center text-sm text-gray-300 hover:text-white transition"
          >
            <ArrowLeft className="mr-2" size={18} /> Back
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="inline-flex items-center justify-center text-gray-300 hover:text-white transition p-2 rounded-full border border-white/10"
              aria-label="Song actions"
              aria-expanded={isMenuOpen}
            >
              <MoreVertical size={18} />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-white/10 bg-black/80 backdrop-blur-lg shadow-xl p-2 z-10">
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/10"
                >
                  <Share size={16} /> Share song
                </button>
                <button
                  onClick={handleDownloadSong}
                  disabled={isDownloading}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/10"
                >
                  <Download size={16} /> {isDownloading ? 'Downloading…' : 'Download Song'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-6 ">
          <div className="rounded-3xl p-6 md:p-10 border border-white/5 bg-white/5 backdrop-blur-md flex flex-col items-center" style={heroGradient}>
            <div className="w-full max-w-md">
              <img
                src={song.imageUrl}
                alt={song.title}
                className="w-full aspect-square object-cover rounded-3xl shadow-2xl"
              />
            </div>

            <div className="w-full text-center space-y-4 mt-6">
              <div>
                <p className="uppercase tracking-[0.4em] text-xs text-gray-300">Now Playing</p>
                <h1 className="text-2xl md:text-3xl font-bold leading-tight mt-2 line-clamp-1">
                  {song.title}
                </h1>
                <p className="text-lg text-gray-300 line-clamp-1">{song.artist}</p>
              </div>

              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-300">
                <span className="inline-flex items-center gap-1">
                  <Music2 size={16} />
                  {song.albumIds && song.albumIds.length ? "Album track" : "Single"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={16} className="mt-0.5"/>
                  {formatDurationDisplay(song.duration)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays size={16} className="mt-0.5"/>
                  {new Date(song.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="w-full mt-6 space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                step={0.5}
                onChange={handleProgressChange}
                className="w-full accent-emerald-400"
              />
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-6 mt-6 flex-wrap">
              <button
                onClick={handleToggleLike}
                className={cn(
                  "text-gray-200 hover:text-white transition rounded-full p-1",
                  isSongLiked && "text-rose-400"
                )}
                aria-label={isSongLiked ? "Unlike" : "Like"}
                aria-pressed={isSongLiked}
                disabled={!likedSongsInitialized}
              >
                <Heart size={22} className={isSongLiked ? "fill-red-500 text-red-500" : "text-gray-200"} />
              </button> 
              <button
                onClick={toggleLoop}
                className={cn(
                  "text-white hover:text-white transition p-2 rounded-full",
                  isLooping && "text-white bg-emerald-700 p-2 rounded-full "
                )}
                aria-label="loop"
                aria-pressed={isLooping}
              >
                <Repeat size={20} />
              </button>
              <button className="text-gray-200 hover:text-white transition" onClick={playPrevious} aria-label="previous">
                <SkipBack size={26} />
              </button>
              <button
                onClick={handleTogglePlayback}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition"
                aria-label={isCurrentSong && isPlaying ? "pause" : "play"}
              >
                {isCurrentSong && isPlaying ? <Pause size={22} /> : <Play size={22} />}
              </button>
              <button className="text-gray-200 hover:text-white transition" onClick={playNext} aria-label="next">
                <SkipForward size={26} />
              </button>
              <button
                onClick={toggleShuffle}
                className={cn(
                  "text-white hover:text-white transition p-2 rounded-full",
                  isShuffle && "text-white bg-emerald-700 p-2 rounded-full"
                )}
                aria-label="shuffle"
                aria-pressed={isShuffle}
              >
                <Shuffle size={20} />
              </button>
              <div className="relative" ref={volumeRef}>
                <button
                  onClick={() => setIsVolumeOpen((prev) => !prev)}
                  className="text-white hover:text-white transition pt-1 rounded-full"
                  aria-label="volume"
                  aria-pressed={isVolumeOpen}
                >
                  {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
                </button>
                {isVolumeOpen && (
                  <div className="absolute bottom-8 -right-3 bg-black/70 p-2 w-[50px] rounded-xl">
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={toggleMute}
                        className="text-xs text-white/70 hover:text-white transition"
                        type="button"
                      >
                        {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
                      </button>
                      <div className="h-32 flex items-center">
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="accent-emerald-400 [writing-mode:bt-lr] -rotate-90 origin-center"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        ref={queueButtonRef}
        type="button"
        onClick={handleQueueToggleButtonClick}
        onPointerDown={handleQueueButtonPointerDown}
        onPointerMove={handleQueueButtonPointerMove}
        onPointerUp={handleQueueButtonPointerUp}
        onPointerCancel={handleQueueButtonPointerCancel}
        style={{ left: `${queueButtonPosition.x}px`, top: `${queueButtonPosition.y}px` }}
        aria-label="Queue toggle"
        aria-pressed={isQueueOpen}
        className={cn(
          "fixed z-30 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 text-black px-4 py-2 text-sm font-semibold shadow-lg hover:scale-105 transition select-none touch-none",
          // isDraggingQueueButton ? "cursor-grabbing" : "cursor-grab"
        )}
      >
        <ListMusic size={16} />
        {isQueueOpen ? "Hide Queue" : "Next Songs"}
        {isQueueOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {isQueueOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40"
          onClick={() => setIsQueueOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 transition-transform duration-300",
          isQueueOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl px-4 sm:px-6 pt-6 pb-8 max-h-[70vh] overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <ListMusic size={20} /> Next Songs
            </div>
            <button
              onClick={() => setIsQueueOpen(false)}
              className="text-sm text-gray-400 hover:text-white transition inline-flex items-center gap-1"
            >
              Close <ChevronDown size={16} />
            </button>
          </div>
          <div className="space-y-3 overflow-y-auto pr-1 max-h-[50vh] custom-scrollbar [scrollbar-width:none] [-ms-overflow-style:'none'] [&::-webkit-scrollbar]:hidden">
            {upcomingQueue.length > 0 ? (
              upcomingQueue.map((queuedSong, index) => (
                <button
                  type="button"
                  key={queuedSong._id}
                  onClick={() => handlePlayFromQueue(queuedSong)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2 w-full text-left transition",
                    "bg-white/5 hover:bg-white/10",
                  )}
                >
                  <div className="flex flex-col items-center w-6">
                    <span className="text-xs text-gray-400">{index + 1}</span>
                  </div>
                  <img src={queuedSong.imageUrl} alt={queuedSong.title} className="w-10 h-10 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{queuedSong.title}</p>
                    <p className="text-xs text-gray-400 truncate">{queuedSong.artist}</p>
                  </div>
                  <span className="text-xs text-gray-400">{formatDurationDisplay(queuedSong.duration)}</span>
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-400">Queue is empty.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongDetailPage;
