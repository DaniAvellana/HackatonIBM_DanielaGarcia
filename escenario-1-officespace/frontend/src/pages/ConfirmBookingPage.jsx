import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBooking } from '../services/api';

function ConfirmBookingPage() {
  const navigate = useNavigate();

  // Recuperamos los datos guardados en localStorage
  const space = JSON.parse(localStorage.getItem('selectedSpace') || '{}');
  const bookingData = JSON.parse(localStorage.getItem('bookingData') || '{}');

  const [attendees, setAttendees] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      await createBooking({
        space_id: space.id,
        date: bookingData.date,
        start_time: bookingData.start_time,
        end_time: bookingData.end_time,
        attendees: parseInt(attendees)
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la reserva');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✅</div>
          <h2>¡Reserva confirmada!</h2>
          <p>Tu espacio ha sido reservado exitosamente.</p>
          <p><strong>{space.name}</strong></p>
          <p>📅 {bookingData.date} | ⏰ {bookingData.start_time} - {bookingData.end_time}</p>
          <button onClick={() => navigate('/search')} style={styles.btn}>
            Hacer otra reserva
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Confirmar Reserva</h2>

        <div style={styles.summary}>
          <h3>📋 Resumen</h3>
          <p><strong>Espacio:</strong> {space.name}</p>
          <p><strong>Tipo:</strong> {space.type === 'SALA' ? 'Sala de juntas' : 'Escritorio'}</p>
          <p><strong>Piso:</strong> {space.floor}</p>
          <p><strong>Capacidad máxima:</strong> {space.capacity} personas</p>
          <p><strong>Fecha:</strong> {bookingData.date}</p>
          <p><strong>Horario:</strong> {bookingData.start_time} - {bookingData.end_time}</p>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Número de asistentes (máximo {space.capacity})
          </label>
          <input
            type="number"
            value={attendees}
            onChange={(e) => setAttendees(e.target.value)}
            min="1"
            max={space.capacity}
            style={styles.input}
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.buttons}>
          <button onClick={() => navigate('/search')} style={styles.cancelBtn}>
            Cancelar
          </button>
          <button onClick={handleConfirm} style={styles.confirmBtn} disabled={loading}>
            {loading ? 'Confirmando...' : '✅ Confirmar Reserva'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh', backgroundColor: '#f0f2f5',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  card: {
    backgroundColor: 'white', padding: '40px', borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '500px'
  },
  successCard: {
    backgroundColor: 'white', padding: '40px', borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center',
    width: '100%', maxWidth: '400px'
  },
  successIcon: { fontSize: '64px', marginBottom: '16px' },
  title: { color: '#1a1a2e', marginBottom: '24px' },
  summary: {
    backgroundColor: '#f7f7f7', padding: '16px',
    borderRadius: '8px', marginBottom: '24px'
  },
  field: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#333' },
  input: {
    width: '100%', padding: '10px', borderRadius: '6px',
    border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box'
  },
  error: {
    color: '#e53e3e', backgroundColor: '#fff5f5',
    padding: '10px', borderRadius: '6px', marginBottom: '12px'
  },
  buttons: { display: 'flex', gap: '12px' },
  cancelBtn: {
    flex: 1, padding: '12px', backgroundColor: '#e2e8f0',
    color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer'
  },
  confirmBtn: {
    flex: 2, padding: '12px', backgroundColor: '#48bb78',
    color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
  },
  btn: {
    padding: '12px 24px', backgroundColor: '#4f46e5',
    color: 'white', border: 'none', borderRadius: '6px',
    cursor: 'pointer', marginTop: '16px'
  }
};

export default ConfirmBookingPage;