import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Play } from "lucide-react";
import { axiosInstance } from "@/lib/axios";
import { Song } from "@/types";
import usePlayerStore from "@/store/usePlayerStore";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { playSong, setQueue } = usePlayerStore();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    const fetchSongs = async () => {
      if (!debouncedQuery) {
        setResults([]);
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const { data } = await axiosInstance.get(`/songs/search`, {
          params: { q: debouncedQuery },
        });
        setResults(data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to search songs");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSongs();
  }, [debouncedQuery]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(true);
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [onOpenChange]);

  const handlePlay = (song: Song) => {
    if (!song) return;
    setQueue(results);
    playSong(song);
    onOpenChange(false);
  };

  const emptyState = useMemo(() => {
    if (!query) {
      return "Start typing to search songs by title or artist.";
    }
    if (!isLoading && !results.length && !error) {
      return "No songs found. Try a different keyword.";
    }
    return null;
  }, [query, isLoading, results.length, error]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-zinc-900 text-white border border-white/10 sm:max-w-2xl max-h-[85vh] flex flex-col top-4 sm:top-16 left-1/2 -translate-x-1/2 translate-y-0"
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search songs
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col">
          <Input
            autoFocus
            placeholder="Search by title or artist"
            value={query}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white focus-visible:ring-emerald-400"
          />

          <div className="flex-1 overflow-y-auto space-y-2">
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching songs...
              </div>
            )}

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            {emptyState && !isLoading && (
              <p className="text-sm text-zinc-400">{emptyState}</p>
            )}

            {!isLoading && !error && results.map((song) => (
              <button
                key={song._id}
                onClick={() => handlePlay(song)}
                className="flex w-full items-center gap-4 rounded-2xl bg-white/5 p-3 text-left hover:bg-white/10 transition"
              >
                <img
                  src={song.imageUrl}
                  alt={song.title}
                  className="h-12 w-12 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{song.title}</p>
                  <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                </div>
                <Play className="h-4 w-4 text-emerald-400" />
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
