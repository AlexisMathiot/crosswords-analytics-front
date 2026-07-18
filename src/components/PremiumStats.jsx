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

const STATUS_LABELS = {
  active: 'Actif',
  past_due: 'Paiement en retard',
  canceled: 'Résilié',
  unpaid: 'Impayé',
  incomplete: 'Incomplet',
  other: 'Autre',
};

const STATUS_COLORS = [
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#d84c4c',
  '#8884d8',
  '#999999',
];

function PremiumStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPremiumStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await statisticsAPI.getPremiumStatistics();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPremiumStats();
  }, []);

  if (loading) return <div className="loading">Chargement des statistiques d'abonnement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!stats) return null;

  // "none" (users without any subscription) is excluded from the pie: it
  // would dwarf every real status
  const statusData = Object.entries(stats.byStatus)
    .filter(([status, count]) => status !== 'none' && count > 0)
    .map(([status, count]) => ({
      name: STATUS_LABELS[status] ?? status,
      value: count,
    }));

  return (
    <div className="global-stats">
      <h2>Statistiques des Abonnements</h2>

      <div className="stats-summary">
        <div className="stat-card">
          <h3>Abonnés premium</h3>
          <p className="stat-value">{stats.premiumUsers.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Annulations programmées</h3>
          <p className="stat-value">{stats.pendingCancellations.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Promo de lancement utilisée</h3>
          <p className="stat-value">{stats.launchPromoUsed.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Remboursements estimés</h3>
          <p className="stat-value">~{stats.estimatedRefunds.probableRefunds}</p>
          <p className="stat-legend">
            Estimation — les remboursements ne sont pas persistés en base
          </p>
        </div>
      </div>

      <div className="charts-grid">
        {statusData.length > 0 && (
          <div className="chart-container">
            <h3>Répartition par statut d'abonnement</h3>
            <p className="chart-subtitle">
              Hors utilisateurs sans abonnement ({stats.byStatus.none.toLocaleString()})
            </p>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {stats.timeline.length > 0 && (
          <div className="chart-container">
            <h3>Abonnements et résiliations par mois</h3>
            <p className="chart-subtitle">{stats.timelineNote}</p>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stats.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="newSubscriptions"
                  fill="#00C49F"
                  name="Nouveaux abonnements"
                />
                <Bar dataKey="cancellations" fill="#FF8042" name="Résiliations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {stats.timeline.length === 0 && statusData.length === 0 && (
        <div className="no-data">Aucune donnée d'abonnement pour le moment.</div>
      )}
    </div>
  );
}

export default PremiumStats;
