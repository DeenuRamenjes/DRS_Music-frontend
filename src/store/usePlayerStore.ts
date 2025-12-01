import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { Song } from '@/types';

const buildShuffleQueue = (songs: Song[], excludeSongId?: string) => {
  const pool = songs.filter((song) => song._id !== excludeSongId);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
};

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  queue: Song[];
  currentIndex: number;
  isShuffle: boolean;
  isLooping: boolean;
  shuffleQueue: Song[];
  audioQuality: 'low' | 'normal' | 'high';
  crossfade: boolean;
  playSong: (song: Song) => void;
  pauseSong: () => void;
  playAlbum: (songs: Song[], startIndex?: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  setQueue: (songs: Song[]) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  clearQueue: () => void;
  toggleShuffle: () => void;
  toggleLoop: () => void;
  setAudioQuality: (quality: 'low' | 'normal' | 'high') => void;
  getAudioUrl: (song: Song) => string;
  toggleCrossfade: () => void;
}

const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      currentSong: null,
      isPlaying: false,
      volume: 1,
      isMuted: false,
      currentTime: 0,
      duration: 0,
      queue: [],
      currentIndex: -1,
      isShuffle: false,
      isLooping: true,
      shuffleQueue: [],
      audioQuality: 'high',
      crossfade: false,

      playSong: (song) =>
        set((state) => {
          // If the same song is already playing, just toggle play/pause
          if (state.currentSong?._id === song._id) {
            return { isPlaying: !state.isPlaying };
          }

          // Find the song in the queue
          const songIndex = state.queue.findIndex((s) => s._id === song._id);

          // If the song is not in the queue, something is wrong with our queue state
          // This shouldn't happen since we set the queue when songs are loaded
          if (songIndex === -1) {
            console.error('Song not found in queue:', song);
            return state;
          }

          const updates: Partial<PlayerState> = {
            currentSong: song,
            isPlaying: true,
            currentTime: 0,
            currentIndex: songIndex,
          };

          if (state.isShuffle) {
            let remainingShuffleQueue = state.shuffleQueue.filter((queuedSong) => queuedSong._id !== song._id);
            if (remainingShuffleQueue.length === state.shuffleQueue.length) {
              remainingShuffleQueue = buildShuffleQueue(state.queue, song._id);
            }
            updates.shuffleQueue = remainingShuffleQueue;
          }

          return updates;
        }),

      pauseSong: () => set({ isPlaying: false }),

      playAlbum: (songs, startIndex = 0) =>
        set((state) => {
          if (!songs.length) {
            return {};
          }

          const boundedIndex = Math.min(Math.max(startIndex, 0), songs.length - 1);
          const songToPlay = songs[boundedIndex];

          const newQueue = [...songs];

          return {
            queue: newQueue,
            currentSong: songToPlay,
            currentIndex: boundedIndex,
            isPlaying: true,
            currentTime: 0,
            shuffleQueue: state.isShuffle ? buildShuffleQueue(newQueue, songToPlay._id) : [],
          };
        }),

      setVolume: (volume) =>
        set(() => ({
          volume,
          isMuted: volume <= 0,
        })),

      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

      setCurrentTime: (time) => set({ currentTime: time }),

      setDuration: (duration) => set({ duration }),

      setQueue: (songs) =>
        set((state) => {
          // Keep track of the current song if it exists
          const currentSongId = state.currentSong?._id;

          // Update the queue with all songs
          const newQueue = [...songs];

          // Find the current song's position in the new queue
          const newIndex = currentSongId
            ? newQueue.findIndex((song) => song._id === currentSongId)
            : -1;

          if (newQueue.length === 0) {
            return {
              queue: [],
              currentIndex: -1,
              currentSong: null,
              isPlaying: false,
              shuffleQueue: [],
            };
          }

          if (state.currentSong) {
            if (newIndex !== -1) {
              return {
                queue: newQueue,
                currentIndex: newIndex,
                currentSong: state.currentSong,
                isPlaying: state.isPlaying,
                shuffleQueue: state.isShuffle ? buildShuffleQueue(newQueue, state.currentSong?._id) : state.shuffleQueue,
              };
            }

            return {
              queue: newQueue,
              currentIndex: 0,
              currentSong: newQueue[0],
              isPlaying: false,
              shuffleQueue: state.isShuffle ? buildShuffleQueue(newQueue, newQueue[0]._id) : state.shuffleQueue,
            };
          }

          const randomIndex = Math.floor(Math.random() * newQueue.length);
          const randomSong = newQueue[randomIndex];

          return {
            queue: newQueue,
            currentIndex: randomIndex,
            currentSong: randomSong,
            isPlaying: false,
            shuffleQueue: state.isShuffle ? buildShuffleQueue(newQueue, randomSong._id) : state.shuffleQueue,
          };
        }),

      addToQueue: (song) =>
        set((state) => {
          // Don't add if already in queue
          if (state.queue.some((s) => s._id === song._id)) {
            return state;
          }
          const updatedQueue = [...state.queue, song];
          return {
            queue: updatedQueue,
            shuffleQueue: state.isShuffle ? buildShuffleQueue(updatedQueue, state.currentSong?._id) : state.shuffleQueue,
          };
        }),

      removeFromQueue: (songId) =>
        set((state) => {
          const newQueue = state.queue.filter((song) => song._id !== songId);
          const wasCurrentSong = state.currentSong?._id === songId;
          const newIndex = wasCurrentSong ? -1 : state.currentIndex;
          const excludeId = wasCurrentSong ? undefined : state.currentSong?._id;

          return {
            queue: newQueue,
            currentIndex: newIndex,
            currentSong: wasCurrentSong ? null : state.currentSong,
            isPlaying: wasCurrentSong ? false : state.isPlaying,
            shuffleQueue: state.isShuffle
              ? buildShuffleQueue(newQueue, excludeId)
              : state.shuffleQueue.filter((song) => song._id !== songId),
          };
        }),

      clearQueue: () =>
        set({
          queue: [],
          currentIndex: -1,
          currentSong: null,
          isPlaying: false,
          currentTime: 0,
          shuffleQueue: [],
        }),

      playNext: () =>
        set((state) => {
          if (!state.queue.length) {
            return state;
          }

          // Repeat current song only if there's nothing queued yet
          if (state.currentIndex === -1) {
            const nextSong = state.queue[0];
            return {
              currentSong: nextSong,
              currentIndex: 0,
              isPlaying: true,
              currentTime: 0,
              shuffleQueue: state.isShuffle ? buildShuffleQueue(state.queue, nextSong._id) : state.shuffleQueue,
            };
          }

          if (state.isShuffle) {
            let [nextSong, ...remainingQueue] = state.shuffleQueue;

            if (!nextSong) {
              if (!state.isLooping) {
                return {
                  isPlaying: false,
                  currentTime: 0,
                };
              }
              const rebuilt = buildShuffleQueue(state.queue, state.currentSong?._id);
              [nextSong, ...remainingQueue] = rebuilt;
            }

            if (!nextSong) {
              return {
                isPlaying: false,
                currentTime: 0,
              };
            }

            const updatedIndex = state.queue.findIndex((song) => song._id === nextSong._id);

            return {
              currentSong: nextSong,
              isPlaying: true,
              currentTime: 0,
              currentIndex: updatedIndex === -1 ? state.currentIndex : updatedIndex,
              shuffleQueue: remainingQueue,
            };
          }

          const isLastIndex = state.currentIndex === state.queue.length - 1;
          if (isLastIndex && !state.isLooping) {
            return {
              isPlaying: false,
              currentTime: 0,
            };
          }

          const nextIndex = isLastIndex ? 0 : state.currentIndex + 1;
          const nextSong = state.queue[nextIndex];

          if (!nextSong) {
            return state;
          }

          return {
            currentSong: nextSong,
            isPlaying: true,
            currentTime: 0,
            currentIndex: nextIndex,
            shuffleQueue: state.isShuffle ? buildShuffleQueue(state.queue, nextSong._id) : state.shuffleQueue,
          };
        }),

      playPrevious: () =>
        set((state) => {
          if (!state.queue.length || state.currentIndex === -1) {
            return state;
          }

          if (state.isShuffle) {
            let [nextSong, ...remainingQueue] = state.shuffleQueue.reverse();

            if (!nextSong) {
              if (!state.isLooping) {
                return {
                  isPlaying: false,
                  currentTime: 0,
                };
              }
              const rebuilt = buildShuffleQueue(state.queue, state.currentSong?._id);
              [nextSong, ...remainingQueue] = rebuilt.reverse();
            }

            if (!nextSong) {
              return {
                isPlaying: false,
                currentTime: 0,
              };
            }

            const updatedIndex = state.queue.findIndex((song) => song._id === nextSong._id);

            return {
              currentSong: nextSong,
              isPlaying: true,
              currentTime: 0,
              currentIndex: updatedIndex === -1 ? state.currentIndex : updatedIndex,
              shuffleQueue: remainingQueue.reverse(),
            };
          }

          const isFirstIndex = state.currentIndex === 0;
          if (isFirstIndex && !state.isLooping) {
            return {
              isPlaying: false,
              currentTime: 0,
            };
          }

          const prevIndex = isFirstIndex ? state.queue.length - 1 : state.currentIndex - 1;
          const prevSong = state.queue[prevIndex];

          if (!prevSong) {
            return state;
          }

          return {
            currentSong: prevSong,
            isPlaying: true,
            currentTime: 0,
            currentIndex: prevIndex,
            shuffleQueue: state.isShuffle ? buildShuffleQueue(state.queue, prevSong._id) : state.shuffleQueue,
          };
        }),

      toggleShuffle: () =>
        set((state) => {
          const nextShuffleState = !state.isShuffle;
          return {
            isShuffle: nextShuffleState,
            shuffleQueue: nextShuffleState ? buildShuffleQueue(state.queue, state.currentSong?._id) : [],
          };
        }),

      toggleLoop: () =>
        set((state) => ({
          isLooping: !state.isLooping,
        })),

      setAudioQuality: (quality: 'low' | 'normal' | 'high') =>
        set(() => ({
          audioQuality: quality,
        })),

      getAudioUrl: (song: Song) => {
        const state = usePlayerStore.getState();
        
        // Return different quality URLs based on the setting
        if (typeof song.audioUrl === 'object' && song.audioUrl !== null) {
          switch (state.audioQuality) {
            case 'low':
              return song.audioUrl.low || song.audioUrl.normal || song.audioUrl.high || '';
            case 'normal':
              return song.audioUrl.normal || song.audioUrl.high || song.audioUrl.low || '';
            case 'high':
            default:
              return song.audioUrl.high || song.audioUrl.normal || song.audioUrl.low || '';
          }
        } else {
          // Fallback to string audioUrl
          return song.audioUrl as string;
        }
      },

      toggleCrossfade: () =>
        set((state) => ({
          crossfade: !state.crossfade,
        })),
    }),
    {
      name: 'player:lastPlayedSong',
      partialize: (state) => ({
        currentSong: state.currentSong,
        currentTime: state.currentTime,
        currentIndex: state.currentIndex,
        queue: state.queue,
      }),
    }
  )
);

export default usePlayerStore;