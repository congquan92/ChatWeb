import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

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
            set({ authUser: res.data.data });
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
            toast.error("Signup failed. Please try again. " + error?.response?.data?.message || "");
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
            toast.success("Logout successful!");
        } catch (error) {
            console.error("Logout error:", error);
            toast.error(`Logout failed. Please try again. ${error?.response?.data?.message || " "}`);
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({ authUser: res.data.data });
            toast.success("Login successful!");
        } catch (error) {
            console.error("Login error:", error);
            toast.error(`Login failed. Please try again. ${error?.response?.data?.message || " "}`);
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
            toast.error(`Profile update failed. ${error?.response?.data?.message || " "}`);
        } finally {
            set({ isUpdatingProfile: false });
        }
    },
}));
