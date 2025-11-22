import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTrigger, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useMusicStore } from "@/stores/useMusicStore"
import { Plus, Upload, Check } from "lucide-react"
import { useState,useRef, useEffect } from "react"
import toast from "react-hot-toast"
import {axiosInstance} from "@/lib/axios"

const extractSongDetailsFromFilename = (filename: string) => {
    const withoutExtension = filename.replace(/\.[^/.]+$/, "")
        .replace(/[_]+/g, " ")
        .trim();

    if (!withoutExtension) {
        return { title: "", artist: "" };
    }

    const parts = withoutExtension.split(/\s*-\s*/);
    if (parts.length >= 2) {
        return {
            artist: parts[0]?.trim() ?? "",
            title: parts.slice(1).join(" - ").trim(),
        };
    }

    return {
        title: withoutExtension,
        artist: "",
    };
};

interface NewSong{
    title: string,
    artist: string,
    albumIds: string[],
    duration: string
}

const getDefaultSong = (): NewSong => ({
    title: "",
    artist: "",
    albumIds: [],
    duration: "0"
});

const AddSongDialog = () => {

    const {albums} = useMusicStore()
    const [songDialogOpen, setSongDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const [newSong, setNewSong] = useState<NewSong>(getDefaultSong())

    const [files, setFiles] = useState<{audio:File|null, image:File|null}>({
        audio:null,
        image:null
    })
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    const audioInputRef = useRef<HTMLInputElement>(null)
    const imageInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!files.image) {
            setImagePreview(null)
            return
        }

        const previewUrl = URL.createObjectURL(files.image)
        setImagePreview(previewUrl)

        return () => {
            URL.revokeObjectURL(previewUrl)
        }
    }, [files.image])

    const createPlaceholderArtwork = (title: string, artist: string) => {
        return new Promise<File | null>((resolve) => {
            try {
                const canvas = document.createElement('canvas');
                const size = 640;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(null);
                    return;
                }

                const baseHue = Math.floor(Math.random() * 360);
                const gradient = ctx.createLinearGradient(0, 0, size, size);
                gradient.addColorStop(0, `hsl(${baseHue}, 70%, 20%)`);
                gradient.addColorStop(1, `hsl(${(baseHue + 45) % 360}, 70%, 45%)`);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, size, size);

                ctx.fillStyle = 'rgba(15,23,42,0.35)';
                for (let i = 0; i < 6; i += 1) {
                    ctx.beginPath();
                    ctx.arc(Math.random() * size, Math.random() * size, 80 + Math.random() * 120, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.font = 'bold 44px "Inter", system-ui, sans-serif';
                ctx.fillStyle = '#f8fafc';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(title, size / 2, size / 2 - 20, size - 120);

                ctx.font = '24px "Inter", system-ui, sans-serif';
                ctx.fillStyle = `hsla(${(baseHue + 20) % 360}, 60%, 80%, 0.8)`;
                ctx.fillText(artist, size / 2, size / 2 + 40, size - 140);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        resolve(null);
                        return;
                    }
                    const file = new File([blob], `${title || 'cover'}.png`, { type: 'image/png' });
                    resolve(file);
                }, 'image/png');
            } catch (error) {
                console.error('Failed generating placeholder artwork', error);
                resolve(null);
            }
        });
    };

    const handleAudioSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setFiles((prev)=>({...prev,audio:file}));

        if (!file) return;

        const inferred = extractSongDetailsFromFilename(file.name);
        const resolvedTitle = newSong.title || inferred.title || 'New Track';
        const resolvedArtist = newSong.artist || inferred.artist || 'Unknown Artist';
        setNewSong((prev) => ({
            ...prev,
            title: prev.title || inferred.title || 'New Track',
            artist: prev.artist || inferred.artist || 'Unknown Artist',
        }));

        if (!files.image) {
            const generated = await createPlaceholderArtwork(resolvedTitle, resolvedArtist);
            if (generated) {
                setFiles((prev) => (prev.image ? prev : { ...prev, image: generated }));
            }
        }

        const objectUrl = URL.createObjectURL(file);
        const tempAudio = new Audio(objectUrl);
        tempAudio.preload = 'metadata';
        tempAudio.onloadedmetadata = () => {
            const seconds = Math.round(tempAudio.duration || 0);
            if (!Number.isNaN(seconds)) {
                setNewSong((prev)=> ({...prev, duration: String(seconds)}));
            }
            URL.revokeObjectURL(objectUrl);
        };
        tempAudio.onerror = () => {
            URL.revokeObjectURL(objectUrl);
        };
    };

    const resetFormState = () => {
        setNewSong(getDefaultSong());
        setFiles({ audio: null, image: null });
        setImagePreview(null);
        if (audioInputRef.current) {
            audioInputRef.current.value = "";
        }
        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }
    };

    useEffect(() => {
        if (!songDialogOpen) {
            resetFormState();
        }
    }, [songDialogOpen]);

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            if (!files.audio || !files.image) {
                return toast.error("Please select an audio and an image");
            }

            const formData = new FormData();
            formData.append("title", newSong.title);
            formData.append("artist", newSong.artist);
            formData.append("duration", newSong.duration);
            formData.append("albumIds", JSON.stringify(newSong.albumIds));
            formData.append("audioFile", files.audio);
            formData.append("imageFile", files.image);

            // Don't set Content-Type header, let the browser set it with the correct boundary
            await axiosInstance.post("/admin/songs", formData);

            resetFormState();
            setSongDialogOpen(false);
            toast.success("Song added successfully");
        } catch (error: any) {
            console.error("Error uploading song:", error);
            toast.error(error.response?.data?.message || "Failed to add song");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={songDialogOpen} onOpenChange={setSongDialogOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 text-black">
                    <Plus className="mr-2 h-4 w-4"/>
                    Add Song
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-700 max-h-[75vh] overflow-y-scroll custom-scrollbar [scrollbar-width:none] [-ms-overflow-style:'none'] [&::-webkit-scrollbar]:hidden">
                <DialogHeader>
                    <DialogTitle>Add New Song</DialogTitle>
                    <DialogDescription>Add a new Song to your music Library</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <input type='file'
                    accept='audio/*'
                    ref={audioInputRef}
                    hidden
                    onChange={handleAudioSelect}
                    />
                    <input type='file'
                    accept='image/*'
                    ref={imageInputRef}
                    className="hidden"
                    onChange={(e)=> {
                        const file = e.target.files?.[0] ?? null
                        setFiles((prev)=>({...prev,image:file}))
                    }}
                    />
                    <div
                        className='flex items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer'
                        onClick={() => imageInputRef.current?.click()}
                    >
                        <div className='text-center'>
                            {files.image && imagePreview ? (
                                <div className='space-y-3'>
                                    <img
                                        src={imagePreview}
                                        alt={files.image.name}
                                        className='w-32 h-32 object-cover rounded-xl mx-auto shadow-lg'
                                    />
                                    <div className='text-xs text-zinc-400 truncate max-w-[160px] mx-auto'>{files.image.name}</div>
                                </div>
                            ) : (
                                <>
                                    <div className='p-3 bg-zinc-800 rounded-full inline-block mb-2'>
                                        <Upload className='h-6 w-6 text-zinc-400' />
                                    </div>
                                    <div className='text-sm text-zinc-400 mb-2'>Upload artwork</div>
                                    <Button variant='outline' size='sm' className='text-xs'>
                                        Choose File
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className='space-y-2'>
                        <label className='text-sm font-medium'>Audio File</label>
                        <p className='text-xs text-zinc-400'>Choose an audio file first to upload other fields automatically.</p>
                        <div className='flex items-center gap-2'>
                            <Button variant='outline' onClick={() => audioInputRef.current?.click()} className='w-full'>
                                {files.audio ? files.audio.name.slice(0, 20) : "Choose Audio File"}
                            </Button>
                        </div>
                    </div>
                    <div className='space-y-2'>
                        <label className='text-sm font-medium'>Title</label>
                        <Input
                            value={newSong.title}
                            onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                            className='bg-zinc-800 border-zinc-700'
                        />
                    </div>

                    <div className='space-y-2'>
                        <label className='text-sm font-medium'>Artist</label>
                        <Input
                            value={newSong.artist}
                            onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
                            className='bg-zinc-800 border-zinc-700'
                        />
                    </div>

                    <div className='space-y-2'>
                        <label className='text-sm font-medium'>Duration (seconds)</label>
                        <Input
                            type='number'
                            min='0'
                            value={newSong.duration}
                            onChange={(e) => setNewSong({ ...newSong, duration: e.target.value || "0" })}
                            className='bg-zinc-800 border-zinc-700'
                        />
                    </div>

                    <div className='space-y-2'>
                        <div className="flex items-center justify-between">
                            <label className='text-sm font-medium'>Albums (optional)</label>
                            <button
                                type="button"
                                onClick={() => setNewSong((prev) => ({ ...prev, albumIds: [] }))}
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
                                        const isSelected = newSong.albumIds.includes(album._id);
                                        return (
                                            <label
                                                key={album._id}
                                                className={`flex items-center gap-3 p-2 cursor-pointer text-sm ${isSelected ? "bg-emerald-500/10" : "hover:bg-zinc-800/60"}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => {
                                                        setNewSong((prev) => {
                                                            const exists = prev.albumIds.includes(album._id);
                                                            return {
                                                                ...prev,
                                                                albumIds: exists
                                                                    ? prev.albumIds.filter((id) => id !== album._id)
                                                                    : [...prev.albumIds, album._id],
                                                            };
                                                        });
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
                            {newSong.albumIds.length === 0
                                ? "No albums selected (will be saved as a single)."
                                : `${newSong.albumIds.length} album${newSong.albumIds.length > 1 ? "s" : ""} selected`}
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant='outline' onClick={() => setSongDialogOpen(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? "Uploading..." : "Add Song"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default AddSongDialog