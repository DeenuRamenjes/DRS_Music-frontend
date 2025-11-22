import { axiosInstance } from "@/lib/axios"
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/clerk-react"
import { RefreshCw } from "lucide-react"
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
    const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking')
    // const [retryCount, setRetryCount] = useState(0)
    const { checkAdminStatus } = useAuthStore()
    const {initSocket,disconnectSocket}=useChatStore()

    const checkBackendHealth = async (): Promise<boolean> => {
        try {
            setServerStatus('checking')
            
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout')), 5000)
            })
            
            const response = await Promise.race([
                fetch('/api/health', { method: 'GET' }),
                timeoutPromise
            ]) as Response
            
            const isHealthy = response.ok
            setServerStatus(isHealthy ? 'online' : 'offline')
            return isHealthy
        } catch (error) {
            console.log('Health check failed:', error)
            setServerStatus('offline')
            return false
        }
    }

    const waitForBackend = async (): Promise<boolean> => {
        let attempt = 0
        while (true) {
            attempt++
            // setRetryCount(attempt)
            
            const isHealthy = await checkBackendHealth()
            if (isHealthy) return true

            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000)
            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }

    const startServerMonitoring = () => {
        const interval = setInterval(async () => {
            const isHealthy = await checkBackendHealth()
            if (!isHealthy) {
                setLoading(true)
                clearInterval(interval)
                await waitForBackend()
                setLoading(false)
            }
        }, 10000) // Check every 10 seconds

        return () => clearInterval(interval)
    }

    useEffect(() => {
        const initAuth = async () => {
            try{
                // Wait for backend to be healthy - this will loop until server responds
                await waitForBackend()

                const token = await getToken()
                updateApiToken(token)
                if(token){
                    await checkAdminStatus()

                    if(userId){
                        initSocket(userId)
                    }
                }
                
                // Start monitoring server health
                const stopMonitoring = startServerMonitoring()
                
                // Only set loading to false after everything is ready
                setLoading(false)
                
                return () => {
                    stopMonitoring()
                }
            }
            catch (error) {
                updateApiToken(null)
                console.log("Error in getting token",error)
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
            <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-black">
                <div className="text-center space-y-8 max-w-lg mx-auto px-6">
                    {/* Music-themed animated header */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
                        <div className="relative flex items-center justify-center">
                            {serverStatus === 'checking' && (
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-ping"></div>
                                    <RefreshCw className="relative size-20 text-emerald-500 animate-spin" />
                                </div>
                            )}
                            {serverStatus === 'online' && (
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-xl animate-pulse"></div>
                                    <div className="relative size-20 flex items-center justify-center">
                                        <div className="w-12 h-12 bg-emerald-500 rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                            )}
                            {serverStatus === 'offline' && (
                                <div className="relative">
                                    <div className="absolute inset-0 bg-zinc-600/20 rounded-full blur-xl animate-pulse"></div>
                                    <div className="relative size-20 flex items-center justify-center">
                                        <div className="w-12 h-12 bg-zinc-600 rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Main status section */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-zinc-100">
                                {serverStatus === 'checking' && 'DRS Music Server Starting'}
                                {serverStatus === 'online' && 'Connection Established'}
                                {serverStatus === 'offline' && 'Waking Up Server'}
                            </h1>
                            
                            <div className="h-1 w-20 bg-emerald-500 rounded-full mx-auto"></div>
                        </div>
                        
                        <div className="space-y-4">
                            <p className="text-lg text-zinc-300 font-medium">
                                {/* {serverStatus === 'checking' && 
                                    `Connecting... (Attempt ${retryCount})`
                                } */}
                                {serverStatus === 'online' && 
                                    'DRS Music Server is live! Setting up your experience...'
                                }
                                {serverStatus === 'offline' && 
                                    'DRS Music Server is booting up from sleep mode...'
                                }
                            </p>
                            
                            {/* Status cards */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className={`bg-zinc-800/60 border border-zinc-700 rounded-lg p-3 ${
                                    serverStatus === 'checking' ? 'ring-2 ring-emerald-500/50' : ''
                                }`}>
                                    <div className="text-2xl mb-1">⏱️</div>
                                    <div className="text-xs text-zinc-300">60s</div>
                                    <div className="text-xs text-zinc-400">Est. Time</div>
                                </div>
                                <div className={`bg-zinc-800/60 border border-zinc-700 rounded-lg p-3 ${
                                    serverStatus === 'online' ? 'ring-2 ring-emerald-500/50' : ''
                                }`}>
                                    <div className="text-2xl mb-1">🎵</div>
                                    <div className="text-xs text-zinc-300">Music</div>
                                    <div className="text-xs text-zinc-400">Service</div>
                                </div>
                                <div className={`bg-zinc-800/60 border border-zinc-700 rounded-lg p-3 ${
                                    serverStatus === 'offline' ? 'ring-2 ring-zinc-500/50' : ''
                                }`}>
                                    <div className="text-2xl mb-1">🔄</div>
                                    <div className="text-xs text-zinc-300">Auto</div>
                                    <div className="text-xs text-zinc-400">Retry</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Music wave animation */}
                    <div className="flex items-center justify-center space-x-1">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-1 rounded-full animate-pulse ${
                                    serverStatus === 'online' ? 'bg-emerald-500' :
                                    serverStatus === 'offline' ? 'bg-zinc-600' :
                                    'bg-emerald-500'
                                }`}
                                style={{
                                    height: `${Math.random() * 30 + 10}px`,
                                    animationDelay: `${i * 100}ms`,
                                    animationDuration: '1s'
                                }}
                            ></div>
                        ))}
                    </div>

                    {/* Enhanced tips section */}
                    <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-6 space-y-4">
                        <div className="flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <p className="text-sm font-semibold text-zinc-200">What's happening?</p>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        </div>
                        <div>
                            <ul className="text-xs text-zinc-300 space-y-2">
                            <li className="space-x-2">
                                <span>This only happens after periods of inactivity, not on every visit</span>
                            </li>
                            <li className="space-x-2">
                                <span>Just need to wake up the server</span>
                            </li>
                        </ul>
                        </div>
                    </div>

                    {/* Footer message */}
                    <div className="text-xs text-zinc-400">
                        Thank you for your patience while we prepare your music experience 🎶
                    </div>
                </div>
            </div>
        )
    }

  return (
    <div>{children}</div>
  )
}

export default AuthProvider