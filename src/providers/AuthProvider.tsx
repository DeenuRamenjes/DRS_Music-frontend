import { axiosInstance } from "@/lib/axios"
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/clerk-react"
import { useAuthStore } from "@/stores/useAuthStore"
import { useChatStore } from "@/stores/useChatStore"


const updateApiToken = async (token: string | null) => {
    if (token) {
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
        delete axiosInstance.defaults.headers.common['Authorization']
    }
}

const AuthProvider = ({children}:{children:React.ReactNode}) => {

    const { getToken,userId } = useAuth()
    const [loading, setLoading] = useState(true)
    const { checkAdminStatus } = useAuthStore()
    const {initSocket,disconnectSocket}=useChatStore()

    useEffect(() => {
        const initAuth = async () => {
            try{
                const token = await getToken()
                updateApiToken(token)
                if(token){
                    await checkAdminStatus()

                    //init Socket
                    if(userId){
                        initSocket(userId)
                    }
                }
            }
            catch (error) {
                updateApiToken(null)
                console.log("Error in getting token",error)
            }
            finally{
                setLoading(false)
            }   
        }
        initAuth()

        return () => {
            disconnectSocket()
        }
    },[getToken,userId,checkAdminStatus,initSocket,disconnectSocket])


    if(loading){
        return(
            <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950">
                <div className="relative mb-8">
                    {/* Animated music notes */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex space-x-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.4s' }}></div>
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.4s' }}></div>
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1.4s' }}></div>
                        </div>
                    </div>
                    
                    {/* Central vinyl record */}
                    <div className="relative w-24 h-24 bg-zinc-900 rounded-full border-4 border-zinc-800 animate-spin" style={{ animationDuration: '3s' }}>
                        <div className="absolute inset-2 bg-zinc-950 rounded-full border-2 border-zinc-700">
                            <div className="absolute inset-2 bg-gradient-to-r from-emerald-500 to-zinc-600 rounded-full opacity-20"></div>
                            <div className="absolute inset-4 bg-zinc-900 rounded-full border border-zinc-600">
                                <div className="absolute inset-2 bg-zinc-800 rounded-full">
                                    <div className="absolute inset-1 bg-zinc-700 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                        {/* Groove lines */}
                        <div className="absolute inset-4 rounded-full border border-zinc-700 opacity-30"></div>
                        <div className="absolute inset-6 rounded-full border border-zinc-700 opacity-20"></div>
                        <div className="absolute inset-8 rounded-full border border-zinc-700 opacity-10"></div>
                    </div>
                </div>
                
                {/* Loading text */}
                <div className="text-center space-y-3">
                    < div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <p className="text-zinc-300 text-lg font-medium">Connecting to server...</p>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '500ms' }}></div>
                    </div>
                    <p className="text-zinc-500 text-sm">Setting up your music experience</p>
                </div>
                
                {/* Progress bar */}
                <div className="w-64 h-1 bg-zinc-800 rounded-full overflow-hidden mt-6">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-zinc-600 rounded-full animate-pulse" style={{ width: '60%', animation: 'shimmer 2s infinite' }}></div>
                </div>
                
                {/* Additional decorative elements */}
                <div className="absolute top-10 left-10 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-32 h-32 bg-zinc-600/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
        )
    }

  return (
    <div>{children}</div>
  )
}

export default AuthProvider