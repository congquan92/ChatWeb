import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";

interface AuthUser {
    _id: string;
    fullname: string;
    email: string;
    profilePic: string;
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
    connectSocket: () => void;
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
            set({ authUser: res.data.data });
            toast.success("Signup successful!");
        } catch (error) {
            console.error("Signup error:", error);
            toast.error("Signup failed. Please try again.");
        } finally {
            set({ isSigningUp: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            {
                /* khi mà m đăng xuất cái checkAuth sẽ được tự gọi do bị thay đổi và hệ thống được cập nhật dữ liêu  */
            }
            set({ authUser: null });
            get().disconnectSocket();
            toast.success("Logout successful!");
        } catch (error) {
            console.error("Logout error:", error);
            toast.error(`Logout failed. Please try again.`);
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({ authUser: res.data.data });
            get().connectSocket();
            toast.success("Login successful!");
        } catch (error) {
            console.error("Login error:", error);
            // const errA = error as AxiosError;
            toast.error(`Login failed. Please try again.`);
        } finally {
            set({ isLoggingIn: false });
        }
    },

    // updateProfile: async (data) => {
    //     set({ isUpdatingProfile: true });
    //     try {
    //         const res = await axiosInstance.put("/auth/update-profile", data);
    //         set({ authUser: res.data });
    //         toast.success("Profile updated successfully!");
    //     } catch (error) {
    //         console.error("Update profile error:", error);
    //         toast.error(`Profile update failed. Please try again. ${error?.response?.data?.message || " "}`);
    //     } finally {
    //         set({ isUpdatingProfile: false });
    //     }
    // },

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

    connectSocket: () => {
        const { authUser } = get();
        if (!authUser || get().socket?.connected) {
            return;
        }
        const socket = io(import.meta.env.VITE_SOCKET_URL, {
            query: { userId: authUser._id },
        });
        socket.connect();

        set({ socket: socket });

        socket.on("onlineUsers", (userIds) => {
            set({ onlineUsers: userIds });
        });
    },
    disconnectSocket: () => {
        if (get().socket?.connected) {
            get().socket?.disconnect();
            set({ socket: null });
        }
    },
}));
