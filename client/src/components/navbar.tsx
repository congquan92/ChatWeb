import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageCircle, Settings, User } from "lucide-react";

export default function Navbar() {
    const { authUser, logout } = useAuthStore();

    return (
        <div className="sticky top-0 z-50 w-full border-b border-b-accent/10 bg-accent-foreground/10 backdrop-blur-sm">
            <nav className="container mx-auto flex items-center justify-between py-4">
                {/* logo */}
                <Link to="/" className="flex items-center text-white gap-2">
                    <MessageCircle className="inline-block ml-3" />
                    <div className="text-2xl font-bold">ChatWeb</div>
                </Link>
                <div className="flex items-center space-x-4">
                    <Link to="/settings" className="mr-4 text-white hover:underline">
                        <Settings className="inline-block" />
                    </Link>
                    {authUser && (
                        <>
                            <Link to="/profile" className="mr-4 text-white hover:underline">
                                <User className="inline-block" />
                            </Link>
                            <button type="button" className="mr-4 text-white cursor-pointer" onClick={logout}>
                                <LogOut className="inline-block" />
                            </button>
                        </>
                    )}
                </div>
            </nav>
        </div>
    );
}
