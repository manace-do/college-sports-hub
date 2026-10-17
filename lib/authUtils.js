// Secure authentication utilities for Sports Hub

// Primary Admin USN and its precomputed SHA-256 hash (never storing plaintext password in code)
export const PRIMARY_ADMIN_USN = '1AH24CS212';
// SHA-256 of the admin password
const PRIMARY_ADMIN_PASSWORD_HASH = '71abdee85ee0c7e19f082f8c05472be8b02af6e1672efcb13b47bb1df50ae917';

// Pre-seeded hashes for demo student accounts (password: student123)
const DEFAULT_STUDENT_HASH = '703b0a3d6ad75b649a28adde7d83c6251da457549263bc7ff45ec709b0a8448b';

const LOCAL_CREDENTIALS_KEY = 'sports_hub_local_credentials';

/**
 * Computes SHA-256 cryptographic hash of a password string.
 * Uses window.crypto.subtle in browser and Node's crypto in server environments.
 */
export async function hashPassword(password) {
  if (!password) return '';

  if (globalThis.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for older environments
  try {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(password).digest('hex');
  } catch (e) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      hash = ((hash << 5) - hash) + password.charCodeAt(i);
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(16);
  }
}

/**
 * Retrieves the local credentials table from browser localStorage.
 */
export function getLocalCredentials() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_CREDENTIALS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Saves a hashed password for a user identifier (USN and optional personal email).
 */
export async function registerLocalCredentials(usn, password, personalEmail = null) {
  if (!password) return false;
  const hash = await hashPassword(password);

  if (typeof localStorage !== 'undefined') {
    try {
      const creds = getLocalCredentials();
      if (usn) {
        creds[usn.trim().toUpperCase()] = hash;
      }
      if (personalEmail && personalEmail.includes('@')) {
        creds[personalEmail.trim().toLowerCase()] = hash;
      }
      localStorage.setItem(LOCAL_CREDENTIALS_KEY, JSON.stringify(creds));
      return true;
    } catch (e) {
      console.warn('Could not save local credentials:', e);
    }
  }
  return true;
}

/**
 * Verifies if entered password matches the stored hash for a USN or Personal Email in local mode.
 */
export async function verifyLocalCredentials(identifier, password) {
  if (!identifier || !password) return false;
  const rawId = identifier.trim();
  const cleanUsn = rawId.toUpperCase();
  const cleanEmail = rawId.toLowerCase();
  const inputHash = await hashPassword(password);

  // 1. Check Primary Admin Account
  if (cleanUsn === PRIMARY_ADMIN_USN || cleanEmail === '1ah24cs212@college.edu') {
    const creds = getLocalCredentials();
    if (creds[PRIMARY_ADMIN_USN]) {
      return creds[PRIMARY_ADMIN_USN] === inputHash;
    }
    return inputHash === PRIMARY_ADMIN_PASSWORD_HASH;
  }

  // 2. Check local credentials store (by USN or Personal Email)
  const creds = getLocalCredentials();
  if (creds[cleanUsn] && creds[cleanUsn] === inputHash) {
    return true;
  }
  if (creds[cleanEmail] && creds[cleanEmail] === inputHash) {
    return true;
  }

  // 3. Fallback for demo student accounts (e.g. 1MS21CS015, 1MS22EC034, 1MS20ME008)
  if (cleanUsn.startsWith('1MS')) {
    return inputHash === DEFAULT_STUDENT_HASH;
  }

  return false;
}
