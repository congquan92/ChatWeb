import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

interface AuthStore {
    authUser: any | null;
    isSigningUp: boolean;
    isLoggingIn: boolean;
    isUpdatingProfile: boolean;
    isCheckingAuth: boolean;
    checkAuth: () => Promise<void>;
    signup: (data: { fullname: string; email: string; password: string }) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");
            set({ authUser: res.data });
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
            set({ authUser: res.data });
            toast.success("Signup successful!");
        } catch (error) {
            console.error("Signup error:", error);
            toast.error("Signup failed. Please try again. " + error?.response?.data?.message || "");
        } finally {
            set({ isSigningUp: false });
        }
    },
}));
