import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useMusicStore } from "@/stores/useMusicStore"
import {Calendar, Loader2, Search, Trash} from 'lucide-react'
import EditSongDialog from "./EditSongDialog"
import { Input } from "@/components/ui/input"

const SongTable = () => {

  const {songs, isLoading, error, deleteSong}=useMusicStore()
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredSongs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return songs
    return songs.filter((song) =>
      song.title.toLowerCase().includes(term) ||
      song.artist.toLowerCase().includes(term)
    )
  }, [songs, searchTerm])

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setIsDeleting(true)
    try {
      await deleteSong(pendingDelete.id)
      setPendingDelete(null)
    } finally {
      setIsDeleting(false)
    }
  };

  if (isLoading){
    return(
      <div className="flex items-center justify-center py-8">
        <div className="text-zinc-400">Loading Songs ...</div>
      </div>
    )
  }

  if (error){
    return(
      <div className="flex items-center justify-center py-8">
        <div className="text-red-400">{error}</div>
      </div>
    )
  }

  return(
    <>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <h3 className="text-lg font-semibold">Songs ({filteredSongs.length})</h3>
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Search by title or artist"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="pl-9 bg-zinc-900/60 border-zinc-800 focus-visible:ring-emerald-400"
        />
      </div>
    </div>
    {filteredSongs.length === 0 ? (
      <div className="rounded-lg border border-dashed border-zinc-800/70 p-6 text-center text-zinc-500">
        No songs found for "{searchTerm}".
      </div>
    ) : (
      <>
        <div className='space-y-3 md:hidden'>
          {filteredSongs.map((song) => (
            <div key={song._id} className='flex items-center justify-between rounded-lg border border-zinc-800/70 bg-zinc-900/40 p-3'>
              <div className='flex items-center gap-3 min-w-0'>
                <img src={song.imageUrl} alt={song.title} className='size-12 rounded object-cover flex-shrink-0' />
                <div className='min-w-0'>
                  <p className='font-semibold text-sm truncate'>{song.title}</p>
                  <p className='text-xs text-zinc-400 truncate'>{song.artist}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <EditSongDialog song={song} />
                <Button
                  size={'icon'}
                  variant={'ghost'}
                  className='text-red-400 hover:text-red-300 hover:bg-red-400/10'
                  onClick={() => setPendingDelete({ id: song._id, title: song.title })}
                  aria-label={`Delete ${song.title}`}
                  disabled={isDeleting}
                >
                  <Trash className='size-4' />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto rounded-lg border border-zinc-800/60">
          <Table className="min-w-[560px] text-sm">
            <TableHeader>
              <TableRow className='hover:bg-zinc-800/50'>
                <TableHead className='w-[50px]'></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead className='hidden md:table-cell'>Release Date</TableHead>
                <TableHead className='text-right pr-6'>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredSongs.map((song) => (
                <TableRow key={song._id} className='hover:bg-zinc-800/50 text-sm'>
                  <TableCell>
                    <img src={song.imageUrl} alt={song.title} className="size-10 rounded object-cover" />
                  </TableCell>
                  <TableCell className="font-semibold max-w-[160px] truncate">{song.title}</TableCell>
                  <TableCell className="text-zinc-300 max-w-[140px] truncate">{song.artist}</TableCell>
                  <TableCell className='hidden md:table-cell'>
                    <span className="inline-flex items-center gap-1 text-zinc-400">
                      <Calendar className="h-4 w-4"/>
                      {song.createdAt.split("T")[0]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <EditSongDialog song={song} />
                      <Button 
                        size={"sm"}
                        variant={"ghost"}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        onClick={() => setPendingDelete({ id: song._id, title: song.title })}
                        disabled={isDeleting}
                      >
                        <Trash className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    )}
    <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && !isDeleting && setPendingDelete(null)}>
      <DialogContent className='bg-zinc-900 border-zinc-800 w-full max-w-[calc(100vw-2rem)] sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>Delete {pendingDelete?.title}?</DialogTitle>
          <DialogDescription>
            This action will permanently remove the song from your library. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='sm:flex-row sm:justify-end gap-2'>
          <Button variant='outline' onClick={() => setPendingDelete(null)} disabled={isDeleting}>Cancel</Button>
          <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={confirmDelete} disabled={isDeleting}>
            {isDeleting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </span>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}

export default SongTable