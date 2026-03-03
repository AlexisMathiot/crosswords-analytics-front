import { useState, useEffect } from "react";
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
} from "recharts";
import { statisticsAPI } from "../services/api";

const COLORS = ["#667eea", "#00C49F", "#FF8042", "#8884d8", "#FFBB28", "#FF6B6B"];

const LOOKBACK_OPTIONS = [
  { value: 3, label: "3 derniers mois" },
  { value: 6, label: "6 derniers mois" },
  { value: 12, label: "12 derniers mois" },
];

function formatWeekLabel(startDate) {
  const date = new Date(startDate + "T00:00:00");
  return `Sem. du ${date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}`;
}

function UserActivity() {
  const [data, setData] = useState(null);
  const [registrationData, setRegistrationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthsLookback, setMonthsLookback] = useState(6);
  const [minActiveMonths, setMinActiveMonths] = useState(2);
  const [userGranularity, setUserGranularity] = useState("month");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await statisticsAPI.getUserActivity(
          monthsLookback,
          minActiveMonths,
        );
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [monthsLookback, minActiveMonths]);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const raw =
          await statisticsAPI.getNewUsersRegistrations(userGranularity);
        const sliced = raw.slice(1);
        if (userGranularity === "week") {
          setRegistrationData(
            sliced.map((item) => ({
              label: formatWeekLabel(item.startDate),
              count: item.count,
            })),
          );
        } else {
          setRegistrationData(
            sliced.map((item) => ({
              label: new Date(item.period + "-01").toLocaleDateString("fr-FR", {
                month: "short",
                year: "numeric",
              }),
              count: item.count,
            })),
          );
        }
      } catch (err) {
        console.error("Error fetching user registrations:", err);
      }
    };

    fetchRegistrations();
  }, [userGranularity]);

  if (loading)
    return (
      <div className="loading">Chargement des statistiques d'activite...</div>
    );
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data) return null;

  const { activeUsersTimeline, regularUsers, retention, activityDistribution } =
    data;

  // Format timeline data for charts
  const timelineData = activeUsersTimeline.map((item) => ({
    period: new Date(item.period + "-01").toLocaleDateString("fr-FR", {
      month: "short",
      year: "numeric",
    }),
    actifs: item.activeUsers,
    nouveaux: item.newUsers,
    recurrents: item.returningUsers,
  }));

  // Format retention data
  const retentionData = retention.map((item) => ({
    period: new Date(item.period + "-01").toLocaleDateString("fr-FR", {
      month: "short",
      year: "numeric",
    }),
    taux: item.retentionRate,
    retenus: item.retainedFromPrevious,
    total: item.previousTotal,
  }));

  // Format distribution for pie chart
  const distributionData = activityDistribution.map((item) => ({
    name: `${item.activeMonths} mois`,
    value: item.userCount,
  }));

  // Min active months options (1 to monthsLookback)
  const minMonthsOptions = Array.from(
    { length: monthsLookback },
    (_, i) => i + 1,
  );

  return (
    <div className="global-stats">
      <div className="header-with-filter">
        <h2>Activite des Utilisateurs</h2>
        <div className="period-selector">
          <label htmlFor="lookback-select">Periode : </label>
          <select
            id="lookback-select"
            value={monthsLookback}
            onChange={(e) => {
              const newLookback = parseInt(e.target.value);
              setMonthsLookback(newLookback);
              if (minActiveMonths > newLookback) {
                setMinActiveMonths(Math.min(2, newLookback));
              }
            }}
          >
            {LOOKBACK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="stats-summary">
        <div className="stat-card">
          <h3>Utilisateurs Reguliers</h3>
          <p className="stat-value">{regularUsers.count}</p>
          <p className="stat-detail">
            {regularUsers.percentage}% des utilisateurs actifs
          </p>
        </div>
        <div className="stat-card">
          <h3>Total Utilisateurs Actifs</h3>
          <p className="stat-value">{regularUsers.totalUsers}</p>
          <p className="stat-detail">
            sur les {regularUsers.monthsAnalyzed} derniers mois
          </p>
        </div>
        <div className="stat-card">
          <h3>Retention Moyenne</h3>
          <p className="stat-value">
            {retentionData.length > 0
              ? (
                  retentionData.reduce((sum, r) => sum + r.taux, 0) /
                  retentionData.length
                ).toFixed(1)
              : 0}
            %
          </p>
          <p className="stat-detail">mois par mois</p>
        </div>
        <div className="stat-card">
          <h3>Seuil Regulier</h3>
          <p className="stat-value">
            <select
              value={minActiveMonths}
              onChange={(e) => setMinActiveMonths(parseInt(e.target.value))}
              style={{
                fontSize: "1.2rem",
                fontWeight: "bold",
                border: "2px solid #667eea",
                borderRadius: "6px",
                padding: "4px 8px",
                color: "#667eea",
                background: "white",
              }}
            >
              {minMonthsOptions.map((n) => (
                <option key={n} value={n}>
                  {n}+ mois actifs
                </option>
              ))}
            </select>
          </p>
        </div>
      </div>

      <div className="charts-grid">
        {registrationData.length > 0 && (
          <div className="chart-container full-width">
            <div className="chart-header-with-toggle">
              <h3>
                Nouveaux Utilisateurs par{" "}
                {userGranularity === "week" ? "Semaine" : "Mois"}
              </h3>
              <div className="granularity-toggle">
                <button
                  className={userGranularity === "week" ? "active" : ""}
                  onClick={() => setUserGranularity("week")}
                >
                  Semaine
                </button>
                <button
                  className={userGranularity === "month" ? "active" : ""}
                  onClick={() => setUserGranularity("month")}
                >
                  Mois
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={registrationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    value.toLocaleString(),
                    "Nouveaux utilisateurs",
                  ]}
                />
                <Bar
                  dataKey="count"
                  fill="#667eea"
                  name="Nouveaux utilisateurs"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {timelineData.length > 0 && (
          <div className="chart-container full-width">
            <h3>Utilisateurs Actifs par Mois</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    value.toLocaleString(),
                    name === "nouveaux"
                      ? "Nouveaux"
                      : name === "recurrents"
                        ? "Recurrents"
                        : "Total actifs",
                  ]}
                />
                <Legend
                  formatter={(value) =>
                    value === "nouveaux"
                      ? "Nouveaux"
                      : value === "recurrents"
                        ? "Recurrents"
                        : "Total actifs"
                  }
                />
                <Bar
                  dataKey="recurrents"
                  stackId="a"
                  fill="#667eea"
                  name="recurrents"
                />
                <Bar
                  dataKey="nouveaux"
                  stackId="a"
                  fill="#00C49F"
                  name="nouveaux"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {retentionData.length > 0 && (
          <div className="chart-container">
            <h3>Taux de Retention</h3>
            <p className="chart-subtitle">
              % d'utilisateurs actifs le mois precedent qui reviennent
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={retentionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip
                  formatter={(value, name, props) => {
                    if (name === "taux") {
                      return [
                        `${value}% (${props.payload.retenus}/${props.payload.total})`,
                        "Retention",
                      ];
                    }
                    return [value, name];
                  }}
                />
                <Legend formatter={() => "Taux de retention"} />
                <Line
                  type="monotone"
                  dataKey="taux"
                  stroke="#667eea"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#667eea" }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {distributionData.length > 0 && (
          <div className="chart-container">
            <h3>Distribution de l'Activite</h3>
            <p className="chart-subtitle">
              Nombre de mois actifs par utilisateur
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `${value} utilisateurs`,
                    name,
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserActivity;
