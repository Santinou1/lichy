import { useState } from "react";
import axios from "axios";

function CrearColor({ onColorCreated }) {
    const [nombre, setNombre] = useState('');
    const [codigoInterno, setCodigoInterno] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!nombre.trim()) {
            setError('El nombre del color es obligatorio');
            return;
        }

        setIsCreating(true);
        setError('');

        try {
            const response = await axios.post('http://localhost:5000/api/items/color', { 
                nombre, 
                codigoInterno 
            });
            
            if (response.status === 200 && response.data.length > 0) {
                const nuevoColor = response.data[0];
                onColorCreated(nuevoColor);
                setNombre('');
                setCodigoInterno('');
                setShowForm(false);
            } else {
                setError('No se pudo crear el color. Inténtalo de nuevo.');
            }
        } catch (error) {
            console.error('Error al crear el color:', error);
            setError('Error al crear el color. Verifica la conexión e inténtalo de nuevo.');
        } finally {
            setIsCreating(false);
        }
    };

    if (!showForm) {
        return (
            <button 
                type="button" 
                onClick={() => setShowForm(true)}
                style={{ 
                    marginLeft: '10px',
                    padding: '5px 10px', 
                    backgroundColor: '#4CAF50', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9em'
                }}
            >
                + Nuevo Color
            </button>
        );
    }

    return (
        <div style={{ 
            marginTop: '10px', 
            padding: '15px', 
            border: '1px solid #ddd', 
            borderRadius: '5px',
            backgroundColor: '#f9f9f9'
        }}>
            <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Crear Nuevo Color</h4>
            
            {error && (
                <div style={{ 
                    color: '#d32f2f', 
                    backgroundColor: '#ffebee', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    marginBottom: '10px' 
                }}>
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                        Nombre del Color:
                    </label>
                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        style={{ 
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                        placeholder="Ej: Rojo, Azul, Verde"
                        required
                    />
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                        Código Interno:
                    </label>
                    <input
                        type="text"
                        value={codigoInterno}
                        onChange={(e) => setCodigoInterno(e.target.value)}
                        style={{ 
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                        placeholder="Ej: R001, AZ002"
                    />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        style={{ 
                            padding: '8px 15px',
                            backgroundColor: '#f5f5f5',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                        disabled={isCreating}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        style={{ 
                            padding: '8px 15px',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                        disabled={isCreating}
                    >
                        {isCreating ? 'Creando...' : 'Crear Color'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CrearColor;
