import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";
import { savePrivateKeyToIndexedDB, deletePrivateKeyFromIndexedDB } from "../lib/encryption";

interface AuthUser {
    _id: string;
    fullname: string;
    email: string;
    profilePic: string;
    publicKey: string; // Thêm publicKey
    createdAt: string;
    updatedAt: string;
}

interface AuthStore {
    authUser: AuthUser | null;
    isSigningUp: boolean;
    isLoggingIn: boolean;
    isUpdatingProfile: boolean;
    isCheckingAuth: boolean;
    checkAuth: () => Promise<void>;
    signup: (data: { fullname: string; email: string; password: string }) => Promise<void>;
    logout: () => Promise<void>;
    login: (data: { email: string; password: string }) => Promise<void>;

    // updateProfile: (data: string | ArrayBuffer | null) => Promise<void>;
    /** Upload avatar qua FormData (multer) */
    updateProfile: (file: File) => Promise<void>;

    onlineUsers: Array<string>; //id của những user đang online
    socket: Socket | null;
    connectSocket: (user?: AuthUser) => void;
    disconnectSocket: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,
    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");
            set({ authUser: res.data.data });
            get().connectSocket();
        } catch (error) {
            set({ authUser: null });
            console.error("Error checking auth:", error);
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post("/auth/sign-up", data);
            const user = res.data.data;

            // Lưu private key vào IndexedDB (chỉ lần đầu)
            if (user.privateKey) {
                await savePrivateKeyToIndexedDB(user._id, user.privateKey);
            }

            set({ authUser: user });
            toast.success("Signup successful!");
            get().connectSocket(user);
        } catch (error) {
            console.error("Signup error:", error);
            toast.error("Signup failed. Please try again.");
        } finally {
            set({ isSigningUp: false });
        }
    },

    logout: async () => {
        try {
            const userId = get().authUser?._id;
            await axiosInstance.post("/auth/logout");

            // Xóa private key khỏi IndexedDB khi logout
            if (userId) {
                await deletePrivateKeyFromIndexedDB(userId);
            }

            set({ authUser: null });
            toast.success("Logout successful!");
            get().disconnectSocket();
        } catch (error) {
            console.error("Logout error:", error);
            toast.error(`Logout failed. Please try again.`);
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("/auth/login", data);
            const user = res.data.data;

            // Lưu private key vào IndexedDB (server gửi lại mỗi lần login)
            if (user.privateKey) {
                await savePrivateKeyToIndexedDB(user._id, user.privateKey);
            }

            console.log("Login response user:", user);
            console.log("User ID:", user?._id);
            set({ authUser: user });
            toast.success("Login successful!");
            get().connectSocket(user);
        } catch (error) {
            console.error("Login error:", error);
            toast.error(`Login failed. Please try again.`);
        } finally {
            set({ isLoggingIn: false });
        }
    },

    updateProfile: async (file) => {
        set({ isUpdatingProfile: true });
        try {
            const form = new FormData();
            form.append("profilePic", file);

            const res = await axiosInstance.put("/auth/update-profile", form, {
                // Không set 'Content-Type' để axios tự set boundary
            });

            // Backend trả { message, data: updatedUser }
            const updatedUser: AuthUser = res.data?.data;
            if (updatedUser) {
                set({ authUser: updatedUser });
                toast.success("Profile updated successfully!");
            } else {
                toast.error("Update succeeded but no user returned");
            }
        } catch (error) {
            console.error("Update profile error:", error);
            toast.error(`Profile update failed.}`);
        } finally {
            set({ isUpdatingProfile: false });
        }
    },

    connectSocket: (user?: AuthUser) => {
        const authUser = user || get().authUser;
        console.log("connectSocket called with user:", user);
        console.log("connectSocket authUser:", authUser);
        console.log("connectSocket userId:", authUser?._id);

        if (!authUser || get().socket?.connected) {
            console.log("Socket connection skipped:", {
                hasAuthUser: !!authUser,
                isConnected: get().socket?.connected,
            });
            return;
        }

        const socket = io(import.meta.env.VITE_SOCKET_URL, {
            query: { userId: authUser._id },
        });

        console.log("Socket created with userId:", authUser._id);
        socket.connect();
        set({ socket: socket });

        socket.on("onlineUsers", (userIds) => {
            console.log("onlineUsers event received:", userIds);
            set({ onlineUsers: userIds });
        });
    },

    disconnectSocket: () => {
        if (get().socket?.connected) {
            get().socket?.disconnect();
        }
    },
}));
