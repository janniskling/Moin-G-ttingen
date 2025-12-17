import { Routes, Route } from 'react-router-dom';
import { Layout } from './Layout';
import Home from './pages/Home';
import Events from './pages/Events';
import Mensa from './pages/Mensa';
import Weather from './pages/Weather';
import Ranking from './pages/Ranking';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="events" element={<Events />} />
        <Route path="mensa" element={<Mensa />} />
        <Route path="weather" element={<Weather />} />
        <Route path="ranking" element={<Ranking />} />
      </Route>
    </Routes>
  );
}

export default App;
