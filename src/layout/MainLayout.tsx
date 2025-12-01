import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

import {ResizablePanelGroup, ResizablePanel, ResizableHandle} from '@/components/ui/resizable';
import LeftSidebar from './component/LeftSidebar';
import FriendsActivity from './component/FriendsActivity';
import AudioPlayer from '@/components/AudioPlayer';
import PlaybackControls from './component/PlaybackControls';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import usePlayerStore from '@/store/usePlayerStore';
import { useChatStore } from '@/stores/useChatStore';
import useDisplayStore from '@/store/useDisplayStore';
import '@/styles/display.css';

const MainLayout = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isFriendsOpen, setIsFriendsOpen] = useState(false);
    const { currentSong, isPlaying, playSong, pauseSong, playNext, playPrevious } = usePlayerStore();
    const { unreadCounts } = useChatStore();
    const { theme, accentColor, compactMode, layout, sidebarCollapsed } = useDisplayStore();
    const totalUnread = useMemo(() => Object.values(unreadCounts).reduce((sum, count) => sum + count, 0), [unreadCounts]);

    const navigate = useNavigate();
    const location = useLocation();
    const isSongDetailPage = location.pathname.startsWith('/songs/');
    const showCompactSongLayout = isSongDetailPage && isMobile;

    const lastNavigatedSongId = useRef<string | null>(null);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setIsSidebarOpen(false);
                setIsFriendsOpen(false);
            }
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        if (!location.pathname.startsWith('/songs/')) {
            const pathWithSearch = `${location.pathname}${location.search}${location.hash}`;
            localStorage.setItem('app:lastNonSongPath', pathWithSearch);
        }
    }, [location.pathname, location.search, location.hash]);

    useEffect(() => {
        if (!currentSong) return;
        if (location.pathname === '/') {
            lastNavigatedSongId.current = currentSong._id;
            return;
        }

        const songPath = `/songs/${currentSong._id}`;
        const alreadyNavigated = lastNavigatedSongId.current === currentSong._id;

        if (alreadyNavigated && location.pathname !== songPath) {
            return;
        }

        if (location.pathname === '/home' || location.pathname === '/') {
            return;
        }
        if (location.pathname === '/profile' || location.pathname === '/') {
            return;
        }
        if (location.pathname === '/settings' || location.pathname === '/') {
            return;
        }

        if (!alreadyNavigated || location.pathname !== songPath) {
            lastNavigatedSongId.current = currentSong._id;
            navigate(songPath);
        }
    }, [currentSong?._id, location.pathname, navigate]);

    useEffect(() => {
        const handleKeyboardShortcuts = (event: KeyboardEvent) => {
            if (!currentSong) return;
            if (event.repeat) return;

            const target = event.target as HTMLElement | null;
            const tagName = target?.tagName?.toLowerCase();
            const interactiveElements = ['input', 'textarea', 'select', 'button'];
            if (target?.isContentEditable || (tagName && interactiveElements.includes(tagName))) {
                return;
            }

            switch (event.code) {
                case 'Space':
                    event.preventDefault();
                    if (isPlaying) {
                        pauseSong();
                    } else {
                        playSong(currentSong);
                    }
                    break;
                case 'Home':
                    event.preventDefault();
                    if (isPlaying) {
                        pauseSong();
                    } else {
                        playSong(currentSong);
                    }
                    break;
                case 'PageDown':
                    event.preventDefault();
                    playNext();
                    break;
                case 'PageUp':
                    event.preventDefault();
                    playPrevious();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyboardShortcuts);
        return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
    }, [currentSong, isPlaying, pauseSong, playSong, playNext, playPrevious]);

    const handleSidebarNavigate = () => {
        setIsSidebarOpen(false);
    };

    const handleOpenFriends = () => {
        setIsSidebarOpen(false);
        setIsFriendsOpen(true);
    };

    useEffect(() => {
        const root = document.documentElement;
        
        // Apply theme
        if (theme === 'light') {
            root.classList.add('light');
            root.classList.remove('dark');
        } else {
            root.classList.add('dark');
            root.classList.remove('light');
        }
        
        // Apply accent color
        root.setAttribute('data-accent', accentColor);
        
        // Apply compact mode
        if (compactMode) {
            root.classList.add('compact-mode');
        } else {
            root.classList.remove('compact-mode');
        }
        
        // Apply layout
        root.setAttribute('data-layout', layout);
        
    }, [theme, accentColor, compactMode, layout]);

    return (
        <div className={`h-dvh ${theme === 'light' ? 'bg-white text-black' : 'bg-black text-white'} flex flex-col ${compactMode ? 'compact-mode' : ''} layout-${layout}`}>
            {isMobile && isSidebarOpen && !showCompactSongLayout && (
                <div className="fixed inset-0 z-50">
                    <div 
                        className="absolute inset-0 bg-black/70"
                        onClick={() => setIsSidebarOpen(false)}
                    />

                    <div className="absolute inset-y-0 left-0 w-5/6 sm:w-2/3 max-w-[85vw] bg-zinc-950 shadow-2xl p-3 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm uppercase tracking-wide text-zinc-400">Browse</p>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white"
                                onClick={() => setIsSidebarOpen(false)}
                                aria-label="Close sidebar"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <LeftSidebar onNavigate={handleSidebarNavigate} onOpenFriends={handleOpenFriends} />
                    </div>
                </div>
            )}
            {isMobile && !showCompactSongLayout && (
                <div className="flex items-center justify-between p-2 bg-zinc-900 gap-2">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="text-white"
                                aria-label="Open navigation"
                            >
                                <Menu className="h-6 w-6" />
                            </Button>
                            {totalUnread > 0 && (
                                <span className="absolute top-1 -right-1 inline-flex items-center justify-center min-w-5 px-1 text-[10px] font-semibold rounded-full bg-emerald-500 text-white">
                                    {totalUnread > 9 ? '9+' : totalUnread}
                                </span>
                            )}
                        </div>

                    </div>
                    <Link to={"/home"} className='flex space-x-2'>
                        <h1 className='font-semibold text-xl'>DRS Music</h1>
                        <img src="/DRS.png" alt="Logo" className='size-8' />
                    </Link>
                </div>
            )}
            {isMobile && isFriendsOpen && !showCompactSongLayout && (
                <div className="fixed inset-0 z-50">
                    <div 
                        className="absolute inset-0 bg-black/70"
                        onClick={() => setIsFriendsOpen(false)}
                    />

                    <div className="absolute inset-0 bg-zinc-950 p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm uppercase tracking-wide text-zinc-400">Friends Activity</p>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white"
                                onClick={() => setIsFriendsOpen(false)}
                                aria-label="Close friends activity"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto rounded-lg border border-zinc-800">
                            <FriendsActivity/>
                        </div>
                    </div>
                </div>
            )}
            {showCompactSongLayout ? (
                <div className='flex-1 min-h-0'>
                    <Outlet />
                </div>
            ) : (
                <ResizablePanelGroup direction='horizontal' className={`flex-1 flex h-full overflow-hidden ${compactMode ? 'p-1' : 'p-2'}`}>
                    {!isMobile && !sidebarCollapsed && (
                        <>
                            <ResizablePanel 
                                defaultSize={
                                    layout === 'compact' ? 15 : 
                                    layout === 'expanded' ? 25 : 
                                    20
                                } 
                                minSize={layout === 'compact' ? 8 : 10} 
                                maxSize={layout === 'compact' ? 25 : 30}
                            >
                                <LeftSidebar onOpenFriends={handleOpenFriends}/>
                            </ResizablePanel>
                            <ResizableHandle className={`w-2 ${theme === 'light' ? 'bg-gray-300' : 'bg-black'} rounded-lg transition-colors`}/>
                        </>
                    )}
                    <ResizablePanel 
                        defaultSize={
                            isMobile ? 100 : 
                            sidebarCollapsed ? 85 :
                            layout === 'compact' ? 70 : 
                            layout === 'expanded' ? 50 : 
                            60
                        }
                    >
                        <Outlet/>
                    </ResizablePanel>
                    {!isMobile && (
                        <>
                            <ResizableHandle className={`w-2 ${theme === 'light' ? 'bg-gray-300' : 'bg-black'} rounded-lg transition-colors`}/>
                            <ResizablePanel 
                                defaultSize={
                                    layout === 'compact' ? 15 : 
                                    layout === 'expanded' ? 25 : 
                                    20
                                } 
                                minSize={0} 
                                maxSize={layout === 'compact' ? 20 : 25} 
                                collapsedSize={0}
                            >
                                <FriendsActivity/>
                            </ResizablePanel>
                        </>
                    )}
                </ResizablePanelGroup>
            )}
            <AudioPlayer />
            {!showCompactSongLayout && <PlaybackControls />}
        </div>
    );
}

export default MainLayout;