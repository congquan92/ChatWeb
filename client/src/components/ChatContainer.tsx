import { Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import toast from "react-hot-toast";

export default function ChatContainer() {
    const { messages, isMessagesLoading, getMessages, selectedUser, subscribeToMessages, unsubscribeFromMessages, deleteMessage } = useChatStore();
    const { authUser } = useAuthStore();
    const messageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getMessages(selectedUser?._id || "");

        subscribeToMessages();
        return () => {
            unsubscribeFromMessages();
        };
    }, [getMessages, selectedUser?._id, subscribeToMessages, unsubscribeFromMessages]);

    useEffect(() => {
        if (messageRef.current && messages) {
            messageRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleDelete = (messageId: string, receiverId: string) => {
        deleteMessage(messageId, receiverId);
    };

    const handleEdit = (messageId: string) => {
        try {
            toast.success("Đã chỉnh sửa tin nhắn" + messageId);
        } catch (err) {
            toast.error("Chỉnh sửa thất bại");
            console.error(err);
        }
    };

    if (isMessagesLoading) {
        return (
            <div className="container mx-auto flex justify-center items-center my-6">
                <Loader2 className="animate-spin size-16 text-blue-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-auto">
            <ChatHeader />
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                    const isMine = message.senderId === authUser?._id;
                    return (
                        <div key={message._id} className={`chat ${isMine ? "chat-end" : "chat-start"}`} ref={messageRef}>
                            <div className="chat-image avatar">
                                <div className="size-10 rounded-full border">
                                    <img src={isMine ? authUser?.profilePic || "/avatar.jpg" : selectedUser?.profilePic || "/avatar.jpg"} alt="profile pic" />
                                </div>
                            </div>
                            <div className="chat-header mb-1 flex items-center gap-1">
                                <time className="text-xs opacity-50 ml-1">{formatMessageTime(message.createdAt)}</time>
                            </div>

                            <div className="flex items-center justify-center gap-2">
                                {/* Nút ba chấm - chỉ hiện nếu là tin nhắn của mình */}
                                {isMine && (
                                    <div className="dropdown dropdown-end">
                                        <button tabIndex={0} className="btn btn-xs btn-ghost btn-circle">
                                            <MoreVertical size={16} />
                                        </button>
                                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-36">
                                            <li>
                                                <button onClick={() => handleEdit(message._id)}>
                                                    <Pencil size={14} /> Chỉnh sửa
                                                </button>
                                            </li>
                                            <li>
                                                <button className="text-red-500" onClick={() => handleDelete(message._id, message.receiverId)}>
                                                    <Trash2 size={14} /> Xóa
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                )}

                                <div className="chat-bubble flex flex-col">
                                    {message.image && <img src={message.image} alt="Attachment" className="sm:max-w-[200px] rounded-md mb-2" />}
                                    {message.text && <p>{message.text}</p>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <MessageInput />
        </div>
    );
}
