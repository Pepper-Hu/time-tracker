import axios from 'axios';

const axiosInstance = axios.create({
  //baseURL: 'http://localhost:5001', // local
  //baseURL: 'http://54.252.160.190:5001', // old live direct backend
  // Use same-origin requests so Nginx can proxy /api to backend.
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
});

export default axiosInstance;
