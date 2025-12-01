import { useUser, useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { User, Mail, Calendar, Music, Clock, Heart } from 'lucide-react';
import { useMusicStore } from '@/stores/useMusicStore';
import usePlayerStore from '@/store/usePlayerStore';
import { useAuthStore } from '@/stores/useAuthStore';

const ProfilePage = () => {
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const { albums, likedSongs, likedSongsLoading, likedSongsInitialized, fetchLikedSongs } = useMusicStore();
  const { currentSong } = usePlayerStore();
  const { isPlaying } = usePlayerStore();
  const { isAdmin } = useAuthStore();
  
  const [stats, setStats] = useState({
    totalSongs: 0,
    totalAlbums: 0,
    totalPlaylists: 0,
    listeningTime: 0,
    favoriteGenres: [] as string[]
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'listen',
      title: 'Listened to a song',
      songTitle: currentSong?.title || 'Unknown Song',
      artist: currentSong?.artist || 'Unknown Artist',
      timestamp: isPlaying ? 'Just now' : 'Recently',
      icon: Music
    }
  ]);

  useEffect(() => {
    if (likedSongs.length > 0) {
      setRecentActivity(prev => [
        ...prev,
        {
          id: 2,
          type: 'like',
          title: 'Liked a song',
          songTitle: likedSongs[0]?.title || 'Unknown Song',
          artist: likedSongs[0]?.artist || 'Unknown Artist',
          timestamp: 'Recently',
          icon: Heart
        }
      ]);
    }
  }, [likedSongs]);

  useEffect(() => {
    if (!likedSongsInitialized && !likedSongsLoading) {
      fetchLikedSongs();
    }
  }, [likedSongsInitialized, likedSongsLoading, fetchLikedSongs]);

  useEffect(() => {
    const calculateStats = () => {
      let totalListeningMinutes = 0;
      
      likedSongs.forEach(song => {
        if (song.duration) {
          totalListeningMinutes += Math.floor(song.duration / 60);
        }
      });
      
      setStats({
        totalSongs: albums.reduce((acc, album) => acc + (album.songs?.length || 0), 0),
        totalAlbums: albums.length,
        totalPlaylists: likedSongs.length,
        listeningTime: totalListeningMinutes,
        favoriteGenres: []
      });
    };

    const updateRecentActivity = () => {
      const activities = [
        {
          id: 1,
          type: 'listen',
          title: 'Listened to a song',
          songTitle: currentSong?.title || 'Unknown Song',
          artist: currentSong?.artist || 'Unknown Artist',
          timestamp: isPlaying ? 'Just now' : 'Recently',
          icon: Music
        }
      ];

      if (likedSongs.length > 0) {
        activities.push({
          id: 2,
          type: 'like',
          title: 'Liked a song',
          songTitle: likedSongs[0]?.title || 'Unknown Song',
          artist: likedSongs[0]?.artist || 'Unknown Artist',
          timestamp: 'Recently',
          icon: Heart
        });
      }

      setRecentActivity(activities);
    };

    calculateStats();
    updateRecentActivity();
  }, [albums, likedSongs]);

  if (!isSignedIn || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">Please sign in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white p-4 sm:p-6 lg:p-8 overflow-y-auto h-full custom-scrollbar [scrollbar-width:none] [-ms-overflow-style:'none'] [&::-webkit-scrollbar]:hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Profile</h1>
          {/* <p className="text-zinc-400">Manage your account and view your music activity</p> */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Profile Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              {/* Profile Picture */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center mb-4 bg-zinc-800">
                  {user.imageUrl ? (
                    <img 
                      src={user.imageUrl} 
                      alt={user.firstName || user.username || 'Profile'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-zinc-400" />
                  )}
                </div>
                <h2 className="text-xl font-semibold mb-1">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.username || 'Music Lover'
                  }
                </h2>
                <p className="text-zinc-400 text-sm flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>

              {/* Account Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                  <span className="text-zinc-400 text-sm">Member Since</span>
                  <span className="text-sm flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(user.createdAt!).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                  <span className="text-zinc-400 text-sm">Account Type</span>
                  <span className="text-sm text-emerald-400">
                    {isAdmin ? 'Admin' : 'Premium'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-zinc-400 text-sm">Status</span>
                  <span className="text-sm text-emerald-400 flex items-center gap-1">
                    <div className="w-2 h-2 mt-0.5 bg-emerald-400 rounded-full"></div>
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats and Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <Music className="w-4 h-4 text-emerald-400" />
                  <span className="text-2xl font-bold">{stats.totalSongs}</span>
                </div>
                <span className="text-zinc-400 text-sm">Songs</span>
              </div>
              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-blue-500 rounded" />
                  <span className="text-2xl font-bold">{stats.totalAlbums}</span>
                </div>
                <span className="text-zinc-400 text-sm">Albums</span>
              </div>
              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  <span className="text-2xl font-bold">{likedSongs.length}</span>
                </div>
                <span className="text-zinc-400 text-sm">Liked</span>
              </div>
              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="text-2xl font-bold">{stats.listeningTime}h</span>
                </div>
                <span className="text-zinc-400 text-sm">Hours</span>
              </div>
            </div>

            {/* Currently Playing */}
            {currentSong && (
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Music className="w-5 h-5 text-emerald-400" />
                  Currently Playing
                </h3>
                <div className="flex items-center gap-4">
                  <img 
                    src={currentSong.imageUrl} 
                    alt={currentSong.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{currentSong.title}</h4>
                    <p className="text-zinc-400 text-sm">{currentSong.artist}</p>
                    {isPlaying && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-emerald-400 text-xs">Playing</span>
                      </div>
                    )}
                    {!isPlaying && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-zinc-400 rounded-full"></div>
                        <span className="text-zinc-400 text-xs">Paused</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Favorite Genres */}
            {/* <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Favorite Genres
              </h3>
              <div className="flex flex-wrap gap-2">
                {stats.favoriteGenres.map((genre, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm border border-emerald-500/30"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div> */}

            {/* Recent Activity */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-b-0">
                    <div className="flex items-center gap-3">
                      {activity.icon ? (
                        <activity.icon className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <div className="w-4 h-4 bg-blue-500 rounded" />
                      )}
                      <div>
                        <p className="text-sm">
                          {activity.type === 'listen' && `Listened to "${activity.songTitle}"`}
                          {activity.type === 'like' && `Liked "${activity.songTitle}"`}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-400">{activity.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
