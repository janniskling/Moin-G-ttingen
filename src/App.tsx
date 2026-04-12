import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './Layout';
import Home from './pages/Home';
import Events from './pages/Events';
import Chats from './pages/Chats';
import Ranking from './pages/Ranking';
import AuthCallback from './pages/AuthCallback';
import { AuthProvider } from './context/AuthContext';
import { SplashScreen } from './components/SplashScreen';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

function App() {
  const [showSplash, setShowSplash] = useState(isNative);

  return (
    <AuthProvider>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="events" element={<Events />} />
          <Route path="chats" element={<Chats />} />
          <Route path="ranking" element={<Ranking />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
