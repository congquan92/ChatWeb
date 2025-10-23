import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { encryptMessage, decryptMessage, getPrivateKeyFromIndexedDB } from "../lib/encryption";

interface User {
    _id: string;
    fullname: string;
    email: string;
    profilePic: string;
    publicKey: string; // Thêm publicKey
    createdAt: string;
    updatedAt: string;
}

interface Message {
    _id: string;
    senderId: string;
    receiverId: string;
    text?: string;
    image?: string;
    encryptedAESKey?: string; // Thêm encrypted AES key
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
            const encryptedMessages = res.data;

            // Giải mã tin nhắn trước khi lưu vào state
            const authUser = useAuthStore.getState().authUser;
            if (!authUser) {
                set({ messages: encryptedMessages });
                return;
            }

            const privateKey = await getPrivateKeyFromIndexedDB(authUser._id);
            if (!privateKey) {
                console.warn("No private key found, messages will not be decrypted");
                set({ messages: encryptedMessages });
                return;
            }

            const decryptedMessages = encryptedMessages.map((msg: Message) => {
                if (msg.text && msg.encryptedAESKey) {
                    try {
                        const decryptedText = decryptMessage(msg.text, msg.encryptedAESKey, privateKey);
                        return { ...msg, text: decryptedText };
                    } catch (error) {
                        console.error("Failed to decrypt message:", error);
                        return { ...msg, text: "[Encrypted message]" };
                    }
                }
                return msg;
            });

            set({ messages: decryptedMessages });
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

        const authUser = useAuthStore.getState().authUser;
        if (!authUser) {
            toast.error("Not authenticated");
            return;
        }

        try {
            const text = form.get("text") as string;

            // Mã hóa text nếu có
            if (text && text.trim()) {
                const { encryptedMessage, encryptedAESKey } = encryptMessage(text.trim(), selectedUser.publicKey);

                // Thay thế text bằng encrypted text
                form.set("text", encryptedMessage);
                form.set("encryptedAESKey", encryptedAESKey);
            }

            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, form);
            const newMsg = res.data;

            // Giải mã tin nhắn trước khi hiển thị
            if (newMsg.text && newMsg.encryptedAESKey) {
                const privateKey = await getPrivateKeyFromIndexedDB(authUser._id);
                if (privateKey) {
                    try {
                        newMsg.text = decryptMessage(newMsg.text, newMsg.encryptedAESKey, privateKey);
                    } catch (error) {
                        console.error("Failed to decrypt sent message:", error);
                    }
                }
            }

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

        socket?.on("newMessage", async (message) => {
            const isMessSentByAuthUser = message.senderId === selectedUser._id;
            if (!isMessSentByAuthUser) return;

            // Giải mã tin nhắn nhận được
            const authUser = useAuthStore.getState().authUser;
            if (authUser && message.text && message.encryptedAESKey) {
                const privateKey = await getPrivateKeyFromIndexedDB(authUser._id);
                if (privateKey) {
                    try {
                        message.text = decryptMessage(message.text, message.encryptedAESKey, privateKey);
                    } catch (error) {
                        console.error("Failed to decrypt received message:", error);
                        message.text = "[Encrypted message]";
                    }
                }
            }

            set((state) => ({
                messages: [...(state.messages ?? []), message],
            }));
        });

        socket?.on("deleteMessage", (messageId) => {
            set((state) => ({
                messages: state.messages.filter((msg) => msg._id !== messageId),
            }));
            toast.success("1 message was deleted");
        });

        socket?.on("editMessage", async ({ messageId, newText, encryptedAESKey }) => {
            console.log("Received editMessage event:", { messageId, newText });

            // Giải mã text đã chỉnh sửa
            let decryptedText = newText;
            const authUser = useAuthStore.getState().authUser;
            if (authUser && encryptedAESKey) {
                const privateKey = await getPrivateKeyFromIndexedDB(authUser._id);
                if (privateKey) {
                    try {
                        decryptedText = decryptMessage(newText, encryptedAESKey, privateKey);
                    } catch (error) {
                        console.error("Failed to decrypt edited message:", error);
                        decryptedText = "[Encrypted message]";
                    }
                }
            }

            set((state) => ({
                messages: state.messages.map((msg) => (msg._id === messageId ? { ...msg, text: decryptedText } : msg)),
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
        const { messages, selectedUser } = get();
        const authUser = useAuthStore.getState().authUser;

        if (!authUser || !selectedUser) {
            toast.error("Not authenticated");
            return;
        }

        try {
            // Mã hóa text mới
            const { encryptedMessage, encryptedAESKey } = encryptMessage(text, selectedUser.publicKey);

            const res = await axiosInstance.put(`/messages/edit/${messageId}/${receiverId}`, {
                text: encryptedMessage,
                encryptedAESKey: encryptedAESKey,
            });

            const updatedMessage = res.data;

            // Giải mã để hiển thị
            if (updatedMessage.text && updatedMessage.encryptedAESKey) {
                const privateKey = await getPrivateKeyFromIndexedDB(authUser._id);
                if (privateKey) {
                    try {
                        updatedMessage.text = decryptMessage(updatedMessage.text, updatedMessage.encryptedAESKey, privateKey);
                    } catch (error) {
                        console.error("Failed to decrypt edited message:", error);
                    }
                }
            }

            const updatedMessages = messages.map((msg) => (msg._id === messageId ? updatedMessage : msg));
            set({ messages: updatedMessages });
            toast.success("Message edited successfully");
        } catch (error) {
            console.error("Error editing message:", error);
            toast.error("Failed to edit message. Please try again.");
        }
    },
}));
