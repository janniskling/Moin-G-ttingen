import { Routes, Route } from 'react-router-dom';
import { Layout } from './Layout';
import Home from './pages/Home';
import Events from './pages/Events';
import Deals from './pages/Deals';
import Chats from './pages/Chats';
import Ranking from './pages/Ranking';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="events" element={<Events />} />
        <Route path="deals" element={<Deals />} />
        <Route path="chats" element={<Chats />} />
        <Route path="ranking" element={<Ranking />} />
      </Route >
    </Routes >
  );
}

export default App;
