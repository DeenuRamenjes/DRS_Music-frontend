import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DownloadState {
  downloadQuality: 'low' | 'normal' | 'high';
  downloadOverWifi: boolean;
  autoDownload: boolean;
  setDownloadQuality: (quality: 'low' | 'normal' | 'high') => void;
  setDownloadOverWifi: (enabled: boolean) => void;
  setAutoDownload: (enabled: boolean) => void;
  getDownloadUrl: (audioUrl: string | { low?: string; normal?: string; high?: string }) => string;
}

const useDownloadStore = create<DownloadState>()(
  persist(
    (set, get) => ({
      downloadQuality: 'high',
      downloadOverWifi: true,
      autoDownload: false,

      setDownloadQuality: (quality: 'low' | 'normal' | 'high') =>
        set(() => ({
          downloadQuality: quality,
        })),

      setDownloadOverWifi: (enabled: boolean) =>
        set(() => ({
          downloadOverWifi: enabled,
        })),

      setAutoDownload: (enabled: boolean) =>
        set(() => ({
          autoDownload: enabled,
        })),

      getDownloadUrl: (audioUrl: string | { low?: string; normal?: string; high?: string }) => {
        const { downloadQuality } = get();
        
        // Return different quality URLs based on the setting
        if (typeof audioUrl === 'object' && audioUrl !== null) {
          switch (downloadQuality) {
            case 'low':
              return audioUrl.low || audioUrl.normal || audioUrl.high || '';
            case 'normal':
              return audioUrl.normal || audioUrl.high || audioUrl.low || '';
            case 'high':
            default:
              return audioUrl.high || audioUrl.normal || audioUrl.low || '';
          }
        } else {
          // Fallback to string audioUrl
          return audioUrl as string;
        }
      },
    }),
    {
      name: 'download:settings',
    }
  )
);

export default useDownloadStore;
