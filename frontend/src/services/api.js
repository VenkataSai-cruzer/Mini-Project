/**
 * Central API service.
 * All backend calls go through this module.
 * The Vite dev proxy forwards /api/* to http://localhost:3001.
 */

import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('ztg_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear token AND dispatch a custom event so AuthContext can react
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ztg_token');
      localStorage.removeItem('ztg_user');
      // Notify AuthContext that the session has expired
      window.dispatchEvent(new CustomEvent('ztg:session-expired'));
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  const { data } = await client.post('/auth/login', { email, password });
  return data; // { token, user }
}

export async function getMe() {
  const { data } = await client.get('/auth/me');
  return data;
}

// ── Access ────────────────────────────────────────────────────────────────────

export async function getResources() {
  const { data } = await client.get('/access/resources');
  return data;
}

export async function evaluateAccess(payload) {
  const { data } = await client.post('/access/evaluate', payload);
  return data; // { accessRequestId, policyResult, incident }
}

export async function verifyOtp(code, accessRequestId) {
  const { data } = await client.post('/access/verify', { code, accessRequestId });
  return data; // { success }
}

export async function revaluateSession(payload) {
  const { data } = await client.post('/access/revaluate', payload);
  return data; // { policyResult, incident }
}

// ── Incidents ─────────────────────────────────────────────────────────────────

export async function getIncidents() {
  const { data } = await client.get('/incidents');
  return data;
}

export async function getIncident(id) {
  const { data } = await client.get(`/incidents/${id}`);
  return data;
}

export async function updateIncidentStatus(id, status) {
  const { data } = await client.patch(`/incidents/${id}/status`, { status });
  return data;
}

// ── Audit log ─────────────────────────────────────────────────────────────────

export async function getAuditEvents(filter = 'all') {
  const { data } = await client.get('/audit', { params: { filter } });
  return data;
}

// ── Health ────────────────────────────────────────────────────────────────────

export async function healthCheck() {
  const { data } = await client.get('/health');
  return data;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const { data } = await client.get('/dashboard/stats');
  return data;
}
