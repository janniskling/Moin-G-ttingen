import { Routes, Route } from 'react-router-dom';
import { Layout } from './Layout';
import Home from './pages/Home';
import Events from './pages/Events';
import Chats from './pages/Chats';
import Ranking from './pages/Ranking';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Routes>
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
