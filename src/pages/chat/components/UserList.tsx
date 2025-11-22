import UsersListSkeleton from "@/components/skeletons/UsersListSkelotons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/stores/useChatStore";

interface UserListProps {
  showNames?: boolean;
  className?: string;
  onUserSelected?: () => void;
}

const UserList = ({ showNames = false, className = "", onUserSelected }: UserListProps) => {
  const { users, selectedUser, isLoading, setSelectedUser, onlineUsers, userActivities, unreadCounts } = useChatStore();

  return (
    <div className={`border-r border-zinc-800 ${className}`}>
      <div className='flex flex-col h-full'>
        <ScrollArea className='h-[calc(100vh-280px)]'>
          <div className='space-y-2 p-4'>
            {isLoading ? (
              <UsersListSkeleton />
            ) : (
              users.map((user) => (
                <button
                  key={user._id}
                  onClick={() => {
                    setSelectedUser(user);
                    onUserSelected?.();
                  }}
                  className={`w-full flex items-center border border-white/20 gap-3 p-3 rounded-lg transition-colors ${
                    selectedUser?.clerkId === user.clerkId ? "bg-zinc-700" : "hover:bg-zinc-700/50"
                  }`}
                >
                  <div className='relative'>
                    <Avatar className='size-10 md:size-12'>
                      <AvatarImage src={user.imageUrl} />
                      <AvatarFallback>{user.name?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-zinc-900 ${
                        onlineUsers.has(user.clerkId) ? "bg-green-500" : "bg-zinc-500"
                      }`}
                    />
                  </div>

                  <div className={`flex min-w-0 items-center justify-between gap-2 ${showNames ? "flex" : "hidden lg:flex"}`}>
                    <div className='flex-1 min-w-0'>
                      <span className='font-medium truncate text-left text-sm md:text-base'>{user.name}</span>
                      {userActivities.has(user.clerkId) && (
                        <p className='text-xs text-zinc-400 truncate text-left'>
                          {userActivities.get(user.clerkId)}
                        </p>
                      )}
                    </div>
                    {unreadCounts[user.clerkId] ? (
                      <span className='inline-flex items-center justify-center min-w-5 px-1 text-[11px] font-semibold rounded-full bg-emerald-500 text-white'>
                        {unreadCounts[user.clerkId] > 9 ? "9+" : unreadCounts[user.clerkId]}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default UserList;