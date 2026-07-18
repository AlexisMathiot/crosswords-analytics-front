import { useState, useEffect } from 'react';
import GlobalStats from './components/GlobalStats';
import GridStats from './components/GridStats';
import Leaderboard from './components/Leaderboard';
import TemporalStats from './components/TemporalStats';
import UserActivity from './components/UserActivity';
import DuelStats from './components/DuelStats';
import PremiumStats from './components/PremiumStats';
import Login from './components/Login';
import { statisticsAPI } from './services/api';
import './App.css';

const GRID_TYPES = [
  { value: 'all', label: 'Toutes' },
  { value: 'weekly', label: 'Semaine' },
  { value: 'izipizi', label: 'Izipizi' },
  { value: 'duel', label: 'Duel' },
];

const TYPE_LABELS = {
  weekly: 'Grilles de la semaine',
  izipizi: 'Izipizi',
  duel: 'Duels',
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [activeTab, setActiveTab] = useState('global');
  const [gridId, setGridId] = useState(null);
  const [gridType, setGridType] = useState('all');
  const [availableGrids, setAvailableGrids] = useState([]);
  const [loading, setLoading] = useState(true);

  const recency = (grid) => grid.activatedAt ?? grid.publishedAt ?? '';
  const filteredGrids = availableGrids
    .filter((grid) => gridType === 'all' || grid.type === gridType)
    .sort((a, b) => recency(b).localeCompare(recency(a)) || b.id - a.id);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchGrids = async () => {
      try {
        const grids = await statisticsAPI.getAvailableGrids();
        setAvailableGrids(grids);
      } catch (error) {
        console.error('Error fetching grids:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrids();
  }, [isAuthenticated]);

  // Keep a valid grid selected when the type filter or the grid list changes
  useEffect(() => {
    if (filteredGrids.length === 0) {
      setGridId(null);
    } else if (!filteredGrids.some((grid) => grid.id === gridId)) {
      setGridId(filteredGrids[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridType, availableGrids]);

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>Crosswords Analytics Dashboard</h1>
            <p>Tableau de bord d'analyse et statistiques</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={activeTab === 'global' ? 'active' : ''}
          onClick={() => setActiveTab('global')}
        >
          Statistiques Globales
        </button>
        <button
          className={activeTab === 'grid' ? 'active' : ''}
          onClick={() => setActiveTab('grid')}
        >
          Statistiques Grille
        </button>
        <button
          className={activeTab === 'temporal' ? 'active' : ''}
          onClick={() => setActiveTab('temporal')}
        >
          Analyse Temporelle
        </button>
        <button
          className={activeTab === 'activity' ? 'active' : ''}
          onClick={() => setActiveTab('activity')}
        >
          Activite Utilisateurs
        </button>
        <button
          className={activeTab === 'leaderboard' ? 'active' : ''}
          onClick={() => setActiveTab('leaderboard')}
        >
          Classement
        </button>
        <button
          className={activeTab === 'duels' ? 'active' : ''}
          onClick={() => setActiveTab('duels')}
        >
          Duels
        </button>
        <button
          className={activeTab === 'premium' ? 'active' : ''}
          onClick={() => setActiveTab('premium')}
        >
          Abonnements
        </button>
      </nav>

      {(activeTab === 'grid' || activeTab === 'temporal' || activeTab === 'leaderboard') && !loading && (
        <div className="grid-selector">
          <label htmlFor="gridType">Type:</label>
          <select
            id="gridType"
            value={gridType}
            onChange={(e) => setGridType(e.target.value)}
          >
            {GRID_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <label htmlFor="gridId">Grille:</label>
          <select
            id="gridId"
            value={gridId || ''}
            onChange={(e) => setGridId(parseInt(e.target.value))}
          >
            {gridType === 'all'
              ? Object.keys(TYPE_LABELS)
                  .filter((type) => filteredGrids.some((grid) => grid.type === type))
                  .map((type) => (
                    <optgroup key={type} label={TYPE_LABELS[type]}>
                      {filteredGrids
                        .filter((grid) => grid.type === type)
                        .map((grid) => (
                          <option key={grid.id} value={grid.id}>
                            Grille #{grid.gridNumber ?? grid.id} - {grid.version}
                          </option>
                        ))}
                    </optgroup>
                  ))
              : filteredGrids.map((grid) => (
                  <option key={grid.id} value={grid.id}>
                    Grille #{grid.gridNumber ?? grid.id} - {grid.version}
                  </option>
                ))}
          </select>
        </div>
      )}

      <main className="content">
        {loading ? (
          <div className="loading">Chargement des grilles...</div>
        ) : (
          <>
            {activeTab === 'global' && <GlobalStats />}
            {activeTab === 'activity' && <UserActivity />}
            {activeTab === 'duels' && <DuelStats />}
            {activeTab === 'premium' && <PremiumStats />}
            {activeTab === 'grid' && gridId && <GridStats gridId={gridId} />}
            {activeTab === 'temporal' && gridId && <TemporalStats gridId={gridId} />}
            {activeTab === 'leaderboard' && gridId && (
              <Leaderboard
                gridId={gridId}
                gridNumber={availableGrids.find(g => g.id === gridId)?.gridNumber}
                limit={50}
              />
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by FastAPI + React + Recharts</p>
      </footer>
    </div>
  );
}

export default App;
