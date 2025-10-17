import { Route, Routes } from "react-router-dom";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import HomePage from "./page/homePage";
import LoginPage from "./page/loginPage";
import SignUpPage from "./page/siginupPage";
import SettingPage from "./page/settingPage";
import ProfilePage from "./page/profilePage";

function App() {
    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/settings" element={<SettingPage />} />
                <Route path="/profile" element={<ProfilePage />} />
            </Routes>
            <Footer />
        </>
    );
}

export default App;
