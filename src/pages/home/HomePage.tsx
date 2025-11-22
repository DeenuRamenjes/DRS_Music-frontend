import Topbar from "@/components/Topbar"
import { useMusicStore } from "@/stores/useMusicStore"
import { useEffect } from "react"
import FeaturedSection from "./component/FeaturedSection"
import { ScrollArea } from "@/components/ui/scroll-area"
import SectionGrid from "./component/SectionGrid"
import usePlayerStore from "@/store/usePlayerStore"

const HomePage = () => {
  const {
    fetchFeaturedSongs,
    fetchMadeForYouSongs,
    fetchTrendingSongs,
    fetchLikedSongs,
    isLoading: musicStoreLoading,
    madeForYouSongs: musicStoreMadeForYouSongs,
    featuredSongs: musicStoreFeaturedSongs,
    trendingSongs: musicStoreTrendingSongs,
    likedSongs,
    likedSongsLoading,
    likedSongsInitialized,
    error: musicStoreError
  } = useMusicStore()

  const { currentSong, setQueue, queue } = usePlayerStore()

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        await Promise.all([
          likedSongsInitialized ? Promise.resolve() : fetchLikedSongs(),
          fetchFeaturedSongs(),
          fetchMadeForYouSongs(),
          fetchTrendingSongs()
        ]);

      } catch (error) {
        console.error('Error fetching songs:', error);
      }
    }

    fetchSongs()
  }, [fetchFeaturedSongs, fetchMadeForYouSongs, fetchTrendingSongs, fetchLikedSongs, likedSongsInitialized])

  useEffect(() => {
    if (!musicStoreLoading) {
      const allSongs = [
        ...musicStoreMadeForYouSongs,
        ...musicStoreFeaturedSongs,
        ...musicStoreTrendingSongs,
        ...likedSongs
      ]
      const shouldSeedQueue = allSongs.length > 0 && !currentSong && queue.length === 0;
      if (shouldSeedQueue) {
        setQueue(allSongs)
      }
    }
  }, [musicStoreLoading, musicStoreMadeForYouSongs, musicStoreFeaturedSongs, musicStoreTrendingSongs, likedSongs, setQueue, currentSong, queue.length])

  if (musicStoreError) {
    return (
      <div className="flex flex-col h-screen">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500 text-center p-4">
            <p className="text-lg font-semibold">Error loading songs</p>
            <p className="text-sm">{musicStoreError}</p>
          </div>
        </div>
      </div>
    )
  }

  if (musicStoreLoading) {
    return (
      <div className="flex flex-col h-screen">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-100">
      <Topbar />
      <ScrollArea className="flex-1 h-[calc(82vh-80px)]">
        <div className="p-4 md:p-6 space-y-6 md:space-y-8">
            <SectionGrid 
              title="Liked Songs" 
              songs={likedSongs} 
              isLoading={likedSongsLoading || !likedSongsInitialized} 
              viewAllPath="/likes"
            />
          <FeaturedSection />
          <div className="space-y-6 md:space-y-8">
            <SectionGrid 
              title="Made For You" 
              songs={musicStoreMadeForYouSongs} 
              isLoading={musicStoreLoading} 
            />
            <SectionGrid 
              title="Trending" 
              songs={musicStoreTrendingSongs} 
              isLoading={musicStoreLoading} 
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

export default HomePage