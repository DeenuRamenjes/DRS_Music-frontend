import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Album } from "@/types";
import { useMusicStore } from "@/stores/useMusicStore";
import { Edit2 } from "lucide-react";

interface EditAlbumDialogProps {
  album: Album;
}

const EditAlbumDialog = ({ album }: EditAlbumDialogProps) => {
  const { updateAlbum } = useMusicStore();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState(album.title);
  const [artist, setArtist] = useState(album.artist);
  const [releaseYear, setReleaseYear] = useState(String(album.releaseYear));

  const imageFileRef = useRef<File | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(album.title);
      setArtist(album.artist);
      setReleaseYear(String(album.releaseYear));
      imageFileRef.current = null;
    }
  }, [open, album]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      if (title !== album.title) formData.append("title", title);
      if (artist !== album.artist) formData.append("artist", artist);
      if (releaseYear !== String(album.releaseYear)) formData.append("releaseYear", releaseYear);
      if (imageFileRef.current) {
        formData.append("imageFile", imageFileRef.current);
      }

      await updateAlbum(album._id, formData);
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10" aria-label={`Edit ${album.title}`}>
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-700 max-h-[75vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Album</DialogTitle>
          <DialogDescription>Update album information below.</DialogDescription>
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
            <label className="text-sm font-medium">Release Year</label>
            <Input
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={releaseYear}
              onChange={(e) => setReleaseYear(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Replace Artwork (optional)</label>
            <Input type="file" accept="image/*" onChange={(e) => (imageFileRef.current = e.target.files?.[0] ?? null)} className="bg-zinc-800 border-zinc-700" />
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

export default EditAlbumDialog;
