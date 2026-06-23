// Importamos axios para hacer peticiones HTTP
import axios from 'axios';

// URLs base de nuestros dos servicios
const CATALOG_URL = 'http://localhost:3000';
const BOOKING_URL = 'http://localhost:3001';

// Función para obtener el token guardado
const getToken = () => localStorage.getItem('token');

// Cabecera con el token para peticiones autenticadas
const authHeader = () => ({
  headers: { Authorization: `Bearer ${getToken()}` }
});

// ===== AUTH =====
export const login = (email, password) =>
  axios.post(`${CATALOG_URL}/auth/login`, { email, password });

// ===== SPACES =====
export const getSpaces = () =>
  axios.get(`${CATALOG_URL}/spaces`, authHeader());

export const createSpace = (data) =>
  axios.post(`${CATALOG_URL}/spaces`, data, authHeader());

export const updateSpace = (id, data) =>
  axios.put(`${CATALOG_URL}/spaces/${id}`, data, authHeader());

export const deleteSpace = (id) =>
  axios.delete(`${CATALOG_URL}/spaces/${id}`, authHeader());

// ===== BOOKINGS =====
export const getAvailableSpaces = (params) =>
  axios.get(`${BOOKING_URL}/bookings/available`, { ...authHeader(), params });

export const createBooking = (data) =>
  axios.post(`${BOOKING_URL}/bookings`, data, authHeader());

export const getMyBookings = () =>
  axios.get(`${BOOKING_URL}/bookings/my`, authHeader());

export const cancelBooking = (id) =>
  axios.delete(`${BOOKING_URL}/bookings/${id}`, authHeader());