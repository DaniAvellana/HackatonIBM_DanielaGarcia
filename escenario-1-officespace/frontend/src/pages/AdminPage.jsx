import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSpaces, createSpace, deleteSpace, getAvailableSpaces } from '../services/api';

function AdminPage() {
  const navigate = useNavigate();
  const email = localStorage.getItem('email');

  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [todayBookings, setTodayBookings] = useState([]);
  const [showDashboard, setShowDashboard] = useState(true);
  const [newSpace, setNewSpace] = useState({
    name: '', type: 'SALA', capacity: 1, floor: '',
    has_projector: false, has_ac: false, has_microphone: false,
    has_screen: false, has_long_tables: false,
    has_movable_chairs: false, has_whiteboard: false
  });

  useEffect(() => {
    loadSpaces();
    loadTodayOccupancy();
  }, []);

  const loadTodayOccupancy = async () => {
    try {
      // Obtenemos la fecha de hoy
      const today = new Date().toISOString().split('T')[0];

      // Buscamos espacios disponibles ahora mismo
      const now = new Date();
      const startTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const endTime = '23:59';

      const response = await getAvailableSpaces({
        date: today,
        start_time: startTime,
        end_time: endTime
      });

      setTodayBookings(response.data);
    } catch (err) {
      console.log('Error cargando ocupación');
    }
  };

  const loadSpaces = async () => {
    try {
      const response = await getSpaces();
      setSpaces(response.data);
    } catch (err) {
      setError('Error al cargar espacios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createSpace(newSpace);
      setShowForm(false);
      setNewSpace({
        name: '', type: 'SALA', capacity: 1, floor: '',
        has_projector: false, has_ac: false, has_microphone: false,
        has_screen: false, has_long_tables: false,
        has_movable_chairs: false, has_whiteboard: false
      });
      loadSpaces();
    } catch (err) {
      setError('Error al crear espacio');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este espacio?')) return;
    try {
      await deleteSpace(id);
      loadSpaces();
    } catch (err) {
      setError('Error al eliminar espacio');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🏢 OfficeSpace — Admin</h1>
        <div>
          <span style={styles.userInfo}>👤 {email}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>Cerrar Sesión</button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Dashboard de ocupación */}
        <div style={styles.dashboard}>
          <h2>📊 Dashboard de Ocupación — Hoy</h2>
          <div style={styles.dashGrid}>
            <div style={styles.dashCard}>
              <div style={styles.dashNumber}>{spaces.length}</div>
              <div style={styles.dashLabel}>Total de espacios</div>
            </div>
            <div style={styles.dashCard}>
              <div style={{...styles.dashNumber, color: '#48bb78'}}>
                {todayBookings.length}
              </div>
              <div style={styles.dashLabel}>Disponibles ahora</div>
            </div>
            <div style={styles.dashCard}>
              <div style={{...styles.dashNumber, color: '#e53e3e'}}>
                {spaces.length - todayBookings.length}
              </div>
              <div style={styles.dashLabel}>Ocupados ahora</div>
            </div>
            <div style={styles.dashCard}>
              <div style={{...styles.dashNumber, color: '#4f46e5'}}>
                {spaces.length > 0 ? Math.round(((spaces.length - todayBookings.length) / spaces.length) * 100) : 0}%
              </div>
              <div style={styles.dashLabel}>Tasa de ocupación</div>
            </div>
          </div>
        </div>
        <div style={styles.topBar}>
          <h2>Gestión de Espacios</h2>
          <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>
            {showForm ? 'Cancelar' : '+ Nuevo Espacio'}
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {showForm && (
          <form onSubmit={handleCreate} style={styles.form}>
            <h3>Crear Nuevo Espacio</h3>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Nombre</label>
                <input value={newSpace.name}
                  onChange={(e) => setNewSpace({...newSpace, name: e.target.value})}
                  style={styles.input} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Tipo</label>
                <select value={newSpace.type}
                  onChange={(e) => setNewSpace({...newSpace, type: e.target.value})}
                  style={styles.input}>
                  <option value="SALA">Sala de juntas</option>
                  <option value="DESK">Escritorio</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Capacidad</label>
                <input type="number" value={newSpace.capacity} min="1"
                  onChange={(e) => setNewSpace({...newSpace, capacity: parseInt(e.target.value)})}
                  style={styles.input} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Piso</label>
                <input value={newSpace.floor}
                  onChange={(e) => setNewSpace({...newSpace, floor: e.target.value})}
                  style={styles.input} />
              </div>
            </div>

            <div style={styles.checkboxRow}>
              {[
                ['has_projector', '📽️ Proyector'],
                ['has_ac', '❄️ Aire acondicionado'],
                ['has_microphone', '🎤 Micrófono'],
                ['has_screen', '🖥️ Pantalla'],
                ['has_long_tables', '🪑 Mesas largas'],
                ['has_movable_chairs', '💺 Sillas movibles'],
                ['has_whiteboard', '📋 Pizarrón']
              ].map(([key, label]) => (
                <label key={key} style={styles.checkbox}>
                  <input type="checkbox" checked={newSpace[key]}
                    onChange={(e) => setNewSpace({...newSpace, [key]: e.target.checked})} />
                  {' '}{label}
                </label>
              ))}
            </div>

            <button type="submit" style={styles.saveBtn}>Guardar Espacio</button>
          </form>
        )}

        {loading ? (
          <p>Cargando espacios...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Capacidad</th>
                <th style={styles.th}>Piso</th>
                <th style={styles.th}>Recursos</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {spaces.map(space => (
                <tr key={space.id} style={styles.tableRow}>
                  <td style={styles.td}>{space.name}</td>
                  <td style={styles.td}>{space.type === 'SALA' ? 'Sala' : 'Escritorio'}</td>
                  <td style={styles.td}>{space.capacity} personas</td>
                  <td style={styles.td}>{space.floor}</td>
                  <td style={styles.td}>
                    {space.has_projector && '📽️ '}
                    {space.has_ac && '❄️ '}
                    {space.has_microphone && '🎤 '}
                    {space.has_screen && '🖥️ '}
                    {space.has_whiteboard && '📋 '}
                  </td>
                  <td style={styles.td}>
                    <button onClick={() => handleDelete(space.id)} style={styles.deleteBtn}>
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
  logoutBtn: {
    padding: '8px 16px', backgroundColor: '#e53e3e',
    color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
  },
  content: { padding: '32px', maxWidth: '1200px', margin: '0 auto' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  addBtn: {
    padding: '10px 20px', backgroundColor: '#4f46e5',
    color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
  },
  error: { color: '#e53e3e', backgroundColor: '#fff5f5', padding: '10px', borderRadius: '6px' },
  form: {
    backgroundColor: 'white', padding: '24px', borderRadius: '12px',
    marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  row: { display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' },
  field: { flex: 1, minWidth: '200px' },
  label: { display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#333' },
  input: {
    width: '100%', padding: '10px', borderRadius: '6px',
    border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box'
  },
  checkboxRow: { display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' },
  checkbox: { display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' },
  saveBtn: {
    padding: '12px 24px', backgroundColor: '#48bb78',
    color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
  },
  table: { width: '100%', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#4f46e5', color: 'white' },
  th: { padding: '12px 16px', textAlign: 'left' },
  tableRow: { borderBottom: '1px solid #e2e8f0' },
  td: { padding: '12px 16px' },
  deleteBtn: {
    padding: '6px 12px', backgroundColor: '#e53e3e',
    color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
  },
  dashboard: {
    backgroundColor: 'white', padding: '24px',
    borderRadius: '12px', marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  dashGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px', marginTop: '16px'
  },
  dashCard: {
    backgroundColor: '#f7f7f7', padding: '20px',
    borderRadius: '10px', textAlign: 'center'
  },
  dashNumber: {
    fontSize: '36px', fontWeight: 'bold',
    color: '#1a1a2e', marginBottom: '8px'
  },
  dashLabel: { color: '#666', fontSize: '14px' }
};

export default AdminPage;