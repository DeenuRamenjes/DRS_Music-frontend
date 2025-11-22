import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Album, Song } from "@/types";
import { useMusicStore } from "@/stores/useMusicStore";

interface AssignSongsDialogProps {
  album: Album;
}

const normalizeSongIds = (songs: Album["songs"]) => {
  if (!songs?.length) return [] as string[];
  return songs.map((song: Song | string) => (typeof song === "string" ? song : song._id));
};

const AssignSongsDialog = ({ album }: AssignSongsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const { songs, assignSongsToAlbum, fetchSongs, isLoading } = useMusicStore();

  useEffect(() => {
    if (open && !songs.length) {
      fetchSongs();
    }
  }, [open, songs.length, fetchSongs]);

  useEffect(() => {
    if (open) {
      setSelected(normalizeSongIds(album.songs));
    }
  }, [open, album.songs]);

  const filteredSongs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return songs.filter((song) =>
      song.title.toLowerCase().includes(term) || song.artist.toLowerCase().includes(term)
    );
  }, [songs, search]);

  const toggleSong = (songId: string) => {
    setSelected((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    );
  };

  const handleSave = async () => {
    await assignSongsToAlbum(album._id, selected);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 w-[60%] sm:w-auto"
        >
          Add Songs
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 w-full max-w-[calc(100vw-2rem)] sm:max-w-[640px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Add Songs to {album.title}</DialogTitle>
          <DialogDescription className="text-sm">
            Select songs from your library to include in this album. You can search and multi-select from the list
            below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Input
            placeholder="Search songs by title or artist"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-800 border-zinc-700"
          />

          <ScrollArea className="max-h-[50vh] sm:h-64 rounded-xl border border-zinc-800 overflow-x-hidden">
            <div className="divide-y divide-zinc-800">
              {filteredSongs.length === 0 ? (
                <p className="text-sm text-zinc-400 p-4">No songs found.</p>
              ) : (
                filteredSongs.map((song) => {
                  const isSelected = selected.includes(song._id);
                  return (
                    <label
                      key={song._id}
                      className={`flex items-center gap-3 p-3 cursor-pointer transition rounded-lg ${
                        isSelected ? "bg-emerald-500/10 border border-emerald-500/30" : "hover:bg-zinc-800/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSong(song._id)}
                        className="h-4 w-4 accent-emerald-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{song.title}</p>
                        <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                      </div>
                      <span className="text-xs text-zinc-500">{Math.round(song.duration / 60)} min</span>
                    </label>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-zinc-400 w-full sm:w-auto text-center sm:text-left">
            {selected.length} song{selected.length === 1 ? "" : "s"} selected
          </p>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || selected.length === 0}
              className="w-full sm:w-auto"
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignSongsDialog;
