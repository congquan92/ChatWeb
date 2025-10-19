import { Loader2 } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

export default function ChatContainer() {
    const { messages, isMessagesLoading, getMessages, selectedUser, subscribeToMessages, unsubscribeFromMessages } = useChatStore();
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
                {messages.map((message) => (
                    <div key={message._id} className={`chat ${message.senderId === authUser?._id ? "chat-end" : "chat-start"}`} ref={messageRef}>
                        <div className=" chat-image avatar">
                            <div className="size-10 rounded-full border">
                                <img src={message.senderId === authUser?._id ? authUser?.profilePic || "/avatar.jpg" : selectedUser?.profilePic || "/avatar.jpg"} alt="profile pic" />
                            </div>
                        </div>
                        <div className="chat-header mb-1">
                            <time className="text-xs opacity-50 ml-1">{formatMessageTime(message.createdAt)}</time>
                        </div>
                        <div className="chat-bubble flex flex-col">
                            {message.image && <img src={message.image} alt="Attachment" className="sm:max-w-[200px] rounded-md mb-2" />}
                            {message.text && <p>{message.text}</p>}
                        </div>
                    </div>
                ))}
            </div>
            <MessageInput />
        </div>
    );
}
