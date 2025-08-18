// App.js
import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebaseConfig";
import LoginPage from "./LoginPage";
import ProfileSettingsPage from "./ProfileSettingsPage";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Trang login */}
      <Route
        path="/"
        element={!user ? <LoginPage /> : <Navigate to="/profile" />}
      />

      {/* Trang profile settings */}
      <Route
        path="/profile"
        element={user ? <ProfileSettingsPage /> : <Navigate to="/" />}
      />

      {/* Nếu route không tồn tại → redirect */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;