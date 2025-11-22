import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Music, Trash2 } from "lucide-react"
import { useMusicStore } from "@/stores/useMusicStore"
import { useEffect, useState } from "react"
import AssignSongsDialog from "./AssignSongsDialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import EditAlbumDialog from "./EditAlbumDialog"

const AlbumTable = () => {

        const { albums, deleteAlbum, fetchAlbums } = useMusicStore();
        const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null)
        const [isDeleting, setIsDeleting] = useState(false)

        const confirmDelete = async () => {
          if (!pendingDelete) return;
          setIsDeleting(true);
          try {
            await deleteAlbum(pendingDelete.id);
            setPendingDelete(null);
          } finally {
            setIsDeleting(false);
          }
        }

        useEffect(() => {
            fetchAlbums();
        }, [fetchAlbums]);

  return (
    <>
    <div className='space-y-3 md:hidden'>
      {albums.map((album) => (
        <div key={album._id} className='rounded-lg border border-zinc-800/70 bg-zinc-900/40 p-3 space-y-3'>
          <div className='flex items-center gap-3'>
            <img src={album.imageUrl} alt={album.title} className='size-12 rounded object-cover' />
            <div className='min-w-0'>
              <p className='font-semibold text-sm truncate'>{album.title}</p>
              <p className='text-xs text-zinc-400 truncate'>{album.artist}</p>
            </div>
          </div>
          <div className='flex items-center justify-between text-xs text-zinc-400'>
            <span className='inline-flex items-center gap-1'>
              <Calendar className='size-3.5' />
              {album.releaseYear}
            </span>
            <span className='inline-flex items-center gap-1'>
              <Music className='size-3.5' />
              {album.songs.length} songs
            </span>
          </div>
          <div className='flex justify-end gap-2'>
            <AssignSongsDialog album={album} />
            <EditAlbumDialog album={album} />
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setPendingDelete({ id: album._id, title: album.title })}
              className='text-red-400 hover:text-red-300 hover:bg-red-400/10'
              aria-label={`Delete ${album.title}`}
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      ))}
    </div>

    <Table className='hidden md:table w-full'>

      <TableHeader>
        <TableRow className='hover:bg-zinc-800/50'>
          <TableHead className='w-[50px]'></TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Artist</TableHead>
          <TableHead>Release Year</TableHead>
          <TableHead>Songs</TableHead>
          <TableHead className='text-right pr-16'>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {albums.map((album) => (
          <TableRow key={album._id} className='hover:bg-zinc-800/50'>
            <TableCell>
              <img src={album.imageUrl} alt={album.title} className='w-10 h-10 rounded object-cover' />
            </TableCell>
            <TableCell className='font-medium'>{album.title}</TableCell>
            <TableCell>{album.artist}</TableCell>
            <TableCell>
              <span className='inline-flex items-center gap-1 text-zinc-400'>
                <Calendar className='h-4 w-4' />
                {album.releaseYear}
              </span>
            </TableCell>
            <TableCell>
              <span className='inline-flex items-center gap-1 text-zinc-400'>
                <Music className='h-4 w-4' />
                {album.songs.length} songs
              </span>
            </TableCell>
            <TableCell className='text-right'>
              <div className='flex gap-1 justify-end'>
                <AssignSongsDialog album={album} />
                <EditAlbumDialog album={album} />
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setPendingDelete({ id: album._id, title: album.title })}
                  className='text-red-400 hover:text-red-300 hover:bg-red-400/10'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && !isDeleting && setPendingDelete(null)}>
      <DialogContent className='bg-zinc-900 border-zinc-800 w-full max-w-[calc(100vw-2rem)] sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>Delete {pendingDelete?.title}?</DialogTitle>
          <DialogDescription>
            This action will remove the album and detach its songs. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='sm:flex-row sm:justify-end gap-2'>
          <Button variant='outline' onClick={() => setPendingDelete(null)} disabled={isDeleting}>Cancel</Button>
          <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={confirmDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default AlbumTable