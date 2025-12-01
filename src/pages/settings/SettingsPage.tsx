import { useUser, useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { User, Volume2, Download, LogOut, AlertTriangle, X, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { axiosInstance } from '@/lib/axios';
import toast from 'react-hot-toast';
import usePlayerStore from '@/store/usePlayerStore';
import useDownloadStore from '@/store/useDownloadStore';
import useDisplayStore from '@/store/useDisplayStore';

const SettingsPage = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { audioQuality, setAudioQuality, crossfade, toggleCrossfade } = usePlayerStore();
  const { 
    downloadQuality, 
    setDownloadQuality, 
    downloadOverWifi, 
    setDownloadOverWifi, 
    autoDownload, 
    setAutoDownload 
  } = useDownloadStore();
  const { 
    theme, 
    setTheme, 
    accentColor, 
    setAccentColor, 
    compactMode, 
    setCompactMode, 
    layout, 
    setLayout 
  } = useDisplayStore();
  
  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    newReleases: true,
    friendActivity: true,
    
    // Privacy
    profileVisibility: 'public',
    showListeningActivity: true,
    allowFriendRequests: true,
    
    // Audio
    audioQuality: 'high',
    crossfade: true,
    gaplessPlayback: true,
    normalizeVolume: false,
    
    // Appearance
    theme: 'dark',
    accentColor: 'emerald',
    compactMode: false,
    layout: 'default',
    
    // Downloads
    downloadQuality: 'high',
    downloadOverWifi: true,
    autoDownload: false,
  });

  // Sync audio quality, crossfade, download settings, and display settings with stores
  useEffect(() => {
    setSettings(prev => ({ 
      ...prev, 
      audioQuality,
      crossfade,
      downloadQuality,
      downloadOverWifi,
      autoDownload,
      theme,
      accentColor,
      compactMode,
      layout
    }));
  }, [audioQuality, crossfade, downloadQuality, downloadOverWifi, autoDownload, theme, accentColor, compactMode, layout]);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // If audio quality is changed, update the player store
    if (key === 'audioQuality') {
      setAudioQuality(value);
    }
    
    // If crossfade is changed, update the player store
    if (key === 'crossfade') {
      // Make sure the value matches the toggle
      if (value !== crossfade) {
        toggleCrossfade();
      }
    }
    
    // If download quality is changed, update the download store
    if (key === 'downloadQuality') {
      setDownloadQuality(value);
    }
    
    // If download over Wi-Fi is changed, update the download store
    if (key === 'downloadOverWifi') {
      setDownloadOverWifi(value);
    }
    
    // If auto download is changed, update the download store
    if (key === 'autoDownload') {
      setAutoDownload(value);
    }
    
    // If theme is changed, update the display store
    if (key === 'theme') {
      setTheme(value);
    }
    
    // If accent color is changed, update the display store
    if (key === 'accentColor') {
      setAccentColor(value);
    }
    
    // If compact mode is changed, update the display store
    if (key === 'compactMode') {
      setCompactMode(value);
    }
    
    // If layout is changed, update the display store
    if (key === 'layout') {
      setLayout(value);
    }
  };
  const handleSignOut = async () => {
    await signOut();
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await axiosInstance.delete('/users/me');
       
      if (user) {
        await user.delete();
      }
       
      toast.success('Account deleted successfully');
       
      window.location.href = '/landing';
    } catch (error: any) {
      console.error('Error deleting account:', error);
       
      if (user && error.response?.status !== 404) {
        try {
          await user.delete();
          toast.success('Account deleted from authentication');
          window.location.href = '/landing';
        } catch (clerkError) {
          toast.error('Failed to delete account from both database and authentication');
        }
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete account');
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const closeDeleteDialog = () => {
    setShowDeleteConfirm(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">Please sign in to access settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white p-4 sm:p-6 lg:p-8 overflow-y-auto h-full custom-scrollbar [scrollbar-width:none] [-ms-overflow-style:'none'] [&::-webkit-scrollbar]:hidden">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Settings</h1>
          <p className="text-zinc-400">Manage your account settings and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Account Settings */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" />
              Account
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-zinc-400">Permanently delete your account and data</p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                >
                  Delete
                </Button>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Sign Out</p>
                  <p className="text-sm text-zinc-400">Sign out of your account</p>
                </div>
                <Button 
                  onClick={handleSignOut}
                  variant="outline"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
          {/* Audio Settings */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-emerald-400" />
              Audio
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Audio Quality</p>
                  <p className="text-sm text-zinc-400">Higher quality uses more data</p>
                </div>
                <select 
                  value={settings.audioQuality}
                  onChange={(e) => handleSettingChange('audioQuality', e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1 text-sm"
                >
                  <option value="low">Low (96kbps)</option>
                  <option value="normal">Normal (160kbps)</option>
                  <option value="high">High (320kbps)</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Crossfade</p>
                  <p className="text-sm text-zinc-400">Smooth transition between songs</p>
                </div>
                <button
                  onClick={() => handleSettingChange('crossfade', !settings.crossfade)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.crossfade ? 'bg-emerald-600' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.crossfade ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-emerald-400" />
              Display
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Accent Color</p>
                  <p className="text-sm text-zinc-400">Customize the interface colors</p>
                </div>
                <select 
                  value={settings.accentColor}
                  onChange={(e) => handleSettingChange('accentColor', e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1 text-sm"
                >
                  <option value="emerald">Emerald</option>
                  <option value="blue">Blue</option>
                  <option value="purple">Purple</option>
                  <option value="pink">Pink</option>
                  <option value="orange">Orange</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Compact Mode</p>
                  <p className="text-sm text-zinc-400">Reduce UI spacing for more content</p>
                </div>
                <button
                  onClick={() => handleSettingChange('compactMode', !settings.compactMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.compactMode ? 'bg-emerald-600' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.compactMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Download Settings */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" />
              Downloads
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Download Quality</p>
                  <p className="text-sm text-zinc-400">Higher quality uses more storage</p>
                </div>
                <select 
                  value={settings.downloadQuality}
                  onChange={(e) => handleSettingChange('downloadQuality', e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1 text-sm"
                >
                  <option value="low">Low (96kbps)</option>
                  <option value="normal">Normal (160kbps)</option>
                  <option value="high">High (320kbps)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-red-400">Delete Account</h3>
              <button
                onClick={closeDeleteDialog}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-400 font-medium mb-2">⚠️ This action cannot be undone</p>
                  <p className="text-sm text-zinc-300 mb-3">
                    This will permanently delete your account and all associated data including:
                  </p>
                  <ul className="text-sm text-zinc-400 space-y-1 mb-3">
                    <li>• Your profile information</li>
                    <li>• Liked songs and playlists</li>
                    <li>• Listening history</li>
                    <li>• All app data and preferences</li>
                  </ul>
                  <p className="text-sm text-zinc-300">
                    Are you sure you want to proceed?
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={closeDeleteDialog}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete Account"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
