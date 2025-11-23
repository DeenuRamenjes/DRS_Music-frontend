import { axiosInstance } from "@/lib/axios";
import { Message, User } from "@/types";
import { create } from "zustand";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import React from "react";

interface ChatStore {
	users: User[];
	isLoading: boolean;
	error: string | null;
	socket:any
	isConnected: boolean
	onlineUsers:Set<String>
	userActivities:Map<String,String>
	messages:Message[]
	selectedUser: User | null
	unreadCounts: Record<string, number>
	isChatPageActive: boolean

	fetchUsers: () => Promise<void>;
	initSocket:(userId:string)=>void
	disconnectSocket:()=>void
	sendMessage:(receiverId:string,senderId:string,content:string)=>void
	fetchMessages:(userId:string)=>Promise<void>	
	setSelectedUser:(user: User | null) => void
	setChatPageActive:(isActive:boolean)=>void
}

interface BroadcastNotificationPayload {
	id: string;
	title?: string;
	message: string;
	imageUrl?: string;
	link?: string;
	createdAt: string;
}

const baseUrl = import.meta.env.MODE === "development" ? "http://localhost:5000" : "https://drs-music-backend.onrender.com/";

const socket = io(baseUrl, {
	autoConnect: false,
	withCredentials: true,
});

const requestNotificationPermission = async () => {
	if (typeof window === "undefined" || !("Notification" in window)) return;
	if (Notification.permission === "default") {
		try {
			await Notification.requestPermission();
		} catch (error) {
		}
	} 
};

const showBroadcastNotification = (payload: BroadcastNotificationPayload) => {
	if (typeof window === "undefined") {
		return;
	}
	const title = payload.title?.trim() || "Announcement";
	const body = payload.message;
	toast.custom(
		(t) =>
			React.createElement(
				"div",
				{
					className:
						"cursor-pointer rounded-lg border border-emerald-500/30 bg-zinc-900/95 px-4 py-3 text-sm text-zinc-100 shadow-lg",
					onClick: () => {
						if (payload.link) {
							window.open(payload.link, "_blank", "noopener,noreferrer");
						}
						toast.dismiss(t.id);
					},
				},
				[
					React.createElement(
						"p",
						{ key: "title", className: "font-semibold text-emerald-300" },
						title
					),
					React.createElement(
						"p",
						{ key: "body", className: "mt-1 text-zinc-300" },
						body
					),
					payload.link
						? React.createElement(
							"p",
							{ key: "cta", className: "mt-2 text-xs uppercase tracking-wide text-emerald-400" },
							"Tap to open link"
						  )
						: null,
				]
			),
		{ duration: 6000 }
	);

	if (typeof Notification !== "undefined" && Notification.permission === "granted") {
		const notification = new Notification(title, {
			body,
			icon: payload.imageUrl,
			tag: `broadcast-${payload.id}`,
		});
		if (payload.link) {
			notification.onclick = () => {
				window.focus();
				window.open(payload.link!, "_blank", "noopener,noreferrer");
			};
		}
		setTimeout(() => notification.close(), 50000);
	}
};

const showIncomingNotification = (message: Message, users: User[], activeUser: User | null) => {
	if (typeof window === "undefined" || typeof document === "undefined") return;
	const isActiveChat = activeUser?.clerkId === message.senderId && document.visibilityState === "visible";
	if (isActiveChat) return;
	const sender = users.find((user) => user.clerkId === message.senderId);
	const title = sender?.name ?? "New message";
	const icon = sender?.imageUrl;
	const body = message.content;

	if ("Notification" in window && Notification.permission === "granted") {
		new Notification(title, {
			body,
			icon,
		});
		return;
	}

	toast(title ? `${title}: ${body}` : body, {
		icon: "💬",
	});
};

