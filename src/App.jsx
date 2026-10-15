import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Consent from './pages/Consent';
import Demographics from './pages/Demographics';
import Questions from './pages/Questions';
import Instructions from './pages/Instructions';
import BartPractice from './pages/BartPractice';
import Bart from './pages/Bart';
import Finished from './pages/Finished';

function App() {
  return (
    <div className="app-container">
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/consent" replace />} />
          <Route path="/consent" element={<Consent />} />
          <Route path="/demographics" element={<Demographics />} />
          <Route path="/instructions" element={<Instructions />} />
          <Route path="/practice" element={<BartPractice />} />
          <Route path="/bart" element={<Bart />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/finished" element={<Finished />} />
          <Route path="*" element={<Navigate to="/consent" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;

