import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { MapPage } from './pages/MapPage';
import { SubmitPage } from './pages/SubmitPage';
import { DonationPage } from './pages/DonationPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="submit" element={<SubmitPage />} />
          <Route path="donate" element={<DonationPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
