import { SignedOut } from '@clerk/clerk-react'
import { LayoutDashboardIcon, Search, User, Settings, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import SignInAuthButton from './SignInAuthButton'
import { useAuthStore } from '@/stores/useAuthStore'
import { buttonVariants } from './ui/button'
import { cn } from '@/lib/utils'
import { useSearchStore } from '@/stores/useSearchStore'
import { useUser, useAuth } from '@clerk/clerk-react'
import { useState, useRef, useEffect } from 'react'

const Topbar = () => {
    const { isAdmin } = useAuthStore()
    const { open } = useSearchStore()
    const { user } = useUser()
    const { signOut } = useAuth()
    const [showUserMenu, setShowUserMenu] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSignOut = async () => {
        await signOut()
        setShowUserMenu(false)
    }

    // console.log("isAdmin",{isAdmin})
    return (
        <div className="flex items-center justify-between p-4 sticky top-0 bg-zinc-900/75 backdrop-blur-md z-10">
            <Link to={"/"} className='flex items-center'> 
                <img src="/DRS.png" alt="DRS Music" className="size-8 mr-2" />
                <span className='hidden sm:inline'>DRS Music</span>
            </Link>
            <div className="flex gap-4 items-center">
                {isAdmin && (
                    <Link to={"/admin"} className={cn(buttonVariants({ variant: "outline" }))}> 
                        <LayoutDashboardIcon className='size-4 mr-2' />
                        Admin Dashboard
                    </Link>
                )}
                <button
                    onClick={open}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 text-white hover:bg-white/10"
                    aria-label="Search songs"
                >
                    <Search className='size-4' />
                </button>
                <SignedOut>
                    <SignInAuthButton />
                </SignedOut>
                {user && (
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-emerald-400 transition-all"
                        >
                            <img 
                                src={user.imageUrl} 
                                alt={user.firstName || user.username || 'Profile'} 
                                className="w-full h-full object-cover"
                            />
                        </button>
                        
                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-zinc-900 rounded-lg border border-zinc-800 shadow-lg z-50">
                                <div className="p-2">
                                    <div className="px-3 py-2 text-sm text-zinc-400 border-b border-zinc-800">
                                        {user.firstName && user.lastName 
                                            ? `${user.firstName} ${user.lastName}`
                                            : user.username || 'User'
                                        }
                                    </div>
                                    
                                    <Link
                                        to="/profile"
                                        onClick={() => setShowUserMenu(false)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-zinc-800 rounded-md transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                        Profile
                                    </Link>
                                    
                                    <Link
                                        to="/settings"
                                        onClick={() => setShowUserMenu(false)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-zinc-800 rounded-md transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Settings
                                    </Link>
                                    
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 rounded-md transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Topbar