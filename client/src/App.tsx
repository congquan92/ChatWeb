import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import HomePage from "./page/homePage";
import LoginPage from "./page/loginPage";
import SettingPage from "./page/settingPage";
import ProfilePage from "./page/profilePage";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "react-hot-toast";
import SignUpPage from "./page/siginupPage";

function App() {
    const { checkAuth, authUser, isCheckingAuth, onlineUsers } = useAuthStore();

    console.log({ onlineUsers });

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    if (isCheckingAuth && !authUser) {
        return (
            <div className="container mx-auto flex justify-center items-center my-6">
                <Loader2 className="animate-spin size-16 text-blue-500" />
            </div>
        );
    }
    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
                <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
                <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
                <Route path="/settings" element={authUser ? <SettingPage /> : <Navigate to="/login" />} />
                <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
            </Routes>
            <Footer />
            <Toaster />
        </>
    );
}

export default App;
