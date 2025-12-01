export interface Song {
	_id: string;
	title: string;
	artist: string;
	albumIds?: string[];
	imageUrl: string;
	audioUrl: string | {
		low?: string;
		normal?: string;
		high?: string;
	};
	duration: number;
	createdAt: string;
	updatedAt: string;
	isLiked?: boolean;
}

export interface Album {
	_id: string;
	title: string;
	artist: string;
	imageUrl: string;
	releaseYear: number;
	songs: Song[];
}

export interface Stats {
	totalSongs: number;
	totalAlbums: number;
	totalUsers: number;
	totalArtists: number;
}

export interface Message {
	_id: string;
	senderId: string;
	receiverId: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}

export interface User {
	_id: string;
	clerkId: string;
	name: string;
	imageUrl: string;
}

export interface Todo {
	_id: string;
	title: string;
	description?: string;
	completed: boolean;
	priority: 'low' | 'medium' | 'high';
	category: 'general' | 'music' | 'backend' | 'frontend' | 'bug' | 'feature';
	createdBy: string;
	createdAt: string;
	updatedAt: string;
}

export interface TodoStats {
	total: number;
	completed: number;
	pending: number;
	highPriority: number;
	completionRate: number;
	categoryStats: Array<{
		_id: string;
		count: number;
		completed: number;
	}>;
}

export interface TodoFilters {
	completed?: boolean;
	priority?: string;
	category?: string;
	page?: number;
	limit?: number;
}
