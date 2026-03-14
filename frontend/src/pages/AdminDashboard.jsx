import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShinyText from '../components/ShinyText';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        navigate('/admin/login'); // Redirect to login if no token
        return;
      }

      try {
        const res = await fetch(`http://localhost:8000/api/admin/stats?token=${token}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          // Token invalid or expired
          localStorage.removeItem('admin_token');
          navigate('/admin/login');
        }
      } catch (err) {
        setError('Failed to load dashboard data. Ensure backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="admin-dashboard loading">
        <ShinyText text="Loading Analytics..." speed={2} color="#f43f5e" shineColor="#ffffff" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard error">
        <h2>Connection Error</h2>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>Return Home</button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard page-enter">
      <header className="dashboard-header">
        <div className="header-title">
          <ShinyText text="Clarivox Control Panel" speed={3} color="#f43f5e" shineColor="#ffffff" direction="right" />
          <h1>Administrator Dashboard</h1>
        </div>
        <button className="btn btn-secondary logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className="dashboard-content">
        <section className="metrics-grid">
          <div className="metric-card glass-card">
            <h3>Total Unique Visits</h3>
            <div className="metric-value">{stats.total_visits}</div>
          </div>
          
          <div className="metric-card glass-card">
            <h3>Total Debates Run</h3>
            <div className="metric-value">{stats.total_debates}</div>
          </div>
          
          <div className="metric-card glass-card">
            <h3>Mode Popularity</h3>
            <ul className="mode-list">
              {Object.entries(stats.mode_distribution).map(([mode, count]) => (
                <li key={mode}>
                  <span className="mode-name">{mode}</span>
                  <span className="mode-count">{count}</span>
                </li>
              ))}
              {Object.keys(stats.mode_distribution).length === 0 && (
                <li className="empty-state">No debates logged yet.</li>
              )}
            </ul>
          </div>
        </section>

        <section className="recent-debates glass-card">
          <h2>Recent Debate Sessions</h2>
          {stats.recent_debates.length > 0 ? (
            <div className="table-responsive">
              <table className="debates-table">
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Mode</th>
                    <th>Winner</th>
                    <th>Score</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_debates.map((debate) => (
                    <tr key={debate.id}>
                      <td className="truncate" title={debate.topic}>{debate.topic}</td>
                      <td><span className={`badge badge-${debate.mode.toLowerCase()}`}>{debate.mode}</span></td>
                      <td className="capitalize">{debate.winner || 'N/A'}</td>
                      <td>{debate.score ? `${debate.score}/100` : '—'}</td>
                      <td className="date-cell">{new Date(debate.timestamp).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">No recent debates found in the database.</div>
          )}
        </section>
      </main>
    </div>
  );
}
