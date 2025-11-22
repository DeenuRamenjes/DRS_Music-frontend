import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/useChatStore";
import { ArrowLeft } from "lucide-react";

interface ChatHeaderProps {
	onBack?: () => void;
}

const ChatHeader = ({ onBack }: ChatHeaderProps) => {

	const { selectedUser, onlineUsers } = useChatStore();

	if (!selectedUser) return null;

	return (
		<div className='p-4 border-b border-zinc-800 flex items-center gap-3'>
			{onBack && (
				<Button
					variant='ghost'
					size='icon'
					onClick={onBack}
					className='lg:hidden'
					aria-label='Back to user list'
				>
					<ArrowLeft className='h-5 w-5' />
				</Button>
			)}
			<Avatar>
				<AvatarImage src={selectedUser?.imageUrl} />
				<AvatarFallback>{selectedUser?.name[0]}</AvatarFallback>
			</Avatar>
			<div>
				<h2 className='font-medium'>{selectedUser?.name}</h2>
				<p className='text-sm text-zinc-400'>
					{onlineUsers.has(selectedUser.clerkId) ? "Online" : "Offline"}
				</p>
			</div>
		</div>
	);
};

export default ChatHeader;