import {Routes ,Route, Navigate} from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import AuthCallbackPage from "./pages/auth-callback/AuthCallbackPage";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import MainLayout from "./layout/MainLayout";
import ChatPage from "./pages/chat/ChatPage";
import AlbumPage from "./pages/album/AlbumPage";
import AdminPage from "./pages/admin/AdminPage";
import SongsPage from "./pages/SongsPage";
import SongDetailPage from "./pages/song/SongDetailPage";
import LikedSongsPage from "./pages/likes/LikedSongsPage";
import ProfilePage from "./pages/profile/ProfilePage";
import SettingsPage from "./pages/settings/SettingsPage";
import {Toaster} from 'react-hot-toast'
import NotFoundPage from "./pages/404NotFound/NotFoundPage";
import GlobalSearch from "./components/GlobalSearch";
import { useSearchStore } from "./stores/useSearchStore";
import LandingPage from "./pages/landing/LandingPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const { isOpen, setOpen } = useSearchStore();
  return (
    <>
    <Routes>
      <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback signUpForceRedirectUrl={"/auth-callback"} />} />
      <Route path="/auth-callback" element={<AuthCallbackPage />} />
      <Route path="/landing" element={<LandingPage />} />
      
      <Route path="/" element={<Navigate to="/landing" replace />} />
      
      {/* Protected Routes */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminPage />
        </ProtectedRoute>
      } />

      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
       <Route path="/home" element={<HomePage />} />
       <Route path="/profile" element={<ProfilePage />} />
       <Route path="/settings" element={<SettingsPage />} />
       <Route path="/chat" element={<ChatPage />} />
       <Route path="/albums/:albumId" element={<AlbumPage />} />
       <Route path="/songs" element={<SongsPage />} />
       <Route path="/likes" element={<LikedSongsPage />} />
       <Route path="/songs/:songId" element={<SongDetailPage />} />
       <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    <GlobalSearch open={isOpen} onOpenChange={setOpen} />
    <Toaster/>
    </>
  );
}