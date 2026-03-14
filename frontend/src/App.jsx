import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import HomePage from './pages/HomePage'
import DebateArena from './pages/DebateArena'
import ResultsPage from './pages/ResultsPage'
import MUNPage from './pages/MUNPage'
import DualDebatePage from './pages/DualDebatePage'
import DualResultsPage from './pages/DualResultsPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboard from './pages/AdminDashboard'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function App() {
  
  useEffect(() => {
    // Record a unique site visit on mount
    const trackVisit = async () => {
      try {
        await fetch('http://localhost:8000/api/admin/track-visit', {
          method: 'POST'
        });
      } catch (err) {
        console.error("Failed to log visit:", err);
      }
    };
    trackVisit();
  }, []);

  return (
    <Router>
      {/* Main Content */}
      <main className="app-main">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/debate" element={<DebateArena />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/mun" element={<MUNPage />} />
            <Route path="/dual-debate" element={<DualDebatePage />} />
            <Route path="/dual-results" element={<DualResultsPage />} />
            <Route path="/admin" element={<AdminDashboard />} /> 
            <Route path="/admin/login" element={<AdminLoginPage />} /> 
          </Routes>
        </ErrorBoundary>
      </main>
    </Router>
  )
}

export default App
