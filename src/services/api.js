import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const statisticsAPI = {
  getAvailableGrids: async () => {
    const response = await api.get('/api/v1/statistics/grids');
    return response.data;
  },

  getGridStatistics: async (gridId) => {
    const response = await api.get(`/api/v1/statistics/grid/${gridId}`);
    return response.data;
  },

  getLeaderboard: async (gridId, limit = 100) => {
    const response = await api.get(`/api/v1/statistics/grid/${gridId}/leaderboard`, {
      params: { limit },
    });
    return response.data;
  },

  getScoreDistribution: async (gridId) => {
    const response = await api.get(`/api/v1/statistics/grid/${gridId}/distribution`);
    return response.data;
  },

  getCompletionTimeDistribution: async (gridId, maxMinutes = null) => {
    const params = maxMinutes != null ? { max_minutes: maxMinutes } : {};
    const response = await api.get(`/api/v1/statistics/grid/${gridId}/completion-time-distribution`, { params });
    return response.data;
  },

  getTemporalStatistics: async (gridId) => {
    const response = await api.get(`/api/v1/statistics/grid/${gridId}/temporal`);
    return response.data;
  },

  getNewUsersRegistrations: async (granularity = 'month') => {
    const response = await api.get('/api/v1/statistics/users/registrations', {
      params: { granularity },
    });
    return response.data;
  },

  getUserActivity: async (monthsLookback = 6, minActiveMonths = 2) => {
    const response = await api.get('/api/v1/statistics/users/activity', {
      params: { months_lookback: monthsLookback, min_active_months: minActiveMonths },
    });
    return response.data;
  },

  getGlobalStatistics: async (period = null) => {
    const params = period ? { period } : {};
    const response = await api.get('/api/v1/statistics/global', { params });
    return response.data;
  },

  getTypeStatistics: async () => {
    const response = await api.get('/api/v1/statistics/types');
    return response.data;
  },

  getDuelOverview: async () => {
    const response = await api.get('/api/v1/statistics/duels/overview');
    return response.data;
  },

  getDuelLeaderboard: async (limit = 50) => {
    const response = await api.get('/api/v1/statistics/duels/leaderboard', {
      params: { limit },
    });
    return response.data;
  },

  getPremiumStatistics: async () => {
    const response = await api.get('/api/v1/statistics/premium');
    return response.data;
  },
};

export default api;
