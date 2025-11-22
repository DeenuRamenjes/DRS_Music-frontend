import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";
import UsersList from "./components/UserList";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MessageInput from "./components/MessageInput";
import ChatHeader from "./components/ChatHeader";
import type { Message } from "@/types";


const formatTime = (date: string) => {
	return new Date(date).toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
};

const getInitial = (value?: string | null) => value?.trim()?.[0]?.toUpperCase() ?? "?";

const ChatPage = () => {
	const { user } = useUser();
	const { messages, selectedUser, fetchUsers, fetchMessages, setSelectedUser } = useChatStore();
	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (user) fetchUsers();
	}, [fetchUsers, user]);

	useEffect(() => {
		if (selectedUser) fetchMessages(selectedUser.clerkId);
	}, [selectedUser, fetchMessages]);

	useEffect(() => {
		if (!selectedUser) return;
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, selectedUser]);


	const showChatPanel = Boolean(selectedUser);

	return (
		<main className='h-full rounded-lg bg-gradient-to-b from-zinc-800 to-zinc-900 overflow-hidden'>
			{/* <h1 className="text-2xl font-bold text-white p-4">Messages</h1> */}
			<div className='h-[calc(100vh-180px)] lg:grid lg:grid-cols-[320px_1fr]'>
				<div className={`${showChatPanel ? "hidden lg:block" : "block"} h-full`}>
					<UsersList
						showNames
						className='border-none lg:border-r'
					/>
				</div>

				<div className={`${showChatPanel ? "flex" : "hidden"} h-full flex-col lg:flex`}>
					{selectedUser ? (
						<>
							<ChatHeader onBack={() => setSelectedUser(null)} />
							<ScrollArea className='h-[calc(100vh-320px)] lg:h-[calc(100vh-380px)]'>
								<div className='px-3 py-4 space-y-3'>
									{messages.map((message) => (
										<MessageBubble
											key={message._id}
											message={message}
											isOwn={message.senderId === user?.id}
											avatarUrl={
												message.senderId === user?.id ? user?.imageUrl ?? "" : selectedUser.imageUrl
											}
											fallbackText={
												message.senderId === user?.id
													? getInitial(user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress)
													: getInitial(selectedUser.name)
											}
											formattedTime={formatTime(message.createdAt)}
										/>
									))}
									<div ref={messagesEndRef} />
								</div>
							</ScrollArea>

							<div className='sticky bottom-0'>
								<MessageInput />
							</div>
						</>
					) : (
						<NoConversationPlaceholder />
					)}
				</div>
			</div>
		</main>
	);
}
export default ChatPage;

const NoConversationPlaceholder = () => (
	<div className='flex flex-col items-center justify-center h-full space-y-6 px-6 text-center'>
		<img src='/DRS.png' alt='DRS Music' className='size-16 animate-bounce' />
		<div>
			<h3 className='text-zinc-300 text-lg font-medium mb-1'>No conversation selected</h3>
			<p className='text-zinc-500 text-sm'>Choose a friend to start chatting</p>
		</div>
	</div>
);

interface MessageBubbleProps {
	message: Message;
	isOwn: boolean;
	avatarUrl: string;
	fallbackText: string;
	formattedTime: string;
}

const MessageBubble = ({ message, isOwn, avatarUrl, fallbackText, formattedTime }: MessageBubbleProps) => {
	return (
		<div
			className={`flex w-full gap-2 ${
				isOwn ? "justify-end" : "justify-start"
			}`}
		>
			{!isOwn && (
				<Avatar className='size-8 flex-shrink-0 shadow-md shadow-black/20'>
					<AvatarImage src={avatarUrl} alt='Sender avatar' />
					<AvatarFallback className='bg-zinc-700 text-xs font-semibold text-white'>
						{fallbackText}
					</AvatarFallback>
				</Avatar>
			)}
			<div className={`flex min-w-0 max-w-[80%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
				<div
					className={`group rounded-2xl px-4 py-2 text-sm shadow-lg shadow-black/20 transition-transform active:scale-[0.98]
						${
							isOwn
								? "bg-gradient-to-r from-emerald-500 to-emerald-400 text-white"
								: "bg-zinc-800 text-zinc-100"
						}
					`}
				>
					<p className='break-words leading-relaxed'>{message.content}</p>
				</div>
				<span
					className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide ${
						isOwn ? "bg-emerald-500/15 text-emerald-100" : "bg-white/5 text-zinc-300"
					}`}
				>
					{formattedTime}
				</span>
			</div>
			{isOwn && (
				<Avatar className='size-8 flex-shrink-0 shadow-md shadow-black/20'>
					<AvatarImage src={avatarUrl} alt='Sender avatar' />
					<AvatarFallback className='bg-emerald-600 text-xs font-semibold text-white'>
						{fallbackText}
					</AvatarFallback>
				</Avatar>
			)}
		</div>
	);
};
