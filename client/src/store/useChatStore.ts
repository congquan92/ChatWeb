import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

interface User {
    _id: string;
    fullname: string;
    email: string;
    profilePic: string;
    createdAt: string;
    updatedAt: string;
}

interface Message {
    _id: string;
    senderId: string;
    receiverId: string;
    text?: string;
    image?: string;
    createdAt: string;
    updatedAt: string;
}

interface ChatStore {
    messages: Array<Message>;
    users: Array<User>;
    selectedUser: User | null;
    isMessagesLoading: boolean;
    isUserLoading: boolean;
    getUsers: () => Promise<void>;
    getMessages: (userId: string) => Promise<void>;
    setSelectedUser: (user: User | null) => void;
    // sendMessage: (messageData: { text: string; image: string | null }) => Promise<void>;
    sendMessage: (form: FormData) => Promise<void>;
    subscribeToMessages: () => void;
    unsubscribeFromMessages: () => void;
    deleteMessage: (messageId: string, receiverId: string) => Promise<void>;
    editMessage: (messageId: string, receiverId: string, text: string) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isMessagesLoading: false,
    isUserLoading: false,

    getUsers: async () => {
        set({ isUserLoading: true });
        try {
            const res = await axiosInstance.get("/messages/users");
            set({ users: res.data });
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users. Please try again.");
        } finally {
            set({ isUserLoading: false });
        }
    },

    getMessages: async (userId: string) => {
        set({ isMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({ messages: res.data });
        } catch (error) {
            console.error("Error fetching messages:", error);
            toast.error("Failed to load messages. Please try again.");
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    setSelectedUser: (selectedUser) => set({ selectedUser }),

    // sendMessage: async (messageData) => {
    //     const { selectedUser, messages } = get();
    //     try {
    //         const res = await axiosInstance.post(`/messages/send/${selectedUser?._id}`, messageData);
    //         set({ messages: [...messages, res.data] });
    //     } catch (error) {
    //         console.error("Error sending message:", error);
    //         // toast.error("Failed to send message. Please try again.");
    //     }
    // },
    sendMessage: async (form: FormData) => {
        const { selectedUser } = get();
        if (!selectedUser?._id) {
            toast.error("No conversation selected");
            return;
        }
        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, form);
            const newMsg = res.data; // server trả về 1 message object

            set((state) => ({
                messages: [...(state.messages ?? []), newMsg],
            }));
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Failed to send message. Please try again.");
        }
    },

    subscribeToMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;
        const socket = useAuthStore.getState().socket;

        socket?.on("newMessage", (message) => {
            const isMessSentByAuthUser = message.senderId === selectedUser._id;
            if (!isMessSentByAuthUser) return; // chỉ nhận message từ user đang chat
            set((state) => ({
                messages: [...(state.messages ?? []), message],
            }));
        });
        // 2. nhận sự kiện xóa từ server bắt render giao diện cho người nhận (read more :https://docs.google.com/document/d/1uTVC5umL_rOf7Vvud9WZsB4JYNTYlcqBORrhNDlfsaE/edit?usp=drive_link)

        socket?.on("deleteMessage", (messageId) => {
            set((state) => ({
                messages: state.messages.filter((msg) => msg._id !== messageId),
            }));
            toast.success("1 message was deleted");
        });

        socket?.on("editMessage", ({ messageId, newText }) => {
            console.log("Received editMessage event:", { messageId, newText });
            set((state) => ({
                messages: state.messages.map((msg) => (msg._id === messageId ? { ...msg, text: newText } : msg)),
            }));
            toast.success("1 message was edited");
        });
    },

    unsubscribeFromMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;
        const socket = useAuthStore.getState().socket;
        socket?.off("newMessage");
    },

    deleteMessage: async (messageId: string, receiverId: string) => {
        const { messages } = get();
        try {
            // 1. render giao diện lập tức cho người xóa (trong lúc đó gửi yêu cầu xóa lên server) // read more : https://docs.google.com/document/d/1uTVC5umL_rOf7Vvud9WZsB4JYNTYlcqBORrhNDlfsaE/edit?usp=drive_link
            await axiosInstance.delete(`/messages/delete/${messageId}/${receiverId}`);
            const updatedMessages = messages.filter((msg) => msg._id !== messageId); // lọc ( đọc thêm về filter vs map )
            set({ messages: updatedMessages });
            toast.success("Message deleted successfully");
        } catch (error) {
            console.error("Error deleting message:", error);
            toast.error("Failed to delete message. Please try again.");
        }
    },

    editMessage: async (messageId: string, receiverId: string, text: string) => {
        const { messages } = get();
        try {
            const res = await axiosInstance.put(`/messages/edit/${messageId}/${receiverId}`, { text });
            const updatedMessage = res.data;
            const updatedMessages = messages.map((msg) => (msg._id === messageId ? updatedMessage : msg));
            set({ messages: updatedMessages });
            toast.success("Message edited successfully");
        } catch (error) {
            console.error("Error editing message:", error);
            toast.error("Failed to edit message. Please try again.");
        }
    },
}));
