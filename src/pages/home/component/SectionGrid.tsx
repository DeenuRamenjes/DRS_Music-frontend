import { useEffect, useState } from "react"

import { Song } from "@/types"
import { Play, Pause, Heart } from "lucide-react"
import usePlayerStore from "@/store/usePlayerStore"
import { Link, useNavigate } from "react-router-dom"

interface SectionGridProps {
    title: string;
    songs: Song[];
    isLoading: boolean;
    viewAllPath?: string;
}

const SectionGrid = ({ title, songs, isLoading, viewAllPath }: SectionGridProps) => {
    const { currentSong, isPlaying, playSong, pauseSong, playAlbum } = usePlayerStore();

    const navigate = useNavigate();
    const [isLaptop, setIsLaptop] = useState(false);

    useEffect(() => {

        const mediaQuery = window.matchMedia("(min-width: 1024px)");
        const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
            setIsLaptop(event.matches);
        };

        handleChange(mediaQuery);

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", handleChange);
        } else {
            mediaQuery.addListener(handleChange);
        }

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener("change", handleChange);
            } else {
                mediaQuery.removeListener(handleChange);
            }
        };
    }, []);

    const maxVisibleCards = isLaptop ? 5 : 4;
    const visibleSongs = songs.slice(0, maxVisibleCards);

    const playFromSection = (song: Song, index: number) => {
        if (currentSong?._id === song._id) {
            if (!isPlaying) {
                playSong(song);
            }
            return;
        }
        playAlbum(songs, index);
    };

    const handleCardClick = (song: Song, index: number) => {
        playFromSection(song, index);
        navigate(`/songs/${song._id}`);
    };

    const handlePlayPauseClick = (event: React.MouseEvent<HTMLButtonElement>, song: Song, index: number) => {
        event.stopPropagation();
        if (currentSong?._id === song._id && isPlaying) {
            pauseSong();
            return;
        }
        playFromSection(song, index);
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">{title}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[...Array(maxVisibleCards)].map((_, i) => (
                        <div key={i} className="bg-zinc-800/50 rounded-lg p-4 animate-pulse">
                            <div className="w-full aspect-square bg-zinc-700/50 rounded-lg mb-3" />
                            <div className="h-4 bg-zinc-700/50 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-zinc-700/50 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (visibleSongs.length === 0) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white flex-1">{title}</h2>
                    {viewAllPath && (
                        <Link 
                            to={viewAllPath} 
                            className="text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                            View All
                        </Link>
                    )}
                </div>
                <div className="text-zinc-400">No songs available</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white flex-1">{title}</h2>
                {viewAllPath && (
                    <Link 
                        to={viewAllPath} 
                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                        View All
                    </Link>
                )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {visibleSongs.map((song, index) => (
                    <div
                        key={song._id}
                        className="bg-zinc-800/50 rounded-lg p-4 hover:bg-zinc-700/50 transition-colors cursor-pointer group"
                        onClick={() => handleCardClick(song, index)}
                    >
                        <div className="relative">
                            <img
                                src={song.imageUrl}
                                alt={song.title}
                                className="w-full aspect-square object-cover rounded-lg mb-3"
                            />
                            {song.isLiked && (
                                <div className="absolute top-3 left-3 inline-flex items-center gap-1 bg-black/40 text-rose-400 text-[11px] font-semibold px-2 py-1 rounded-full">
                                    <Heart className="w-3.5 h-3.5 fill-current" />
                                    Liked
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={(event) => handlePlayPauseClick(event, song, index)}
                                className="absolute bottom-2 right-2 inline-flex items-center justify-center rounded-full bg-green-500 text-black p-2 shadow-lg opacity-100 transition group-hover:scale-105"
                                aria-label={currentSong?._id === song._id && isPlaying ? "Pause" : "Play"}
                            >
                                {currentSong?._id === song._id && isPlaying ? (
                                    <Pause className="w-5 h-5" />
                                ) : (
                                    <Play className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        <h3 className="font-semibold text-white truncate">{song.title}</h3>
                        <p className="text-zinc-400 text-sm truncate">{song.artist}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SectionGrid