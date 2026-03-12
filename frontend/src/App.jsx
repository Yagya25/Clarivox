import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DebateArena from './pages/DebateArena'
import ResultsPage from './pages/ResultsPage'
import MUNPage from './pages/MUNPage'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function App() {
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
          </Routes>
        </ErrorBoundary>
      </main>
    </Router>
  )
}

export default App
