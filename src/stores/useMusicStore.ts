import { axiosInstance } from '@/lib/axios'
import { Album, Song, Stats } from '@/types'
import toast from 'react-hot-toast'
import {create} from 'zustand'


interface MusicStore {
  albums: Album[]
  songs: Song[]
  isLoading: boolean
  error: string | null

  currentAlbum: Album | null
  madeForYouSongs: Song[] 
  trendingSongs: Song[]
  featuredSongs: Song[]
  stats:Stats
  likedSongs: Song[]
  likedSongsLoading: boolean
  likedSongsInitialized: boolean

  fetchAlbums: () => Promise<void>
  fetchAlbumById: (id: string) => Promise<void>
  fetchMadeForYouSongs: () => Promise<void>
  fetchTrendingSongs: () => Promise<void>
  fetchFeaturedSongs: () => Promise<void>
  fetchStats: () => Promise<void>
  fetchSongs: () => Promise<void>
  deleteSong: (id: string) => Promise<void>
  deleteAlbum: (id: string) => Promise<void>
  assignSongsToAlbum: (albumId: string, songIds: string[]) => Promise<void>
  updateSong: (id: string, formData: FormData) => Promise<void>
  updateAlbum: (id: string, formData: FormData) => Promise<void>
  fetchLikedSongs: () => Promise<void>
  likeSong: (songId: string) => Promise<void>
  unlikeSong: (songId: string) => Promise<void>
}


const applyLikesToSongs = (songs: Song[], likedSet: Set<string>): Song[] =>
  songs.map((song) => ({ ...song, isLiked: likedSet.has(song._id) }));

const applyLikesToAlbum = (album: Album | null, likedSet: Set<string>): Album | null => {
  if (!album) return null;
  return {
    ...album,
    songs: applyLikesToSongs(album.songs, likedSet),
  };
};

const buildStateWithLikes = (state: MusicStore, likedSongs: Song[]) => {
  const likedSet = new Set(likedSongs.map((song) => song._id));
  return {
    likedSongs,
    madeForYouSongs: applyLikesToSongs(state.madeForYouSongs, likedSet),
    featuredSongs: applyLikesToSongs(state.featuredSongs, likedSet),
    trendingSongs: applyLikesToSongs(state.trendingSongs, likedSet),
    songs: applyLikesToSongs(state.songs, likedSet),
    currentAlbum: applyLikesToAlbum(state.currentAlbum, likedSet),
  };
};

const normalizeAlbumIds = (albumIds?: unknown): string[] => {
  if (!albumIds) return [];
  if (Array.isArray(albumIds)) {
    return albumIds
      .map((id) => {
        if (!id) return null;
        if (typeof id === "string") return id;
        if (typeof id === "object") {
          if ("_id" in (id as { _id?: string })) {
            return (id as { _id?: string })._id ?? null;
          }
          if (typeof (id as { toString?: () => string }).toString === "function") {
            return (id as { toString: () => string }).toString();
          }
          return null;
        }
        return String(id);
      })
      .filter((id): id is string => Boolean(id));
  }

  if (typeof albumIds === "string") {
    return [albumIds];
  }
  return [];
};

const withNormalizedAlbums = (songs: Song[]): Song[] =>
  songs.map((song) => ({
    ...song,
    albumIds: normalizeAlbumIds((song as any).albumIds),
  }));

