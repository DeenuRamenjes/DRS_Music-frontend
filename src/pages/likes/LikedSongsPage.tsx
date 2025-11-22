import { useEffect } from "react";
import Topbar from "@/components/Topbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMusicStore } from "@/stores/useMusicStore";
import usePlayerStore from "@/store/usePlayerStore";
import { Song } from "@/types";
import { Play, Pause, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LikedSongsPage = () => {
  const {
    likedSongs,
    likedSongsLoading,
    likedSongsInitialized,
    fetchLikedSongs,
  } = useMusicStore();

  const { currentSong, isPlaying, playSong, pauseSong, setQueue } = usePlayerStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!likedSongsInitialized) {
      fetchLikedSongs();
    }
  }, [likedSongsInitialized, fetchLikedSongs]);

  useEffect(() => {
    if (likedSongsInitialized && likedSongs.length) {
      setQueue(likedSongs);
    }
  }, [likedSongsInitialized, likedSongs, setQueue]);

  const handlePlayPause = (song: Song) => {
    if (currentSong?._id === song._id) {
      if (isPlaying) {
        pauseSong();
      } else {
        playSong(song);
      }
    } else {
      playSong(song);
    }
  };

  const handleCardClick = (song: Song) => {
    handlePlayPause(song);
    navigate(`/songs/${song._id}`);
  };

  const isLoading = likedSongsLoading && !likedSongsInitialized;

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col">
        <Topbar />
        <div className="flex-1 flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white" />
            <p className="text-sm text-white/70">Loading liked songs…</p>
          </div>
        </div>
      </div>
    );
  }

  const hasSongs = likedSongs.length > 0;

  return (
    <div className="flex flex-col h-100">
      <Topbar />
      <ScrollArea className="flex-1 h-[calc(82vh-80px)]">
        <div className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mt-1 mb-2">Liked Songs</h1>
              <p className="text-white/60 text-sm">{hasSongs ? `${likedSongs.length} track${likedSongs.length > 1 ? "s" : ""}` : "No liked songs yet"}</p>
            </div>
          </div>

          {!hasSongs ? (
            <div className="flex flex-col items-center justify-center text-center text-white/70 py-16">
              <Heart className="w-12 h-12 text-rose-400 mb-4" />
              <p className="text-lg font-semibold mb-2">You haven't liked any songs yet</p>
              <p className="text-sm text-white/60 max-w-sm">
                Tap the heart icon on a track to save it here for quick access.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {likedSongs.map((song) => (
                <div
                  key={song._id}
                  className="bg-zinc-800/50 rounded-lg p-3 md:p-4 hover:bg-zinc-700/50 transition-colors cursor-pointer group"
                  onClick={() => handleCardClick(song)}
                >
                  <div className="relative">
                    <img
                      src={song.imageUrl}
                      alt={song.title}
                      className="w-full aspect-square object-cover rounded-lg mb-2 md:mb-3"
                    />
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1 bg-black/40 text-rose-400 text-xs font-semibold px-2 py-1 rounded-full">
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      Liked
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg">
                      {currentSong?._id === song._id && isPlaying ? (
                        <Pause className="w-8 h-8 md:w-10 md:h-10 text-white" />
                      ) : (
                        <Play className="w-8 h-8 md:w-10 md:h-10 text-white" />
                      )}
                    </div>
                  </div>
                  <h3 className="font-semibold text-white truncate text-sm md:text-base">{song.title}</h3>
                  <p className="text-zinc-400 text-xs md:text-sm truncate">{song.artist}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default LikedSongsPage;
