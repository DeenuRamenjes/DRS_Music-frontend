import { useEffect } from "react"
import { useMusicStore } from "@/stores/useMusicStore"
import { Play, Pause, Heart } from "lucide-react"
import usePlayerStore from "@/store/usePlayerStore"
import { Song } from "@/types/index"
import { ScrollArea } from "@/components/ui/scroll-area"
import Topbar from "@/components/Topbar"

const SongsPage = () => {
  const { songs, isLoading, fetchSongs } = useMusicStore()
  const { currentSong, isPlaying, playSong, pauseSong, setQueue } = usePlayerStore()

  useEffect(() => {
    fetchSongs()
  }, [fetchSongs])

  // Set the queue when songs are loaded
  useEffect(() => {
    if (songs.length > 0) {
      setQueue(songs)
    }
  }, [songs, setQueue])

  const handlePlayPause = (song: Song) => {
    if (currentSong?._id === song._id) {
      if (isPlaying) {
        pauseSong()
      } else {
        playSong(song)
      }
    } else {
      playSong(song)
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col">
        <Topbar />
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">All Songs</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-zinc-800/50 rounded-lg p-3 md:p-4 animate-pulse">
                  <div className="w-full aspect-square bg-zinc-700/50 rounded-lg mb-2 md:mb-3" />
                  <div className="h-4 bg-zinc-700/50 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-zinc-700/50 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="h-100 flex flex-col">
      <Topbar />
      <ScrollArea className="h-[calc(82vh-80px)]">
        <div className="p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">All Songs</h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {songs.map((song) => (
              <div
                key={song._id}
                className="bg-zinc-800/50 rounded-lg p-3 md:p-4 hover:bg-zinc-700/50 transition-colors cursor-pointer group"
                onClick={() => handlePlayPause(song)}
              >
                <div className="relative">
                  <img
                    src={song.imageUrl}
                    alt={song.title}
                    className="w-full aspect-square object-cover rounded-lg mb-2 md:mb-3"
                  />
                  {song.isLiked && (
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1 bg-black/40 text-rose-400 text-xs font-semibold px-2 py-1 rounded-full">
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      Liked
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg">
                    {currentSong?._id === song._id && isPlaying ? (
                      <Pause className="w-8 h-8 md:w-12 md:h-12 text-white" />
                    ) : (
                      <Play className="w-8 h-8 md:w-12 md:h-12 text-white" />
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-white truncate text-sm md:text-base">{song.title}</h3>
                <p className="text-zinc-400 text-xs md:text-sm truncate">{song.artist}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

export default SongsPage 