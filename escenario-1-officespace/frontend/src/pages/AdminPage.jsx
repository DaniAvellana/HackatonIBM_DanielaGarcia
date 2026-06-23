import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSpaces, createSpace, deleteSpace, updateSpace, getAvailableSpaces } from '../services/api';

function AdminPage() {
  const navigate = useNavigate();
  const email = localStorage.getItem('email');

  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [todayAvailable, setTodayAvailable] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [filterStartTime, setFilterStartTime] = useState('');
  const [filterEndTime, setFilterEndTime] = useState('');
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const emptySpace = {
    name: '', type: 'SALA', capacity: 1, floor: '',
    has_projector: false, has_ac: false, has_microphone: false,
    has_screen: false, has_long_tables: false,
    has_movable_chairs: false, has_whiteboard: false
  };

  const [newSpace, setNewSpace] = useState(emptySpace);

  useEffect(() => {
    const init = async () => {
      await loadSpaces();
      await loadOccupancy(filterDate, '', '');
    };
    init();
  }, []);

  const loadSpaces = async () => {
    try {
      const response = await getSpaces();
      setSpaces(response.data);
      return response.data;
    } catch (err) {
      setError('Error al cargar espacios');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadOccupancy = async (date, startTime, endTime) => {
    setDashboardLoading(true);
    try {
      const now = new Date();
      const hoy = now.toLocaleDateString('en-CA');
      const nextMinute = new Date(now.getTime() + 60000);
      const horaActual = `${nextMinute.getHours().toString().padStart(2, '0')}:${nextMinute.getMinutes().toString().padStart(2, '0')}`;

      const start = startTime || (date === hoy ? horaActual : '00:01');
      const end = endTime || '23:59';

      const response = await getAvailableSpaces({
        date, start_time: start, end_time: end
      });
      setTodayAvailable(response.data);
    } catch (err) {
      const response = await getSpaces();
      setTodayAvailable(response.data);
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleDashboardFilter = async (e) => {
    e.preventDefault();
    await loadOccupancy(filterDate, filterStartTime, filterEndTime);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createSpace(newSpace);
      setMessage('✅ Espacio creado correctamente.');
      setShowForm(false);
      setNewSpace(emptySpace);
      await loadSpaces();
      await loadOccupancy(filterDate, filterStartTime, filterEndTime);
    } catch (err) {
      setError('Error al crear espacio');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateSpace(editingSpace.id, editingSpace);
      setMessage('✅ Espacio actualizado correctamente.');
      setEditingSpace(null);
      await loadSpaces();
      await loadOccupancy(filterDate, filterStartTime, filterEndTime);
    } catch (err) {
      setError('Error al actualizar espacio');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este espacio?')) return;
    try {
      await deleteSpace(id);
      setMessage('✅ Espacio eliminado correctamente.');
      await loadSpaces();
      await loadOccupancy(filterDate, filterStartTime, filterEndTime);
    } catch (err) {
      setError('Error al eliminar espacio');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const isOccupied = (space) => !todayAvailable.find(s => s.id === space.id);

  const recursos = [
    ['has_projector', '📽️ Proyector'],
    ['has_ac', '❄️ Aire acondicionado'],
    ['has_microphone', '🎤 Micrófono'],
    ['has_screen', '🖥️ Pantalla'],
    ['has_long_tables', '🪑 Mesas largas'],
    ['has_movable_chairs', '💺 Sillas movibles'],
    ['has_whiteboard', '📋 Pizarrón']
  ];

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

        {/* Dashboard */}
        <div style={styles.dashboard}>
          <h2>📊 Dashboard de Ocupación</h2>

          {/* Filtro de fecha para el dashboard */}
          <form onSubmit={handleDashboardFilter} style={styles.filterRow}>
            <div style={styles.filterField}>
              <label style={styles.label}>Fecha</label>
              <input type="date" value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={styles.input} required />
            </div>
            <div style={styles.filterField}>
              <label style={styles.label}>Hora inicio (opcional)</label>
              <input type="time" value={filterStartTime}
                onChange={(e) => setFilterStartTime(e.target.value)}
                style={styles.input} />
            </div>
            <div style={styles.filterField}>
              <label style={styles.label}>Hora fin (opcional)</label>
              <input type="time" value={filterEndTime}
                onChange={(e) => setFilterEndTime(e.target.value)}
                style={styles.input} />
            </div>
            <div style={styles.filterField}>
              <label style={styles.label}>&nbsp;</label>
              <button type="submit" style={styles.filterBtn} disabled={dashboardLoading}>
                {dashboardLoading ? 'Cargando...' : '🔍 Ver ocupación'}
              </button>
            </div>
          </form>

          {/* Tarjetas resumen */}
          <div style={styles.dashGrid}>
            <div style={styles.dashCard}>
              <div style={styles.dashNumber}>{spaces.length}</div>
              <div style={styles.dashLabel}>Total de espacios</div>
            </div>
            <div style={styles.dashCard}>
              <div style={{...styles.dashNumber, color: '#48bb78'}}>
                {todayAvailable.length}
              </div>
              <div style={styles.dashLabel}>Disponibles</div>
            </div>
            <div style={styles.dashCard}>
              <div style={{...styles.dashNumber, color: '#e53e3e'}}>
                {spaces.length - todayAvailable.length}
              </div>
              <div style={styles.dashLabel}>Ocupados</div>
            </div>
            <div style={styles.dashCard}>
              <div style={{...styles.dashNumber, color: '#4f46e5'}}>
                {spaces.length > 0 ? Math.round(((spaces.length - todayAvailable.length) / spaces.length) * 100) : 0}%
              </div>
              <div style={styles.dashLabel}>Tasa de ocupación</div>
            </div>
          </div>

          {/* Estado por espacio */}
          <h3 style={{marginTop: '24px'}}>Estado de espacios</h3>
          <div style={styles.statusGrid}>
            {spaces.map(space => {
              const occupied = isOccupied(space);
              return (
                <div key={space.id} style={{
                  ...styles.statusCard,
                  borderLeft: `4px solid ${occupied ? '#e53e3e' : '#48bb78'}`
                }}>
                  <div style={styles.statusHeader}>
                    <span style={styles.statusName}>{space.name}</span>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: occupied ? '#fed7d7' : '#c6f6d5',
                      color: occupied ? '#9b2c2c' : '#276749'
                    }}>
                      {occupied ? '🔴 Ocupado' : '🟢 Libre'}
                    </span>
                  </div>
                  <span style={styles.statusInfo}>
                    {space.floor} — {space.type === 'SALA' ? 'Sala' : 'Escritorio'} — {space.capacity} personas
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gestión */}
        <div style={styles.topBar}>
          <h2>Gestión de Espacios</h2>
          <button onClick={() => { setShowForm(!showForm); setEditingSpace(null); }} style={styles.addBtn}>
            {showForm ? 'Cancelar' : '+ Nuevo Espacio'}
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.success}>{message}</p>}

        {/* Formulario crear */}
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
              {recursos.map(([key, label]) => (
                <label key={key} style={styles.checkbox}>
                  <input type="checkbox" checked={newSpace[key]}
                    onChange={(e) => setNewSpace({...newSpace, [key]: e.target.checked})} />
                  {' '}{label}
                </label>
              ))}
            </div>
            <button type="submit" style={styles.saveBtn}>✅ Guardar Espacio</button>
          </form>
        )}

        {/* Formulario editar */}
        {editingSpace && (
          <form onSubmit={handleUpdate} style={{...styles.form, borderLeft: '4px solid #4f46e5'}}>
            <h3>✏️ Editando: {editingSpace.name}</h3>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Nombre</label>
                <input value={editingSpace.name}
                  onChange={(e) => setEditingSpace({...editingSpace, name: e.target.value})}
                  style={styles.input} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Tipo</label>
                <select value={editingSpace.type}
                  onChange={(e) => setEditingSpace({...editingSpace, type: e.target.value})}
                  style={styles.input}>
                  <option value="SALA">Sala de juntas</option>
                  <option value="DESK">Escritorio</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Capacidad</label>
                <input type="number" value={editingSpace.capacity} min="1"
                  onChange={(e) => setEditingSpace({...editingSpace, capacity: parseInt(e.target.value)})}
                  style={styles.input} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Piso</label>
                <input value={editingSpace.floor}
                  onChange={(e) => setEditingSpace({...editingSpace, floor: e.target.value})}
                  style={styles.input} />
              </div>
            </div>
            <div style={styles.checkboxRow}>
              {recursos.map(([key, label]) => (
                <label key={key} style={styles.checkbox}>
                  <input type="checkbox" checked={editingSpace[key]}
                    onChange={(e) => setEditingSpace({...editingSpace, [key]: e.target.checked})} />
                  {' '}{label}
                </label>
              ))}
            </div>
            <div style={{display: 'flex', gap: '12px'}}>
              <button type="button" onClick={() => setEditingSpace(null)} style={styles.cancelBtn}>
                Cancelar
              </button>
              <button type="submit" style={styles.saveBtn}>💾 Guardar Cambios</button>
            </div>
          </form>
        )}

        {/* Tabla */}
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
                <th style={styles.th}>Estado</th>
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
                    <span style={{
                      padding: '4px 8px', borderRadius: '12px', fontSize: '12px',
                      backgroundColor: isOccupied(space) ? '#fed7d7' : '#c6f6d5',
                      color: isOccupied(space) ? '#9b2c2c' : '#276749'
                    }}>
                      {isOccupied(space) ? '🔴 Ocupado' : '🟢 Libre'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button onClick={() => { setEditingSpace(space); setShowForm(false); }} style={styles.editBtn}>
                      ✏️ Editar
                    </button>
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
  dashboard: {
    backgroundColor: 'white', padding: '24px',
    borderRadius: '12px', marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  filterRow: {
    display: 'flex', gap: '16px', flexWrap: 'wrap',
    marginTop: '16px', marginBottom: '16px',
    padding: '16px', backgroundColor: '#f7f7f7', borderRadius: '8px'
  },
  filterField: { flex: 1, minWidth: '150px' },
  filterBtn: {
    width: '100%', padding: '10px', backgroundColor: '#4f46e5',
    color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
  },
  dashGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px', marginTop: '16px'
  },
  dashCard: {
    backgroundColor: '#f7f7f7', padding: '20px',
    borderRadius: '10px', textAlign: 'center'
  },
  dashNumber: { fontSize: '36px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '8px' },
  dashLabel: { color: '#666', fontSize: '14px' },
  statusGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '12px', marginTop: '12px'
  },
  statusCard: {
    backgroundColor: '#f7f7f7', padding: '16px',
    borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px'
  },
  statusHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statusName: { fontWeight: 'bold', color: '#1a1a2e' },
  statusBadge: { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  statusInfo: { fontSize: '13px', color: '#666' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  addBtn: {
    padding: '10px 20px', backgroundColor: '#4f46e5',
    color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
  },
  error: { color: '#e53e3e', backgroundColor: '#fff5f5', padding: '10px', borderRadius: '6px', marginBottom: '16px' },
  success: { color: '#276749', backgroundColor: '#c6f6d5', padding: '10px', borderRadius: '6px', marginBottom: '16px' },
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
  cancelBtn: {
    padding: '12px 24px', backgroundColor: '#e2e8f0',
    color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer'
  },
  table: {
    width: '100%', backgroundColor: 'white', borderRadius: '12px',
    overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderCollapse: 'collapse'
  },
  tableHeader: { backgroundColor: '#4f46e5', color: 'white' },
  th: { padding: '12px 16px', textAlign: 'left' },
  tableRow: { borderBottom: '1px solid #e2e8f0' },
  td: { padding: '12px 16px' },
  editBtn: {
    padding: '6px 12px', backgroundColor: '#4f46e5',
    color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px'
  },
  deleteBtn: {
    padding: '6px 12px', backgroundColor: '#e53e3e',
    color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
  }
};

export default AdminPage;