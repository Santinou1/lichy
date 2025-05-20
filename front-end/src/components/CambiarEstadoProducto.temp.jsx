import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUserContext } from '../UserProvider';
import '../styles/CambiarEstadoProducto.css';
import '../styles/CambioEstadoLote.css';

function CambiarEstadoProducto({ producto, onEstadoCambiado, onClose }) {
  const { user } = useUserContext();
  const [estado, setEstado] = useState('En stock');
  const [contenedorDestino, setContenedorDestino] = useState('');
  const [cantidadEntregada, setCantidadEntregada] = useState(1);
  const [cantidadTransferir, setCantidadTransferir] = useState(1);
  const [motivo, setMotivo] = useState('');
  const [contenedoresPredeterminados, setContenedoresPredeterminados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Cargar los contenedores predeterminados al iniciar
  useEffect(() => {
    console.log('Cargando contenedores predeterminados...');
    
    // Primero intentar obtener contenedores de la API específica
    axios.get('http://localhost:5000/api/contenedorProducto/predeterminados')
      .then(response => {
        console.log('Respuesta de predeterminados:', response.data);
        if (response.data && response.data.length > 0) {
          setContenedoresPredeterminados(response.data);
          setContenedorDestino(response.data[0].idContenedor);
        } else {
          // Si no hay resultados específicos, intentar obtener los contenedores con categoría 'Predeterminado'
          return axios.get('http://localhost:5000/api/contenedores/')
            .then(allContResponse => {
              console.log('Buscando contenedores con categoría Predeterminado...');
              const predeterminados = allContResponse.data.filter(c => c.categoria === 'Predeterminado');
              console.log('Contenedores filtrados:', predeterminados);
              
              if (predeterminados.length > 0) {
                setContenedoresPredeterminados(predeterminados);
                setContenedorDestino(predeterminados[0].idContenedor);
              } else {
                console.log('No se encontraron contenedores predeterminados');
                setError('No hay contenedores Mitre o Lichy disponibles');
              }
            });
        }
      })
      .catch(error => {
        console.error('Error cargando contenedores predeterminados:', error);
        setError('Error cargando contenedores predeterminados. Intente de nuevo más tarde.');
        
        // Intentar cargar todos los contenedores como plan B
        axios.get('http://localhost:5000/api/contenedores/')
          .then(allContResponse => {
            const contenedores = allContResponse.data;
            if (contenedores && contenedores.length > 0) {
              setContenedoresPredeterminados(contenedores);
              setContenedorDestino(contenedores[0].idContenedor);
              setError(''); // Limpiar mensaje de error
            }
          })
          .catch(secondError => {
            console.error('Error en plan alternativo:', secondError);
          });
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validaciones según el estado seleccionado
      if (estado === 'En stock') {
        if (!contenedorDestino) {
          setError('Debe seleccionar un contenedor destino');
          setLoading(false);
          return;
        }
        
        if (!cantidadTransferir || cantidadTransferir <= 0) {
          setError('Debe especificar una cantidad válida para transferir');
          setLoading(false);
          return;
        }
        
        if (cantidadTransferir > producto.cantidad) {
          setError('La cantidad a transferir no puede ser mayor que la cantidad disponible');
          setLoading(false);
          return;
        }
      }

      if (estado === 'Entregado') {
        if (!cantidadEntregada || cantidadEntregada <= 0) {
          setError('Debe especificar una cantidad entregada válida');
          setLoading(false);
          return;
        }
        
        if (cantidadEntregada > producto.cantidad) {
          setError('La cantidad entregada no puede ser mayor que la cantidad disponible');
          setLoading(false);
          return;
        }
      }

      if (!motivo) {
        setError('Debe especificar un motivo para el cambio');
        setLoading(false);
        return;
      }

      // Preparar datos para enviar al servidor
      const data = {
        estado,
        motivo,
        usuarioCambio: user?.idUsuario
      };

      // Agregar datos específicos según el estado
      if (estado === 'En stock') {
        data.contenedorDestino = contenedorDestino;
        data.cantidadTransferir = cantidadTransferir; // Cantidad parcial a transferir
      } else if (estado === 'Entregado') {
        data.cantidadEntregada = cantidadEntregada;
      }

      // Enviar petición al servidor
      const response = await axios.put(`http://localhost:5000/api/contenedorProducto/estado/${producto.idContenedorProductos}`, data);
      
      if (onEstadoCambiado) {
        onEstadoCambiado(response.data);
      }
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error cambiando estado del producto:', error);
      setError(error.response?.data || 'Error cambiando estado del producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cambiar-estado-overlay">
      <div className="cambiar-estado-modal">
        <div className="cambiar-estado-container">
          <div className="cambiar-estado-header">
            <h2>Cambiar Estado del Producto</h2>
            <button type="button" className="close-button" onClick={onClose}>&times;</button>
          </div>
          
          <div className="producto-info">
            <p><strong>Producto:</strong> {producto.nombre}</p>
            <p><strong>Cantidad:</strong> {producto.cantidad} {producto.unidad}</p>
            {producto.color && <p><strong>Color:</strong> {producto.color}</p>}
            <p><strong>Estado actual:</strong> {producto.estado || 'Sin estado'}</p>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Estado:</label>
              <select value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="En stock">En stock</option>
                <option value="Entregado">Entregado</option>
              </select>
            </div>
            
            {estado === 'En stock' && (
              <>
                <div className="form-group">
                  <label>Contenedor destino:</label>
                  <select value={contenedorDestino} onChange={(e) => setContenedorDestino(e.target.value)}>
                    <option value="">Seleccione un contenedor</option>
                    {contenedoresPredeterminados.length > 0 ? (
                      contenedoresPredeterminados.map(cont => (
                        <option key={cont.idContenedor} value={cont.idContenedor}>
                          {cont.comentario || `Contenedor ${cont.idContenedor}`} {cont.categoria === 'Predeterminado' ? '(Predeterminado)' : ''}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Cargando contenedores...</option>
                    )}
                  </select>
                  {contenedoresPredeterminados.length === 0 && (
                    <div className="info-message">
                      <p>Buscando contenedores disponibles...</p>
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Cantidad a transferir:</label>
                  <input 
                    type="number" 
                    value={cantidadTransferir} 
                    onChange={(e) => setCantidadTransferir(Number(e.target.value))}
                    min="1"
                    max={producto.cantidad}
                    step="0.01"
                  />
                  <span className="input-info">
                    Cantidad disponible: {producto.cantidad} {producto.unidad}
                  </span>
                </div>
              </>
            )}
            
            {estado === 'Entregado' && (
              <div className="form-group">
                <label>Cantidad entregada:</label>
                <input 
                  type="number" 
                  value={cantidadEntregada} 
                  onChange={(e) => setCantidadEntregada(Number(e.target.value))}
                  min="1"
                  max={producto.cantidad}
                  step="0.01"
                />
              </div>
            )}
            
            <div className="form-group">
              <label>Motivo:</label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Indique el motivo de este cambio"
                required
              />
            </div>
            
            <div className="buttons">
              <button type="button" onClick={onClose} disabled={loading}>Cancelar</button>
              <button type="submit" disabled={loading}>
                {loading ? 'Procesando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CambiarEstadoProducto;
