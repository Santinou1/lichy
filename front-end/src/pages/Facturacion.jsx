import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Facturacion.css';
import { useUserContext } from '../UserProvider';

function Facturacion() {
  const [facturas, setFacturas] = useState([]);
  const [pedidosDisponibles, setPedidosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useUserContext();
  const navigate = useNavigate();
  
  // Estados para crear factura
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState('');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [fechaFactura, setFechaFactura] = useState('');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    cargarFacturas();
    cargarPedidosDisponibles();
  }, []);

  const cargarFacturas = async () => {
    try {
      setLoading(true);
      // Esta llamada API necesitará implementarse en el backend
      const response = await axios.get('http://localhost:5000/api/facturas');
      setFacturas(response.data);
      setError('');
    } catch (error) {
      console.error('Error al cargar las facturas:', error);
      setError('Error al cargar las facturas. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const cargarPedidosDisponibles = async () => {
    try {
      // Esta llamada API necesitará implementarse en el backend
      // Obtener pedidos completados que no tengan factura asociada
      const response = await axios.get('http://localhost:5000/api/pedidos/completados-sin-factura');
      setPedidosDisponibles(response.data);
    } catch (error) {
      console.error('Error al cargar pedidos disponibles:', error);
    }
  };

  const handleCrearFactura = async (e) => {
    e.preventDefault();
    
    if (!pedidoSeleccionado) {
      setError('Debe seleccionar un pedido');
      return;
    }
    
    if (!numeroFactura.trim()) {
      setError('Debe ingresar un número de factura');
      return;
    }
    
    if (!fechaFactura) {
      setError('Debe seleccionar una fecha para la factura');
      return;
    }
    
    try {
      // Esta llamada API necesitará implementarse en el backend
      await axios.post('http://localhost:5000/api/facturas', {
        idPedido: pedidoSeleccionado,
        numeroFactura,
        fechaFactura,
        observaciones,
        usuarioCreacion: user.idUsuario
      });
      
      // Recargar facturas y pedidos disponibles
      cargarFacturas();
      cargarPedidosDisponibles();
      
      // Resetear formulario
      setPedidoSeleccionado('');
      setNumeroFactura('');
      setFechaFactura('');
      setObservaciones('');
      setMostrarFormulario(false);
      setError('');
    } catch (error) {
      console.error('Error al crear factura:', error);
      setError('Error al crear factura. Por favor, intente de nuevo.');
    }
  };

  return (
    <div className="facturacion-container">
      <h1>Gestión de Facturas</h1>
      
      <div className="facturacion-actions">
        {!mostrarFormulario ? (
          <button className="btn-crear-factura" onClick={() => setMostrarFormulario(true)}>
            Crear Nueva Factura
          </button>
        ) : (
          <button className="btn-cancelar" onClick={() => setMostrarFormulario(false)}>
            Cancelar
          </button>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {mostrarFormulario && (
        <div className="formulario-crear-factura">
          <h2>Crear Nueva Factura</h2>
          
          <form onSubmit={handleCrearFactura}>
            <div className="form-group">
              <label>Seleccionar Pedido:</label>
              <select 
                value={pedidoSeleccionado} 
                onChange={(e) => setPedidoSeleccionado(e.target.value)}
                required
              >
                <option value="">Seleccione un pedido</option>
                {pedidosDisponibles.map(pedido => (
                  <option key={pedido.idPedido} value={pedido.idPedido}>
                    Pedido #{pedido.idPedido} - {new Date(pedido.fechaCompletado).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Número de Factura:</label>
              <input 
                type="text" 
                value={numeroFactura} 
                onChange={(e) => setNumeroFactura(e.target.value)}
                placeholder="Ej: A-00001"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Fecha de Factura:</label>
              <input 
                type="date" 
                value={fechaFactura} 
                onChange={(e) => setFechaFactura(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Observaciones:</label>
              <textarea 
                value={observaciones} 
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Observaciones adicionales..."
                rows="3"
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-submit">Crear Factura</button>
              <button type="button" className="btn-cancelar" onClick={() => setMostrarFormulario(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
      
      {loading ? (
        <div className="loading">Cargando facturas...</div>
      ) : (
        <div className="facturas-list">
          {facturas.length > 0 ? (
            <table className="facturas-table">
              <thead>
                <tr>
                  <th>Número de Factura</th>
                  <th>Fecha</th>
                  <th>Pedido Asociado</th>
                  <th>Importe Total</th>
                  <th>Observaciones</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map(factura => (
                  <tr key={factura.idFactura}>
                    <td>{factura.numeroFactura}</td>
                    <td>{new Date(factura.fechaFactura).toLocaleDateString()}</td>
                    <td>Pedido #{factura.idPedido}</td>
                    <td>${typeof factura.importeTotal === 'number' ? factura.importeTotal.toFixed(2) : parseFloat(factura.importeTotal || 0).toFixed(2)}</td>
                    <td>{factura.observaciones || '-'}</td>
                    <td>
                      <button 
                        className="btn-ver-factura"
                        onClick={() => navigate(`/pedido-detalle/${factura.idPedido}`)}
                      >
                        Ver Pedido
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-facturas">
              No hay facturas disponibles. Cree una nueva factura haciendo clic en "Crear Nueva Factura".
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Facturacion;
