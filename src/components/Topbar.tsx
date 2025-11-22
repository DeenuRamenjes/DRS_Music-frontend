import { SignedOut,UserButton } from '@clerk/clerk-react'
import { LayoutDashboardIcon, Search } from 'lucide-react'
import {Link} from 'react-router-dom'
import SignInAuthButton from './SignInAuthButton'
import { useAuthStore } from '@/stores/useAuthStore'
import { buttonVariants } from './ui/button'
import { cn } from '@/lib/utils'
import { useSearchStore } from '@/stores/useSearchStore'


const Topbar = () => {
    const {isAdmin} = useAuthStore()
    const { open } = useSearchStore()


    // console.log("isAdmin",{isAdmin})
  return (
    <div className="flex items-center justify-between p-4 sticky top-0 bg-zinc-900/75 backdrop-blur-md z-10">
        <Link to={"/"} className='flex items-center'> 
                    <img src="/DRS.png" alt="DRS Music" className="size-8 mr-2"/>
                    <span className='hidden sm:inline'>DRS Music</span>
        </Link>
        <div className="flex gap-4 items-center">
            {isAdmin && (
                <Link to={"/admin"} className={cn(buttonVariants({variant:"outline"}))}> 
                    <LayoutDashboardIcon className='size-4 mr-2'/>
                    Admin Dashboard
                </Link>
            )}
            <button
                onClick={open}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 text-white hover:bg-white/10"
                aria-label="Search songs"
            >
                <Search className='size-4'/>
            </button>
            <SignedOut>
                <SignInAuthButton/>
            </SignedOut>
            <UserButton/>
        </div>
    </div>
  )
}

export default Topbar