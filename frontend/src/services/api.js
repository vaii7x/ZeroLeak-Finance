/**
 * ZeroLeak API Service Client
 * Bridges the React frontend with the FastAPI backend.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function handleResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`;
    try {
      if (contentType.includes('application/json')) {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || JSON.stringify(errorJson);
      } else {
        errorDetail = await response.text();
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail || `HTTP error ${response.status}`);
  }

  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

/**
 * Health check
 */
export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse(res);
}

/**
 * Analyze financial CSV dataset and classify fields deterministically (M1)
 * @param {File} file - CSV file
 * @param {string} purpose - Stated purpose
 * @param {string} recipient - Designated recipient
 */
export async function analyzeDataset(file, purpose, recipient) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('purpose', purpose);
  formData.append('recipient', recipient);

  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

/**
 * Generate field necessity recommendations using AI provider abstraction (M2)
 * @param {string} purpose
 * @param {string} recipient
 * @param {Array} fields - List of FieldMetadata { name, type, sensitivity }
 */
export async function recommendFields(purpose, recipient, fields) {
  const res = await fetch(`${API_BASE}/api/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ purpose, recipient, fields }),
  });
  return handleResponse(res);
}

/**
 * Enforce deterministic policy decisions based on purpose and recipient strictness (M3)
 * @param {string} purpose
 * @param {string} recipient
 * @param {Array} fields
 * @param {Array} recommendations
 */
export async function evaluatePolicy(purpose, recipient, fields, recommendations) {
  const res = await fetch(`${API_BASE}/api/policy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ purpose, recipient, fields, recommendations }),
  });
  return handleResponse(res);
}

/**
 * Generate and persist reviewable Exposure Plan (M4)
 * @param {string} purpose
 * @param {string} recipient
 * @param {Array} fields
 * @param {Array} recommendations
 * @param {Array} decisions
 */
export async function createExposurePlan(purpose, recipient, fields, recommendations, decisions) {
  const res = await fetch(`${API_BASE}/api/exposure-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ purpose, recipient, fields, recommendations, decisions }),
  });
  return handleResponse(res);
}

/**
 * Retrieve a persisted Exposure Plan by ID (M4.1)
 * @param {string} exposurePlanId
 */
export async function getExposurePlan(exposurePlanId) {
  const res = await fetch(`${API_BASE}/api/exposure-plan/${exposurePlanId}`);
  return handleResponse(res);
}

/**
 * Approve an Exposure Plan, transitioning status to READY_TO_SHARE (M4.2)
 * @param {string} exposurePlanId
 */
export async function approveExposurePlan(exposurePlanId) {
  const res = await fetch(`${API_BASE}/api/exposure-plan/${exposurePlanId}/approve`, {
    method: 'POST',
  });
  return handleResponse(res);
}

/**
 * Sanitize CSV according to an approved Exposure Plan (M5)
 * @param {File|Blob} file - Original CSV file
 * @param {string} exposurePlanId - ID of approved plan
 * @param {boolean} approved - Must be true
 * @param {object} plan - Full ExposurePlanResponse object
 */
export async function sanitizeDataset(file, exposurePlanId, approved, plan) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('exposure_plan_id', exposurePlanId);
  formData.append('approved', String(approved));
  formData.append('plan', JSON.stringify(plan));

  const res = await fetch(`${API_BASE}/api/sanitize`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

/**
 * Independently validate a sanitized CSV against an approved Exposure Plan (M6)
 * @param {File|Blob} file - Sanitized CSV file / blob
 * @param {string} exposurePlanId - ID of approved plan
 * @param {boolean} approved - Must be true
 * @param {object} plan - Full ExposurePlanResponse object
 */
export async function validateDataset(file, exposurePlanId, approved, plan) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('exposure_plan_id', exposurePlanId);
  formData.append('approved', String(approved));
  formData.append('plan', JSON.stringify(plan));

  const res = await fetch(`${API_BASE}/api/validate`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}