export const useChatStore = create<ChatStore>((set,get) => ({
	users: [],
	isLoading: false,
	error: null,
	socket:socket,
	isConnected: false,
	onlineUsers:new Set(),
	userActivities:new Map(),
	messages:[],
	selectedUser:null,
	unreadCounts: {},
	isChatPageActive: false,

	fetchUsers: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/users");
			set({ users: response.data });
		} catch (error: any) {
			set({ error: error.response.data.message });
		} finally {
			set({ isLoading: false });
		}
	},

	initSocket: (userId: string) => {
		if(!get().isConnected){
			socket.auth = { userId };
			socket.connect();
			socket.emit("user_connected", userId);
			requestNotificationPermission();
			
			socket.on("connect", () => {
				set({ isConnected: true });
			});

			socket.on("disconnect", () => {
				set({ isConnected: false });
			});

			socket.on("users_online", (users:string[]) => {
				set({ onlineUsers: new Set(users) });
			});
			
			socket.on("activities",(activities:[string,string][])=>{
				set({ userActivities: new Map(activities) });
			});

			socket.on("user_connected", (userId: string) => {
				set((state) => ({
					onlineUsers: new Set([...state.onlineUsers, userId]),
				}));
			});

			socket.on("user_disconnected", (userId: string) => {
				set((state) => {
					const newOnlineUsers = new Set(state.onlineUsers);
					newOnlineUsers.delete(userId);
					return { onlineUsers: newOnlineUsers };
				});
			});

			// Handle incoming messages
			socket.on("receive_message", (message: Message) => {
				const state = get();
				const { selectedUser } = state;
				const conversationActive =
					selectedUser &&
					(message.senderId === selectedUser.clerkId || message.receiverId === selectedUser.clerkId);
				if (conversationActive) {
					set((prev) => ({
						messages: [...prev.messages, message],
					}));
				}

				const onChatPage = state.isChatPageActive;
				const docHidden = typeof document !== "undefined" && document.visibilityState === "hidden";
				if (!conversationActive || !onChatPage) {
					set((prev) => {
						const nextCounts = { ...prev.unreadCounts };
						nextCounts[message.senderId] = (nextCounts[message.senderId] ?? 0) + 1;
						return { unreadCounts: nextCounts };
					});
				}

				if (!onChatPage || docHidden) {
					showIncomingNotification(message, state.users, state.selectedUser);
				}
			});

			socket.on("broadcast_notification", (payload: BroadcastNotificationPayload) => {
				console.log("Received broadcast_notification:", payload);
				showBroadcastNotification(payload);
			});

			// Handle sent messages - update immediately for sender
			socket.on("message_sent", (message: Message) => {
				const currentUser = get().selectedUser;
				if (currentUser && (message.senderId === currentUser.clerkId || message.receiverId === currentUser.clerkId)) {
					set((state) => {
						// Check if message already exists to avoid duplicates
						const messageExists = state.messages.some(m => m._id === message._id);
						if (!messageExists) {
							return {
								messages: [...state.messages, message],
							};
						}
						return state;
					});
				}
			});

			socket.on("activity_updated", ({ userId, activity }) => {
				set((state) => {
					const newActivities = new Map(state.userActivities);
					newActivities.set(userId, activity);
					return { userActivities: newActivities };
				});
			});

			socket.on("error", (error: string) => {
				toast.error(error);
			});
		}
	},

	disconnectSocket: () => {
		if (get().isConnected) {
			socket.disconnect();
			set({ isConnected: false });
		}
	},

	sendMessage: async (receiverId, senderId, content) => {
		const socket = get().socket;
		if (!socket) return;

		try {
			// Create a temporary message object for immediate UI update
			const tempMessage: Message = {
				_id: Date.now().toString(), // Temporary ID
				senderId,
				receiverId,
				content,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};

			// Update UI immediately for sender
			set((state) => ({
				messages: [...state.messages, tempMessage],
			}));

			// Send message to server
			socket.emit("send_message", { receiverId, senderId, content });
		} catch (error) {
			console.error("Error sending message:", error);
			toast.error("Failed to send message");
		}
	},

	fetchMessages: async (userId: string) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get(`/users/messages/${userId}`);
			set({ messages: response.data });
		} catch (error: any) {
			set({ error: error.response.data.message });
		} finally {
			set({ isLoading: false });
		}
	},

	setSelectedUser: (user) => {
		set((state) => {
			if (!user) return { selectedUser: null };
			const nextCounts = { ...state.unreadCounts };
			if (nextCounts[user.clerkId]) {
				delete nextCounts[user.clerkId];
			}
			return { selectedUser: user, unreadCounts: nextCounts };
		});
	},

	setChatPageActive: (isActive) => {
		set({ isChatPageActive: isActive });
	},
}));
