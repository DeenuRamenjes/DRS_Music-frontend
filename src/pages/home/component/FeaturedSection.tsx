import { useMusicStore } from "@/stores/useMusicStore";
import FeaturedGridSkeleton from "@/components/skeletons/FeaturedGridSkeleton";
import { Play, Pause } from "lucide-react";
import usePlayerStore from "@/store/usePlayerStore";
import { Song } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link, useNavigate } from "react-router-dom";

const FeaturedSection = () => {
	const navigate = useNavigate();
	const { isLoading, featuredSongs, error } = useMusicStore();
	const { currentSong, isPlaying, playSong, pauseSong, playAlbum } = usePlayerStore();

	const playFromFeatured = (song: Song, index: number) => {
		if (currentSong?._id === song._id) {
			if (!isPlaying) {
				playSong(song);
			}
			return;
		}
		playAlbum(featuredSongs, index);
	};

	const handleCardClick = (song: Song, index: number) => {
		playFromFeatured(song, index);
		navigate(`/songs/${song._id}`);
	};

	const handleIconClick = (event: React.MouseEvent<HTMLButtonElement>, song: Song, index: number) => {
		event.stopPropagation();
		if (currentSong?._id === song._id && isPlaying) {
			pauseSong();
			return;
		}
		playFromFeatured(song, index);
	};

	if (isLoading) return <FeaturedGridSkeleton />;

	if (error) return <p className='text-red-500 mb-4 text-lg'>{error}</p>;

	if (featuredSongs.length === 0) {
		return (
			<div className="space-y-4">
				<div className="flex justify-between items-center">
					<h2 className="text-2xl font-bold">Featured</h2>
					<Link 
						to="/songs" 
						className="text-sm text-zinc-400 hover:text-white transition-colors"
					>
						View All
					</Link>
				</div>
				<div className="text-zinc-400">No featured songs available</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Featured</h2>
				<Link 
					to="/songs" 
					className="text-sm text-zinc-400 hover:text-white transition-colors"
				>
					View All
				</Link>
			</div>
			<ScrollArea className="w-full">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
					{featuredSongs.map((song, index) => (
						<div
							key={song._id}
							className="flex items-center bg-zinc-800/50 rounded-lg p-4 hover:bg-zinc-700/50 transition-colors group cursor-pointer relative"
							onClick={() => handleCardClick(song, index)}
						>
							<img
								src={song.imageUrl}
								alt={song.title}
								className="w-16 sm:w-20 h-16 sm:h-20 object-cover rounded-lg flex-shrink-0"
							/>
							<div className="flex-1 p-4 min-w-0">
								<p className="font-medium text-white truncate max-w-[200px]">{song.title}</p>
								<p className="text-sm text-zinc-400 truncate max-w-[200px]">{song.artist}</p>
							</div>
							<div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
								<button
									type="button"
									onClick={(event) => handleIconClick(event, song, index)}
									className="rounded-full bg-emerald-500/80 p-2 text-white hover:bg-emerald-500"
									aria-label={currentSong?._id === song._id && isPlaying ? "Pause" : "Play"}
								>
									{currentSong?._id === song._id && isPlaying ? (
										<Pause className="w-5 h-5" />
									) : (
										<Play className="w-5 h-5" />
									)}
								</button>
							</div>
						</div>
					))}
				</div>
			</ScrollArea>
		</div>
	);
};

export default FeaturedSection;
