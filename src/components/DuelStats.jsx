import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { statisticsAPI } from '../services/api';

const OUTCOME_COLORS = ['#8884d8', '#82ca9d', '#FF8042'];

function DuelStats() {
  const [overview, setOverview] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDuelStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const [overviewData, leaderboardData] = await Promise.all([
          statisticsAPI.getDuelOverview(),
          statisticsAPI.getDuelLeaderboard(50),
        ]);
        setOverview(overviewData);
        setLeaderboard(leaderboardData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDuelStats();
  }, []);

  const formatTime = (seconds) => {
    if (seconds == null) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
  };

  const getMedalEmoji = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

  if (loading) return <div className="loading">Chargement des statistiques de duels...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!overview) return null;

  if (overview.totalDuelSubmissions === 0) {
    return (
      <div className="global-stats">
        <h2>Statistiques des Duels</h2>
        <div className="no-data">Aucun duel enregistré pour le moment.</div>
      </div>
    );
  }

  const outcomeData = [
    { name: 'Victoires Joueur 1', value: overview.outcomes.player1Wins },
    { name: 'Victoires Joueur 2', value: overview.outcomes.player2Wins },
    { name: 'Matchs nuls', value: overview.outcomes.draws },
  ].filter((entry) => entry.value > 0);

  return (
    <div className="global-stats">
      <h2>Statistiques des Duels</h2>

      <div className="stats-summary">
        <div className="stat-card">
          <h3>Duels joués</h3>
          <p className="stat-value">{overview.totalDuelSubmissions.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Matchs résolus</h3>
          <p className="stat-value">{overview.totalMatches.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Joueurs uniques</h3>
          <p className="stat-value">{overview.uniquePlayers.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Duels expirés</h3>
          <p className="stat-value">{overview.expiredRate}%</p>
        </div>
        <div className="stat-card">
          <h3>Temps moyen</h3>
          <p className="stat-value">{formatTime(overview.completionTime?.mean)}</p>
        </div>
      </div>

      <div className="charts-grid">
        {outcomeData.length > 0 && (
          <div className="chart-container">
            <h3>Résultats des matchs</h3>
            <p className="chart-subtitle">
              Taux de matchs nuls : {overview.outcomes.drawRate}%
            </p>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={outcomeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {outcomeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={OUTCOME_COLORS[index % OUTCOME_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {overview.participationTimeline.length > 0 && (
          <div className="chart-container">
            <h3>Participation mensuelle</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={overview.participationTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="submissions" fill="#8884d8" name="Duels joués" />
                <Bar dataKey="matches" fill="#82ca9d" name="Matchs résolus" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {overview.perGrid.length > 0 && (
        <div className="leaderboard section-spaced">
          <h2>Détail par grille</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Grille</th>
                  <th>Duels joués</th>
                  <th>Matchs</th>
                  <th>Joueurs</th>
                  <th>Expirés</th>
                  <th>Temps médian</th>
                  <th>% Complétion</th>
                </tr>
              </thead>
              <tbody>
                {overview.perGrid.map((grid) => (
                  <tr key={grid.gridId}>
                    <td className="pseudo">
                      Grille #{grid.gridNumber ?? grid.gridId} - {grid.version}
                    </td>
                    <td>{grid.submissions}</td>
                    <td>{grid.matches}</td>
                    <td>{grid.uniquePlayers}</td>
                    <td>{grid.expiredCount}</td>
                    <td>{formatTime(grid.medianCompletionTime)}</td>
                    <td>{grid.completionRate != null ? `${grid.completionRate}%` : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="leaderboard section-spaced">
        <h2>Classement Elo</h2>
        <p className="chart-subtitle">
          Classement limité aux joueurs ayant disputé au moins 5 duels (
          {overview.elo.eligiblePlayers} joueur(s) éligible(s) sur{' '}
          {overview.elo.ratedPlayers}).
        </p>
        {leaderboard.length === 0 ? (
          <div className="no-data">Aucun joueur éligible au classement pour le moment.</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Rang</th>
                  <th>Pseudo</th>
                  <th>Elo</th>
                  <th>Duels</th>
                  <th>Victoires</th>
                  <th>Défaites</th>
                  <th>Nuls</th>
                  <th>% Victoires</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr
                    key={`${entry.rank}-${index}`}
                    className={entry.rank <= 3 ? 'top-rank' : ''}
                  >
                    <td>
                      {getMedalEmoji(entry.rank)} {entry.rank}
                    </td>
                    <td className="pseudo">{entry.pseudo}</td>
                    <td className="score">{entry.rating}</td>
                    <td>{entry.duelsPlayed}</td>
                    <td>{entry.duelsWon}</td>
                    <td>{entry.duelsLost}</td>
                    <td>{entry.draws}</td>
                    <td>{entry.winRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DuelStats;
