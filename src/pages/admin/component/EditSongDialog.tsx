import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Song } from "@/types";
import { useMusicStore } from "@/stores/useMusicStore";
import { Check, Edit2 } from "lucide-react";

interface EditSongDialogProps {
  song: Song;
}

const EditSongDialog = ({ song }: EditSongDialogProps) => {
  const { albums, updateSong } = useMusicStore();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [duration, setDuration] = useState(String(song.duration || 0));
  const [selectedAlbumIds, setSelectedAlbumIds] = useState<string[]>(song.albumIds ?? []);

  useEffect(() => {
    if (open) {
      setTitle(song.title);
      setArtist(song.artist);
      setDuration(String(song.duration || 0));
      setSelectedAlbumIds(song.albumIds ?? []);
      audioFileRef.current = null;
      imageFileRef.current = null;
    }
  }, [open, song]);

  const audioFileRef = useRef<File | null>(null);
  const imageFileRef = useRef<File | null>(null);

  const handleFileChange = (type: "audio" | "image", file: File | null) => {
    if (type === "audio") {
      audioFileRef.current = file;
    } else {
      imageFileRef.current = file;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      if (title !== song.title) formData.append("title", title);
      if (artist !== song.artist) formData.append("artist", artist);
      if (duration && String(song.duration) !== duration) formData.append("duration", duration);
      formData.append("albumIds", JSON.stringify(selectedAlbumIds));

      if (audioFileRef.current) {
        formData.append("audioFile", audioFileRef.current);
      }
      if (imageFileRef.current) {
        formData.append("imageFile", imageFileRef.current);
      }

      await updateSong(song._id, formData);
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10" aria-label={`Edit ${song.title}`}>
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-700 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Song</DialogTitle>
          <DialogDescription>Update the song details below.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-zinc-800 border-zinc-700" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Artist</label>
            <Input value={artist} onChange={(e) => setArtist(e.target.value)} className="bg-zinc-800 border-zinc-700" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Duration (seconds)</label>
            <Input type="number" min="0" value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-zinc-800 border-zinc-700" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Albums (optional)</label>
              <button
                type="button"
                onClick={() => setSelectedAlbumIds([])}
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                Clear
              </button>
            </div>
            <ScrollArea className="max-h-40 rounded-xl border border-zinc-800">
              <div className="divide-y divide-zinc-800">
                {albums.length === 0 ? (
                  <p className="text-xs text-zinc-500 p-3">No albums available.</p>
                ) : (
                  albums.map((album) => {
                    const isSelected = selectedAlbumIds.includes(album._id);
                    return (
                      <label
                        key={album._id}
                        className={`flex items-center gap-3 p-2 cursor-pointer text-sm ${isSelected ? "bg-emerald-500/10" : "hover:bg-zinc-800/60"}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedAlbumIds((prev) =>
                              prev.includes(album._id)
                                ? prev.filter((id) => id !== album._id)
                                : [...prev, album._id]
                            );
                          }}
                          className="h-4 w-4 accent-emerald-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{album.title}</p>
                          <p className="text-xs text-zinc-500">{album.artist}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                      </label>
                    );
                  })
                )}
              </div>
            </ScrollArea>
            <p className="text-xs text-zinc-500">
              {selectedAlbumIds.length === 0
                ? "No albums selected (will remain a single)."
                : `${selectedAlbumIds.length} album${selectedAlbumIds.length > 1 ? "s" : ""} selected`}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Replace Audio (optional)</label>
            <Input type="file" accept="audio/*" onChange={(e) => handleFileChange("audio", e.target.files?.[0] ?? null)} className="bg-zinc-800 border-zinc-700" />
            <p className="text-xs text-zinc-500">Leave empty to keep the current audio file.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Replace Artwork (optional)</label>
            <Input type="file" accept="image/*" onChange={(e) => handleFileChange("image", e.target.files?.[0] ?? null)} className="bg-zinc-800 border-zinc-700" />
            <p className="text-xs text-zinc-500">Leave empty to keep the current artwork.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSongDialog;
