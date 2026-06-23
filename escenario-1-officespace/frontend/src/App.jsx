// Importamos las herramientas de navegación
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importamos las 4 pantallas
import LoginPage from './pages/LoginPage';
import SearchPage from './pages/SearchPage';
import ConfirmBookingPage from './pages/ConfirmBookingPage';
import AdminPage from './pages/AdminPage';
import MyBookingsPage from './pages/MyBookingsPage';

// Función que verifica si el usuario está autenticado
const isAuthenticated = () => !!localStorage.getItem('token');

// Función que verifica si el usuario es administrador
const isAdmin = () => localStorage.getItem('role') === 'ADMINISTRADOR';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pantalla de login - ruta principal */}
        <Route path="/" element={<LoginPage />} />

        {/* Pantalla de búsqueda de espacios */}
        <Route path="/search" element={
          isAuthenticated() ? <SearchPage /> : <Navigate to="/" />
        } />

        {/* Pantalla de confirmación de reserva */}
        <Route path="/confirm" element={
          isAuthenticated() ? <ConfirmBookingPage /> : <Navigate to="/" />
        } />

        {/* Pantalla de administración - solo admin */}
        <Route path="/admin" element={
          isAdmin() ? <AdminPage /> : <Navigate to="/" />
        } />

        <Route path="/my-bookings" element={
          isAuthenticated() ? <MyBookingsPage /> : <Navigate to="/" />
        } />

      </Routes>
    </BrowserRouter>
  );
}

export default App;