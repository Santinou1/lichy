import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Pedidos.css';
import { useUserContext } from '../UserProvider';

function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useUserContext();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Componente Pedidos montado');
    cargarPedidos();
    return () => {
      console.log('Componente Pedidos desmontado');
    };
  }, []);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      console.log('Intentando cargar pedidos desde:', 'http://localhost:5000/api/pedidos');
      const response = await axios.get('http://localhost:5000/api/pedidos');
      console.log('Datos de pedidos recibidos:', response.data);
      setPedidos(response.data);
      setError('');
    } catch (error) {
      console.error('Error al cargar los pedidos:', error);
      console.error('Detalles del error:', error.response || error.message || error);
      setError('Error al cargar los pedidos. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const crearNuevoPedido = async () => {
    try {
      // Esta llamada API necesitará implementarse en el backend
      const response = await axios.post('http://localhost:5000/api/pedidos', {
        usuarioCreacion: user.idUsuario,
        estado: 'Pendiente',
        fechaCreacion: new Date()
      });
      
      // Redirigir al detalle del nuevo pedido
      navigate(`/pedido-detalle/${response.data.idPedido}`);
    } catch (error) {
      console.error('Error al crear nuevo pedido:', error);
      setError('Error al crear nuevo pedido. Por favor, intente de nuevo.');
    }
  };

  console.log('Renderizando componente Pedidos', { pedidos, loading, error });

  return (
    <div className="pedidos-container">
      <h1>Gestión de Pedidos</h1>
      
      <div className="pedidos-actions">
        <button className="btn-crear-pedido" onClick={crearNuevoPedido}>
          Crear Nuevo Pedido
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">Cargando pedidos...</div>
      ) : (
        <div className="pedidos-list">
          {pedidos.length > 0 ? (
            <table className="pedidos-table">
              <thead>
                <tr>
                  <th>Número de Pedido</th>
                  <th>Fecha de Creación</th>
                  <th>Estado</th>
                  <th>Productos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map(pedido => (
                  <tr key={pedido.idPedido}>
                    <td>Pedido #{pedido.idPedido}</td>
                    <td>{new Date(pedido.fechaCreacion).toLocaleDateString()}</td>
                    <td>{pedido.estado}</td>
                    <td>{pedido.cantidadProductos || 0}</td>
                    <td>
                      <button 
                        className="btn-ver-pedido"
                        onClick={() => navigate(`/pedido-detalle/${pedido.idPedido}`)}
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-pedidos">
              No hay pedidos disponibles. Cree un nuevo pedido haciendo clic en "Crear Nuevo Pedido".
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Pedidos;
