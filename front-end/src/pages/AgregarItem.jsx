import { useParams } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import '../styles/AgregarItem.css'

function AgregarItem() {
    const { item } = useParams();
    const [items, setItems] = useState([]);
    const [nombre, setNombre] = useState('');
    const [unidadPredeterminada, setUnidadPredeterminada] = useState('');
    const [codigoInterno, setCodigoInterno] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchItems();
    }, [item]);

    const fetchItems = () => {
        axios.get(`http://localhost:3000/api/items/${item}`)
            .then((response) => {
                setItems(response.data);
            })
            .catch((error) => {
                console.error('Error trayendo los items:', error);
            });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (isEditing) {
            // Lógica para actualizar
            axios.put(`http://localhost:3000/api/items/${item}/${editingId}`, 
                item === 'color' ? { nombre, codigoInterno } : { nombre }
            )
            .then((response) => {
                if (response.status === 200) {
                    fetchItems(); // Refrescar la lista
                    resetForm();
                }
            })
            .catch((error) => {
                console.error('Error actualizando el item:', error);
            });
        } else {
            // Lógica para crear nuevo
            axios.post(`http://localhost:3000/api/items/${item}`, 
                item === 'producto' ? { nombre, unidadPredeterminada } : { nombre }
            )
            .then((response) => {
                if (response.status === 200) {
                    fetchItems(); // Refrescar la lista
                    resetForm();
                }
            })
            .catch((error) => {
                console.error('Error agregando el item:', error);
            });
        }
    };

    const handleEdit = (itemData) => {
        setNombre(itemData.nombre);
        if (item === 'color') {
            setCodigoInterno(itemData.codigoInterno || '');
        }
        if (item === 'producto') {
            setUnidadPredeterminada(itemData.unidadPredeterminada || '');
        }
        setEditingId(item === 'color' ? itemData.idColor : 
                    item === 'proveedor' ? itemData.idProveedor : 
                    itemData.idProducto);
        setIsEditing(true);
    };

 

    const resetForm = () => {
        setNombre('');
        setUnidadPredeterminada('');
        setCodigoInterno('');
        setEditingId(null);
        setIsEditing(false);
    };

    return (
        <div className="principal-container">
            <form className="agregar-container" onSubmit={handleSubmit}>
                <h2 className="titulo">
                    {isEditing ? `Editar ${item}` : `Agregar ${item}`}
                </h2>
                
                <input 
                    style={{width: '100%'}} 
                    type="text" 
                    placeholder={`Nombre de ${item}`}  
                    value={nombre} 
                    onChange={(e) => setNombre(e.target.value)}
                    required
                />
                
                {item === 'producto' && (
                    <select 
                        style={{width: '100%'}} 
                        value={unidadPredeterminada} 
                        onChange={(e) => setUnidadPredeterminada(e.target.value)}
                        required
                    >
                        <option value='' disabled>Seleccionar unidad</option>
                        <option value='m'>m</option>
                        <option value='kg'>kg</option>
                        <option value='uni'>uni</option>
                    </select>
                )}
                
                {item === 'color' && (
                    <input 
                        style={{width: '100%'}} 
                        type="text" 
                        placeholder="Código interno"  
                        value={codigoInterno} 
                        onChange={(e) => setCodigoInterno(e.target.value)}
                    />
                )}
                
                <button type="submit">
                    {isEditing ? 'Actualizar' : 'Agregar'}
                </button>
                
                {isEditing && (
                    <button type="button" onClick={resetForm}>
                        Cancelar
                    </button>
                )}
            </form>
            
            <div className="lista-item-container">
                <h2 className="titulo">Lista de {item}:</h2>
                <ul>
                    {items.map((itemData) => (
                        <li key={item === 'color' ? itemData.idColor : 
                                  item === 'proveedor' ? itemData.idProveedor : 
                                  itemData.idProducto}>
                            <span>
                                {itemData.nombre} 
                                {item === 'color' && ` - Código: ${itemData.codigoInterno ? itemData.codigoInterno :  'Sin código interno'}`}
                                {item === 'producto' && ` - Unidad: ${itemData.unidadPredeterminada}`}
                            </span>
                            <div>
                                <button onClick={() => handleEdit(itemData)}>Editar</button>
                                
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default AgregarItem;