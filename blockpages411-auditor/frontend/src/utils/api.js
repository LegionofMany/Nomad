import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

function adminHeaders(adminKey) {
  return adminKey ? { headers: { 'x-admin-api-key': adminKey } } : {};
}

export async function submitURL(url) {
  const response = await axios.post(`${API_BASE}/audit`, { url });
  return response.data;
}

export async function enqueueAudit(url) {
  const response = await axios.post(`${API_BASE}/audits`, { url });
  return response.data;
}

export async function getAuditStatus(auditId) {
  const response = await axios.get(`${API_BASE}/audits/${auditId}`);
  return response.data;
}

export async function getAuditReport(auditId) {
  const response = await axios.get(`${API_BASE}/audits/${auditId}/report`);
  return response.data;
}

export async function getRecentAudits(limit = 10) {
  const response = await axios.get(`${API_BASE}/audits/recent`, { params: { limit } });
  return response.data;
}

export async function getAdminRecentAudits(adminKey, limit = 25) {
  const response = await axios.get(`${API_BASE}/admin/audits/recent`, { ...adminHeaders(adminKey), params: { limit } });
  return response.data;
}

export async function saveAdminVerdict(adminKey, auditId, payload) {
  const response = await axios.post(`${API_BASE}/admin/audits/${auditId}/verdict`, payload, adminHeaders(adminKey));
  return response.data;
}

export async function exportThreatIntel(adminKey) {
  const response = await axios.get(`${API_BASE}/admin/export/threat-intel`, adminHeaders(adminKey));
  return response.data;
}
