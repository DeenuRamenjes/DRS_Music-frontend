import { useEffect, useState } from "react";
import { Album, Music, CheckSquare } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import AudioPlayer from "@/components/AudioPlayer";
import PlaybackControls from "@/layout/component/PlaybackControls";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMusicStore } from "@/stores/useMusicStore";

import AlbumsTabContent from "./component/AlbumsTabContent";
import DashboardStats from "./component/DashboardStats";
import ForbiddenPage from "./component/ForbiddenMessage";
import Header from "./component/Header";
import SongsTabContent from "./component/SongsTabContent";
import BroadcastNotificationCard from "./component/BroadcastNotificationCard";
import { TodoList } from "./component/TodoList";


const AdminPage = () => {
	const { isAdmin, isLoading } = useAuthStore();

	const { fetchAlbums, fetchSongs, fetchStats } = useMusicStore();
	const [showBroadcastCard, setShowBroadcastCard] = useState(false);

	useEffect(() => {
		fetchAlbums();
		fetchSongs();
		fetchStats();
	}, [fetchAlbums, fetchSongs, fetchStats]);

	if (!isAdmin && !isLoading) return <ForbiddenPage />

	return (
		<div className='h-dvh bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-zinc-100 flex flex-col relative'>
			<AudioPlayer />
			<div className='flex-1 p-6 md:p-8 pb-40 overflow-y-auto '>
				<Header />

				<DashboardStats />

				<Tabs defaultValue='songs' className='space-y-6'>
					<TabsList className='p-1 bg-zinc-800/50 flex flex-wrap gap-2 mb-12'>
						<TabsTrigger value='songs' className='data-[state=active]:bg-zinc-700'>
							<Music className='mr-2 size-4' />
							Songs
						</TabsTrigger>
						<TabsTrigger value='albums' className='data-[state=active]:bg-zinc-700'>
							<Album className='mr-2 size-4' />
							Albums
						</TabsTrigger>
						<TabsTrigger value='todos' className='data-[state=active]:bg-zinc-700'>
							<CheckSquare className='mr-2 size-4' />
							Todos
						</TabsTrigger>
						<Button
							type='button'
							variant='secondary'
							size='sm'
							className='ml-auto'
							onClick={() => setShowBroadcastCard((prev) => !prev)}
							>
							{showBroadcastCard ? "Hide Notification" : "Show Notification"}
						</Button>
					</TabsList>

					{showBroadcastCard && <BroadcastNotificationCard />}
					<TabsContent value='songs'>
						<SongsTabContent />
					</TabsContent>
					<TabsContent value='albums'>
						<AlbumsTabContent />
					</TabsContent>
					<TabsContent value='todos'>
						<TodoList />
					</TabsContent>
				</Tabs>
			</div>
			<div className='sticky bottom-0 left-0 right-0 z-40 mt-auto'>
				<PlaybackControls />
			</div>
		</div>
	);
};
export default AdminPage;
