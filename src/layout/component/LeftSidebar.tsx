import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SignedIn } from "@clerk/clerk-react"
import { HomeIcon, Library, MessageCircle, Music, Users } from "lucide-react"

import { Link } from "react-router-dom"
import {ScrollArea} from '@/components/ui/scroll-area'
import PlaylistSkeleton from "@/components/skeletons/PlayListSkeleton"
import { useMusicStore } from "@/stores/useMusicStore"
import { useChatStore } from "@/stores/useChatStore"
import { useEffect, useMemo } from "react"

type LeftSidebarProps = {
    onNavigate?: () => void;
    onOpenFriends?: () => void;
}

const LeftSidebar = ({ onNavigate, onOpenFriends }: LeftSidebarProps) => {

    const {albums,fetchAlbums,isLoading} = useMusicStore();
    const { unreadCounts } = useChatStore();
    const unreadTotal = useMemo(() => Object.values(unreadCounts).reduce((sum, count) => sum + count, 0), [unreadCounts]);

    useEffect(() => {
        fetchAlbums();
    },[fetchAlbums])

    return (
        <div className="h-full flex flex-col gap-2">
            <div className="rounded-lg bg-zinc-900 p-2 sm:p-4">
                <div className="space-y-2">

                    <Link to={'/'} className={cn(buttonVariants({
                        variant: 'ghost',
                        className: 'w-full justify-start text-white hover:bg-zinc-800'
                    }))} onClick={onNavigate}>
                        <HomeIcon className="mr-2 size-5"/>
                        <span >Home</span>
                    </Link>

                    <Link to={'/songs'} className={cn(buttonVariants({
                        variant: 'ghost',
                        className: 'w-full justify-start text-white hover:bg-zinc-800'
                    }))} onClick={onNavigate}>
                        <Music className="mr-2 size-5"/>
                        <span >Songs</span>
                    </Link>

                    <SignedIn>
                        <Link
                            to={'/chat'}
                            className={cn(buttonVariants({
                                variant: 'ghost',
                                className: 'w-full justify-between text-white hover:bg-zinc-800'
                            }))}
                            onClick={onNavigate}
                        >
                            <span className="flex items-center gap-2">
                                <MessageCircle className="size-5"/>
                                <span>Messages</span>
                            </span>
                            {unreadTotal > 0 && (
                                <span className='ml-2 inline-flex items-center justify-center min-w-6 px-2 text-[11px] font-semibold rounded-full bg-emerald-500 text-white'>
                                    {unreadTotal > 9 ? '9+' : unreadTotal}
                                </span>
                            )}
                        </Link>
                    </SignedIn>

                    <button
                        type="button"
                        className={cn(buttonVariants({
                            variant: 'ghost',
                            className: 'w-full justify-start text-white hover:bg-zinc-800 md:hidden'
                        }))}
                        onClick={() => {
                            onNavigate?.();
                            onOpenFriends?.();
                        }}
                    >
                        <Users className="mr-2 size-5" />
                        <span>Friends Activity</span>
                    </button>
                </div>
            </div>
            
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-white px-2">
                    <Library className="size-5 mr-2"/>
                    <span >Playlists</span>
                </div>
            </div>
            <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-2">
                    {isLoading ? (
                        <PlaylistSkeleton/>
                    ) : (
                        albums.map((album) => (
                            <Link
                                to={`/albums/${album._id}`}
                                key={album._id}
                                className='p-2 hover:bg-zinc-800 rounded-md flex items-center gap-3 group cursor-pointer'
                                onClick={onNavigate}
                            >
                                <img
                                    src={album.imageUrl}
                                    alt='Playlist img'
                                    className='size-12 rounded-md flex-shrink-0 object-cover'
                                />
                                <div className='flex-1 min-w-0'>
                                    <p className='font-medium truncate'>{album.title}</p>
                                    <p className='text-sm text-zinc-400 truncate'>Album • {album.artist}</p>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

export default LeftSidebar;