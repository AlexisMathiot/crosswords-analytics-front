import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
  draft: 'Brouillon',
  published: 'Publiée',
  cancelled: 'Annulée',
};

const ACCESS_LABELS = {
  ticket: 'Ticket',
  premium: 'Premium',
  other: 'Autre / inconnu',
};

const ACCESS_COLORS = ['#FFBB28', '#00C49F', '#999999'];

const BADGE_LABELS = {
  participation: 'Participation',
  semi_finalist: 'Demi-finaliste',
  finalist: 'Finaliste',
  winner: 'Vainqueur',
};

const OUTCOME_LABELS = {
  victoire: 'Victoires',
  elimine: 'Éliminés',
  walkover: 'Walkovers',
  exemption: 'Exemptions',
};

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '—');

const formatTime = (seconds) => {
  if (seconds == null) return 'N/A';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
};

const formatOutcomes = (outcomes) =>
  Object.entries(outcomes)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => `${count} ${OUTCOME_LABELS[key] ?? key}`)
    .join(', ') || '—';

function TournamentStats() {
  const [overview, setOverview] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await statisticsAPI.getTournamentOverview();
        setOverview(data);
        // Default to the most recent published edition, else the most recent one
        const preferred =
          data.editions.find((edition) => edition.status === 'published') ?? data.editions[0];
        setSelectedId(preferred?.id ?? '');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    const fetchDetail = async () => {
      try {
        setDetailLoading(true);
        const data = await statisticsAPI.getTournamentDetail(selectedId);
        setDetail(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setDetailLoading(false);
      }
    };

    fetchDetail();
  }, [selectedId]);

  if (loading) return <div className="loading">Chargement des statistiques de tournoi...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!overview) return null;

  if (overview.totalEditions === 0) {
    return (
      <div className="global-stats">
        <h2>Statistiques du Tournoi</h2>
        <div className="no-data">Aucune édition de tournoi pour le moment.</div>
      </div>
    );
  }

  const accessData = detail
    ? Object.entries(ACCESS_LABELS)
        .map(([key, label]) => ({ name: label, value: detail.entrants[key] }))
        .filter((entry) => entry.value > 0)
    : [];

  const badgeData = detail
    ? Object.entries(detail.badges)
        .filter(([, count]) => count > 0)
        .map(([type, count]) => ({ name: BADGE_LABELS[type] ?? type, value: count }))
    : [];

  return (
    <div className="global-stats">
      <h2>Statistiques du Tournoi</h2>

      <div className="stats-summary">
        <div className="stat-card">
          <h3>Éditions</h3>
          <p className="stat-value">{overview.totalEditions}</p>
          <p className="stat-legend">
            {overview.editionsByStatus.published} publiée(s),{' '}
            {overview.editionsByStatus.draft} brouillon(s),{' '}
            {overview.editionsByStatus.cancelled} annulée(s)
          </p>
        </div>
        <div className="stat-card">
          <h3>Participations</h3>
          <p className="stat-value">{overview.entrants.total.toLocaleString()}</p>
          <p className="stat-legend">
            {overview.uniqueEntrants} joueur(s) unique(s), {overview.returningEntrants} revenu(s)
          </p>
        </div>
        <div className="stat-card">
          <h3>Tickets vendus</h3>
          <p className="stat-value">{overview.tickets.granted.toLocaleString()}</p>
          <p className="stat-legend">{overview.uniqueBuyers} acheteur(s) unique(s)</p>
        </div>
        <div className="stat-card">
          <h3>Tickets à rembourser</h3>
          <p className="stat-value">{overview.tickets.toRefund.toLocaleString()}</p>
          <p className="stat-legend">{overview.tickets.anomalyRate}% des tickets</p>
        </div>
        <div className="stat-card">
          <h3>Parties de compétition</h3>
          <p className="stat-value">
            {overview.competitiveSubmissions.byStatus.submitted.toLocaleString()}
          </p>
          <p className="stat-legend">
            {overview.outOfCompetitionSubmissions} hors compétition
          </p>
        </div>
        <div className="stat-card">
          <h3>Temps moyen</h3>
          <p className="stat-value">
            {formatTime(overview.competitiveSubmissions.completionTime?.mean)}
          </p>
        </div>
      </div>

      {overview.timeline.length > 0 && (
        <div className="charts-grid">
          <div className="chart-container full-width">
            <h3>Participations et tickets par mois</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={overview.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="entrants" fill="#8884d8" name="Participations" />
                <Bar dataKey="tickets" fill="#FFBB28" name="Tickets vendus" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="leaderboard section-spaced">
        <h2>Éditions</h2>
        <p className="chart-subtitle">{overview.entrantsNote}</p>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Édition</th>
                <th>Statut</th>
                <th>Début</th>
                <th>Tableau</th>
                <th>Participants</th>
                <th>Ticket / Premium / Autre</th>
                <th>Tickets vendus</th>
                <th>À rembourser</th>
                <th>Parties</th>
                <th>Vainqueur</th>
              </tr>
            </thead>
            <tbody>
              {overview.editions.map((edition) => (
                <tr
                  key={edition.id}
                  className={edition.id === selectedId ? 'top-rank' : ''}
                  onClick={() => setSelectedId(edition.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="pseudo">{edition.name}</td>
                  <td>{STATUS_LABELS[edition.status] ?? edition.status}</td>
                  <td>{formatDate(edition.startAt)}</td>
                  <td>{edition.bracketSize ?? '—'}</td>
                  <td>{edition.entrants.total}</td>
                  <td>
                    {edition.entrants.ticket} / {edition.entrants.premium} /{' '}
                    {edition.entrants.other}
                  </td>
                  <td>{edition.tickets.granted}</td>
                  <td>{edition.tickets.toRefund}</td>
                  <td>{edition.competitiveSubmissions}</td>
                  <td>{edition.winnerPseudo ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="leaderboard section-spaced">
        <h2>Détail d'une édition</h2>
        <div className="grid-selector">
          <label htmlFor="tournamentId">Édition:</label>
          <select
            id="tournamentId"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {overview.editions.map((edition) => (
              <option key={edition.id} value={edition.id}>
                {edition.name} ({STATUS_LABELS[edition.status] ?? edition.status})
              </option>
            ))}
          </select>
        </div>

        {detailLoading && <div className="loading">Chargement de l'édition...</div>}

        {detail && !detailLoading && (
          <>
            <div className="stats-summary">
              <div className="stat-card">
                <h3>Participants</h3>
                <p className="stat-value">{detail.entrants.total}</p>
                <p className="stat-legend">
                  {detail.entrants.qualified} qualifié(s), {detail.entrants.deletedAccounts}{' '}
                  compte(s) supprimé(s)
                </p>
              </div>
              <div className="stat-card">
                <h3>Tickets vendus</h3>
                <p className="stat-value">{detail.tickets.granted}</p>
                <p className="stat-legend">{detail.tickets.toRefund} à rembourser</p>
              </div>
              <div className="stat-card">
                <h3>Qualifications jouées</h3>
                <p className="stat-value">
                  {detail.rounds[0]?.submissions.byStatus.submitted ?? 0}
                </p>
                <p className="stat-legend">
                  {detail.rounds[0]?.submissions.byStatus.in_progress ?? 0} en cours
                </p>
              </div>
              <div className="stat-card">
                <h3>Tableau</h3>
                <p className="stat-value">{detail.bracketSize ?? '—'}</p>
                <p className="stat-legend">
                  {detail.roundsPlayed != null ? `${detail.roundsPlayed} tours` : 'non constitué'}
                </p>
              </div>
              <div className="stat-card">
                <h3>Hors compétition</h3>
                <p className="stat-value">{detail.outOfCompetition.submissions.total}</p>
                <p className="stat-legend">
                  {detail.outOfCompetition.uniquePlayers} joueur(s)
                </p>
              </div>
              <div className="stat-card">
                <h3>Vainqueur</h3>
                <p className="stat-value">{detail.winnerPseudo ?? '—'}</p>
                <p className="stat-legend">Lot : {detail.prize}</p>
              </div>
            </div>

            <div className="charts-grid">
              {accessData.length > 0 && (
                <div className="chart-container">
                  <h3>Mode d'accès des participants</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={accessData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={110}
                        dataKey="value"
                      >
                        {accessData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={ACCESS_COLORS[index % ACCESS_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {detail.tickets.purchaseTimeline.length > 0 && (
                <div className="chart-container">
                  <h3>Achats de tickets</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={detail.tickets.purchaseTimeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#FFBB28"
                        name="Cumul"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="tickets"
                        stroke="#8884d8"
                        name="Par jour"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {detail.entriesTimeline.length > 0 && (
                <div className="chart-container">
                  <h3>Entrées en lice par jour</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={detail.entriesTimeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="entrants" fill="#8884d8" name="Participants" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {badgeData.length > 0 && (
                <div className="chart-container">
                  <h3>Badges décernés</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={badgeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={120} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#00C49F" name="Badges" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {detail.rounds.length > 0 && (
              <div className="section-spaced">
                <h2>Calendrier et tours</h2>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Fenêtre</th>
                        <th>Grille</th>
                        <th>Ouverture</th>
                        <th>Fermeture</th>
                        <th>Parties</th>
                        <th>En cours</th>
                        <th>Annulées</th>
                        <th>Temps médian</th>
                        <th>% Grille complète</th>
                        <th>Emplacements</th>
                        <th>Issues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.rounds.map((round) => (
                        <tr
                          key={round.position}
                          style={{ opacity: round.played ? 1 : 0.5 }}
                        >
                          <td className="pseudo">
                            {round.label}
                            {!round.played && ' (non joué)'}
                          </td>
                          <td>
                            {round.gridId
                              ? `#${round.gridNumber ?? round.gridId} - ${round.gridVersion}`
                              : '—'}
                          </td>
                          <td>{formatDate(round.openedAt ?? round.opensAt)}</td>
                          <td>{formatDate(round.closedAt ?? round.closesAt)}</td>
                          <td>{round.submissions.byStatus.submitted}</td>
                          <td>{round.submissions.byStatus.in_progress}</td>
                          <td>{round.submissions.byStatus.cancelled}</td>
                          <td>{formatTime(round.submissions.completionTime?.median)}</td>
                          <td>
                            {round.submissions.fullGridRate != null
                              ? `${round.submissions.fullGridRate}%`
                              : 'N/A'}
                          </td>
                          <td>
                            {round.slots
                              ? `${round.slots.occupied} occupé(s), ${round.slots.vacant} vide(s)`
                              : '—'}
                          </td>
                          <td>{round.slots ? formatOutcomes(round.slots.outcomes) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TournamentStats;
