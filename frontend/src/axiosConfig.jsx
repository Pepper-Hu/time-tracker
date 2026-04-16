import axios from 'axios';

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

const apiBaseUrl = isLocalhost ? 'http://localhost:5001' : '';

const axiosInstance = axios.create({
  //baseURL: 'http://localhost:5001', // local
  //baseURL: 'http://54.252.160.190:5001', // old live direct backend
  // Use same-origin requests so Nginx can proxy /api to backend.
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

export default axiosInstance;
