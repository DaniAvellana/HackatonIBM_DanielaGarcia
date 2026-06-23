import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailableSpaces } from '../services/api';

function SearchPage() {
  const navigate = useNavigate();
  const email = localStorage.getItem('email');

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState('');
  const [capacity, setCapacity] = useState('');
  const [spaces, setSpaces] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validamos que la fecha no sea anterior a hoy
    const ahora = new Date();
    const fechaHoraInicio = new Date(`${date}T${startTime}`);
    if (fechaHoraInicio < ahora) {
      setError('⚠️ La hora de inicio ya pasó. Por favor selecciona un horario futuro.');
      setLoading(false);
      return;
    }

    // Validamos que hora fin sea mayor a hora inicio
    if (endTime <= startTime) {
      setError('⚠️ La hora de fin debe ser mayor a la hora de inicio.');
      setLoading(false);
      return;
    }

    try {
      const response = await getAvailableSpaces({
        date, start_time: startTime, end_time: endTime, type, capacity
      });
      setSpaces(response.data);
      setSearched(true);
    } catch (err) {
      const mensaje = err.response?.data?.error;
      if (mensaje?.includes('pasado')) {
        setError('⚠️ La fecha seleccionada ya pasó. Por favor selecciona una fecha futura.');
      } else if (mensaje?.includes('hora de fin')) {
        setError('⚠️ La hora de fin debe ser mayor a la hora de inicio.');
      } else {
        setError(`⚠️ ${mensaje || 'Error al buscar espacios.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = (space) => {
    // Guardamos el espacio seleccionado y los datos de la reserva
    localStorage.setItem('selectedSpace', JSON.stringify(space));
    localStorage.setItem('bookingData', JSON.stringify({
      date, start_time: startTime, end_time: endTime
    }));
    navigate('/confirm');
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🏢 OfficeSpace</h1>
        <div>
          <span style={styles.userInfo}>👤 {email}</span>
          <button onClick={() => navigate('/my-bookings')} style={styles.navBtn}>Mis Reservas</button>
          <button onClick={handleLogout} style={styles.logoutBtn}>Cerrar Sesión</button>
        </div>
      </div>

      <div style={styles.content}>
        <h2>Buscar Espacios Disponibles</h2>

        <form onSubmit={handleSearch} style={styles.form}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Fecha</label>
              <input type="date" value={date}
                onChange={(e) => setDate(e.target.value)}
                style={styles.input} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Hora inicio</label>
              <input type="time" value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={styles.input} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Hora fin</label>
              <input type="time" value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={styles.input} required />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Tipo de espacio</label>
              <select value={type} onChange={(e) => setType(e.target.value)} style={styles.input}>
                <option value="">Todos</option>
                <option value="SALA">Sala de juntas</option>
                <option value="DESK">Escritorio</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Capacidad mínima</label>
              <input type="number" value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Ej: 4" style={styles.input} min="1" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>&nbsp;</label>
              <button type="submit" style={styles.searchBtn} disabled={loading}>
                {loading ? 'Buscando...' : '🔍 Buscar'}
              </button>
            </div>
          </div>
        </form>

        {error && <p style={styles.error}>{error}</p>}

        {searched && (
          <div style={styles.results}>
            <h3>Espacios disponibles ({spaces.length})</h3>
            {spaces.length === 0 ? (
              <p style={styles.noResults}>No hay espacios disponibles para ese horario.</p>
            ) : (
              <div style={styles.grid}>
                {spaces.map(space => (
                  <div key={space.id} style={styles.card}>
                    <h4 style={styles.spaceName}>{space.name}</h4>
                    <p>📍 {space.floor}</p>
                    <p>👥 Capacidad: {space.capacity} personas</p>
                    <p>🏷️ {space.type === 'SALA' ? 'Sala de juntas' : 'Escritorio'}</p>
                    <div style={styles.amenities}>
                      {space.has_projector && <span style={styles.tag}>📽️ Proyector</span>}
                      {space.has_ac && <span style={styles.tag}>❄️ A/C</span>}
                      {space.has_microphone && <span style={styles.tag}>🎤 Micrófono</span>}
                      {space.has_screen && <span style={styles.tag}>🖥️ Pantalla</span>}
                      {space.has_whiteboard && <span style={styles.tag}>📋 Pizarrón</span>}
                    </div>
                    <button onClick={() => handleReserve(space)} style={styles.reserveBtn}>
                      Reservar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f0f2f5' },
  header: {
    backgroundColor: '#4f46e5', color: 'white', padding: '16px 32px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  title: { margin: 0, fontSize: '24px' },
  userInfo: { marginRight: '16px', fontSize: '14px' },
  navBtn: {
    padding: '8px 16px', marginRight: '8px', backgroundColor: 'transparent',
    color: 'white', border: '1px solid white', borderRadius: '6px', cursor: 'pointer'
  },
  logoutBtn: {
    padding: '8px 16px', backgroundColor: '#e53e3e',
    color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
  },
  content: { padding: '32px', maxWidth: '1200px', margin: '0 auto' },
  form: {
    backgroundColor: 'white', padding: '24px',
    borderRadius: '12px', marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  row: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  field: { flex: 1, minWidth: '200px' },
  label: { display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#333' },
  input: {
    width: '100%', padding: '10px', borderRadius: '6px',
    border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box'
  },
  searchBtn: {
    width: '100%', padding: '10px', backgroundColor: '#4f46e5',
    color: 'white', border: 'none', borderRadius: '6px',
    fontSize: '14px', cursor: 'pointer'
  },
  error: { color: '#e53e3e', padding: '10px', backgroundColor: '#fff5f5', borderRadius: '6px' },
  results: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  noResults: { color: '#666', textAlign: 'center', padding: '32px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' },
  card: { border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' },
  spaceName: { color: '#4f46e5', marginBottom: '8px' },
  amenities: { display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '12px 0' },
  tag: { backgroundColor: '#eef2ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' },
  reserveBtn: {
    width: '100%', padding: '10px', backgroundColor: '#48bb78',
    color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '8px'
  }
};

export default SearchPage;