export const useMusicStore = create<MusicStore>((set, get) => ({

  albums:[],
  songs:[],
  isLoading: false,
  error: null,
  currentAlbum: null,
  madeForYouSongs: [],
  trendingSongs: [],
  featuredSongs: [],
  stats: {
    totalSongs: 0,
    totalAlbums: 0,
    totalUsers: 0,
    totalArtists: 0
  },
  likedSongs: [],
  likedSongsLoading: false,
  likedSongsInitialized: false,


  fetchAlbums: async () => {
    set({
      isLoading: true,
      error: null
    })
    try {
      const response = await axiosInstance.get('/album')
      set({
        albums: response.data,
        error: null
      })
    } catch(error: any) {
      console.error('Error fetching albums:', error)
      set({
        error: error.response?.data?.message || 'Failed to fetch albums'
      })
    } finally {
      set({
        isLoading: false
      })
    }
  },


  fetchAlbumById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get<Album>(`/album/${id}`);
      const likedSet = new Set(get().likedSongs.map((song) => song._id));
      set({ currentAlbum: { ...data, songs: applyLikesToSongs(data.songs, likedSet) } });
    } catch (error: any) {
      console.error('Error fetching album:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch album' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchFeaturedSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get<Song[]>("/songs/featured");
      const likedSet = new Set(get().likedSongs.map((song) => song._id));
      set({ featuredSongs: applyLikesToSongs(data, likedSet) });
    } catch (error: any) {
      console.error('Error fetching featured songs:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch featured songs' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMadeForYouSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get<Song[]>("/songs/made-for-you");
      const likedSet = new Set(get().likedSongs.map((song) => song._id));
      set({ madeForYouSongs: applyLikesToSongs(data, likedSet) });
    } catch (error: any) {
      console.error('Error fetching made for you songs:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch made for you songs' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTrendingSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get<Song[]>("/songs/trending");
      const likedSet = new Set(get().likedSongs.map((song) => song._id));
      set({ trendingSongs: applyLikesToSongs(data, likedSet) });
    } catch (error: any) {
      console.error('Error fetching trending songs:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch trending songs' });
    } finally {
      set({ isLoading: false });
    }
  },



  // isSongLoading: false,
  // isStatsLoading: false,


  fetchSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get<Song[]>("/songs");
      const likedSet = new Set(get().likedSongs.map((song) => song._id));
      const normalized = withNormalizedAlbums(data);
      set({ songs: applyLikesToSongs(normalized, likedSet) });
    }
    catch{
      set({ error: 'Failed to fetch songs' });
    }
    finally {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try{
      const response = await axiosInstance.get("/stats");
      set({ stats: response.data });
    }
    catch{
      set({ error: 'Failed to fetch stats' });
    }
    finally {
      set({ isLoading: false });
    }
  },

  deleteSong: async (id) => {
		set({ isLoading: true, error: null });
		try {
			await axiosInstance.delete(`/admin/songs/${id}`);

			set((state) => ({
				songs: state.songs.filter((song) => song._id !== id),
			}));
			toast.success("Song deleted successfully");
		} catch (error: any) {
			toast.error("Error deleting song");
		} finally {
			set({ isLoading: false });
		}
	},

	deleteAlbum: async (id) => {
		set({ isLoading: true, error: null });
		try {
			await axiosInstance.delete(`/admin/albums/${id}`);
			set((state) => ({
				albums: state.albums.filter((album) => album._id !== id),
				songs: state.songs.map((song) => {
					if (!song.albumIds?.length) return song;
					const filtered = song.albumIds.filter((albumId) => albumId !== id);
					if (filtered.length === song.albumIds.length) return song;
					return { ...song, albumIds: filtered };
				}),
			}));
			toast.success("Album deleted successfully");
		} catch (error: any) {
			toast.error("Failed to delete album: " + error.message);
		} finally {
			set({ isLoading: false });
		}
	},

	assignSongsToAlbum: async (albumId, songIds) => {
		if (!songIds.length) {
			toast.error("Please select at least one song");
			return;
		}
		set({ isLoading: true, error: null });

		try {
			const { data } = await axiosInstance.post(`/admin/albums/${albumId}/songs`, {
				songIds,
			});
			const updatedAlbum = data.album;
			const updatedSongIdSet = new Set(songIds);
			set((state) => ({
				albums: state.albums.map((album) =>
					album._id === albumId ? { ...album, ...updatedAlbum } : album
				),
				songs: state.songs.map((song) => {
					if (!updatedSongIdSet.has(song._id)) return song;
					const albumIdsSet = new Set(song.albumIds ?? []);
					albumIdsSet.add(albumId);
					return { ...song, albumIds: Array.from(albumIdsSet) };
				}),
			}));
			toast.success("Songs added to album");
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Failed to assign songs");
		} finally {
			set({ isLoading: false });
		}
	},

	updateSong: async (id, formData) => {
		set({ isLoading: true, error: null });
		try {
			const { data } = await axiosInstance.put(`/admin/songs/${id}`, formData);
			const updatedSong = data.song as Song;
			const likedSet = new Set(get().likedSongs.map((song) => song._id));
			const songWithLike = {
        ...updatedSong,
        albumIds: normalizeAlbumIds((updatedSong as any).albumIds),
        isLiked: likedSet.has(updatedSong._id),
      };

			set((state) => {
				const updatedAlbums = state.albums.map((album) => {
					let songsChanged = false;
					let updatedAlbumSongs = album.songs;
					const containsSong = album.songs.some((song) => song._id === id);
					const shouldContain = songWithLike.albumIds?.includes(album._id) ?? false;

					if (containsSong && !shouldContain) {
						updatedAlbumSongs = album.songs.filter((song) => song._id !== id);
						songsChanged = true;
					}

					if (!containsSong && shouldContain) {
						updatedAlbumSongs = [...album.songs, songWithLike];
						songsChanged = true;
					}

					if (containsSong && shouldContain) {
						updatedAlbumSongs = album.songs.map((song) =>
							song._id === id ? songWithLike : song
						);
						songsChanged = true;
					}

					return songsChanged ? { ...album, songs: updatedAlbumSongs } : album;
				});
				return {
					songs: state.songs.map((song) => (song._id === id ? songWithLike : song)),

					albums: updatedAlbums,
				};
			});

			toast.success("Song updated successfully");
		} catch (error: any) {
			console.error("Failed to update song", error);
			toast.error(error.response?.data?.message || "Failed to update song");
		} finally {
			set({ isLoading: false });
		}
	},

	updateAlbum: async (id, formData) => {
		set({ isLoading: true, error: null });
		try {
			const { data } = await axiosInstance.put(`/admin/albums/${id}`, formData);
			const updatedAlbum = data.album as Album;
			set((state) => ({
				albums: state.albums.map((album) => (album._id === id ? { ...album, ...updatedAlbum } : album)),
			}));
			toast.success("Album updated successfully");
		} catch (error: any) {
			console.error("Failed to update album", error);
			toast.error(error.response?.data?.message || "Failed to update album");
		} finally {
			set({ isLoading: false });
		}
	},

	fetchLikedSongs: async () => {
		set({ likedSongsLoading: true });
		try {
			const { data } = await axiosInstance.get<Song[]>("/users/me/likes");
			set((state) => ({
				likedSongsLoading: false,
				likedSongsInitialized: true,
				...buildStateWithLikes(state, data),
			}));
		} catch (error: any) {
			console.error('Error fetching liked songs', error);
			toast.error(error.response?.data?.message || 'Failed to fetch liked songs');
			set({ likedSongsLoading: false, likedSongsInitialized: true });
		}
	},

	likeSong: async (songId) => {
		try {
			const { data } = await axiosInstance.post<Song[]>(`/users/me/likes/${songId}`);
			set((state) => ({
				likedSongsInitialized: true,
				...buildStateWithLikes(state, data),
			}));
		} catch (error: any) {
			console.error('Error liking song', error);
			toast.error(error.response?.data?.message || 'Failed to like song');
		}
	},

	unlikeSong: async (songId) => {
		try {
			const { data } = await axiosInstance.delete<Song[]>(`/users/me/likes/${songId}`);
			set((state) => ({
				likedSongsInitialized: true,
				...buildStateWithLikes(state, data),
			}));
		} catch (error: any) {
			console.error('Error unliking song', error);
			toast.error(error.response?.data?.message || 'Failed to unlike song');
		}
	},

}))