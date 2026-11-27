import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// show the backend's { error: "..." } message instead of a generic one
api.interceptors.response.use(
  (res) => res,
  (err) => {
    err.message = err.response?.data?.error || 'Cannot reach server';
    return Promise.reject(err);
  }
);

export default api;
