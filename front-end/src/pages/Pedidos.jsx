import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Pedidos.css';
import { useUserContext } from '../UserProvider';

function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [filteredPedidos, setFilteredPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mostrarCompletados, setMostrarCompletados] = useState(false);
  const { user } = useUserContext();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Componente Pedidos montado');
    cargarPedidos();
    return () => {
      console.log('Componente Pedidos desmontado');
    };
  }, []);

  // Filtrar pedidos cuando cambia la lista de pedidos o el estado de mostrarCompletados
  useEffect(() => {
    filtrarPedidos();
  }, [pedidos, mostrarCompletados]);
  
  // Función para filtrar pedidos según el estado de mostrarCompletados
  const filtrarPedidos = () => {
    if (mostrarCompletados) {
      // Mostrar todos los pedidos
      setFilteredPedidos(pedidos);
    } else {
      // Filtrar para excluir los pedidos con estado "Completado"
      const pedidosFiltrados = pedidos.filter(pedido => pedido.estado !== 'Completado');
      setFilteredPedidos(pedidosFiltrados);
    }
  };

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
  
  // Función para cambiar el estado de mostrar/ocultar pedidos completados
  const toggleMostrarCompletados = () => {
    setMostrarCompletados(!mostrarCompletados);
  };



  console.log('Renderizando componente Pedidos', { pedidos, filteredPedidos, loading, error, mostrarCompletados });

  return (
    <div className="pedidos-container">
      <h1>Gestión de Pedidos</h1>
      
      <div className="pedidos-actions">

        <div className="filter-controls">
          <label className="toggle-label">
            <input 
              type="checkbox" 
              checked={mostrarCompletados} 
              onChange={toggleMostrarCompletados} 
            />
            Mostrar pedidos completados
          </label>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">Cargando pedidos...</div>
      ) : (
        <div className="pedidos-list">
          {filteredPedidos.length > 0 ? (
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
                {filteredPedidos.map(pedido => (
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
              {pedidos.length > 0 ? 
                "No hay pedidos disponibles con los filtros actuales. Active 'Mostrar pedidos completados' para ver todos los pedidos." :
                "No hay pedidos disponibles."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Pedidos;
