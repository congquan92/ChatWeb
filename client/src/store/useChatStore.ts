import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

interface User {
    _id: string;
    fullname: string;
    email: string;
    profilePic: string;
    createdAt: string;
    updatedAt: string;
}

interface ChatStore {
    messages: Array<any>;
    users: Array<User>;
    selectedUser: User | null;
    isMessagesLoading: boolean;
    isUserLoading: boolean;
    getUsers: () => Promise<void>;
    getMessages: (userId: string) => Promise<void>;
    setSelectedUser: (user: User | null) => void;
    // sendMessage: (messageData: { text: string; image: string | null }) => Promise<void>;
    sendMessage: (form: FormData) => Promise<void>;
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

    // optimize later
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
}));
