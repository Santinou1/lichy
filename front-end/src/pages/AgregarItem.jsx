import { useParams } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import '../styles/AgregarItem.css'

function AgregarItem() {
    const { item } = useParams();
    const [items, setItems] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    
    const { control, handleSubmit: formSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            nombre: '',
            unidadPredeterminada: '',
            codigoInterno: '',
            tipoBultoPredeterminado: ''
        }
    });
    
    // Función para manejar el cambio de unidad y establecer automáticamente el tipo de bulto
    const handleUnidadChange = (unidad) => {
        console.log('Unidad seleccionada:', unidad);
        
        let tipoBulto = '';
        
        // Normalizar la unidad a minúsculas para comparación
        const unidadLower = unidad ? unidad.toLowerCase() : '';
        
        if (unidadLower === 'm' || unidadLower === 'kg') {
            tipoBulto = 'rollo';
            console.log('Estableciendo tipo de bulto como rollo');
        } else if (unidadLower === 'uni') {
            tipoBulto = 'caja';
            console.log('Estableciendo tipo de bulto como caja');
        } else {
            console.log('Unidad no reconocida, no se establece tipo de bulto');
        }
        
        if (tipoBulto) {
            setValue('tipoBultoPredeterminado', tipoBulto);
            // Forzar la actualización del formulario
            const formValues = {
                ...watch(),
                tipoBultoPredeterminado: tipoBulto
            };
            reset(formValues, { keepValues: true });
            
            console.log('Tipo de bulto establecido a:', tipoBulto);
            console.log('Valores actuales del formulario:', formValues);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [item]);
    
    // Observar cambios en la unidad predeterminada
    const unidadPredeterminada = watch('unidadPredeterminada');
    useEffect(() => {
        if (unidadPredeterminada) {
            console.log('Cambio detectado en unidadPredeterminada:', unidadPredeterminada);
            handleUnidadChange(unidadPredeterminada);
        }
    }, [unidadPredeterminada]);

    const fetchItems = () => {
        axios.get(`http://localhost:5000/api/items/${item}`)
            .then((response) => {
                console.log('Datos recibidos:', response.data);
                // Asegurarse de que todos los campos necesarios estén definidos
                const itemsProcessed = response.data.map(itemData => ({
                    ...itemData,
                    // Asegurarse de que unidadPredeterminada nunca sea null o undefined
                    unidadPredeterminada: itemData.unidadPredeterminada || '',
                    // Asegurarse de que tipoBultoPredeterminado nunca sea null o undefined
                    tipoBultoPredeterminado: itemData.tipoBultoPredeterminado || ''
                }));
                setItems(itemsProcessed);
            })
            .catch((error) => {
                console.error('Error trayendo los items:', error);
            });
    };

    const onSubmit = (data) => {
        setError('');
        
        // Validar campos obligatorios para productos
        if (item === 'producto') {
            if (!data.nombre.trim()) {
                setError('El nombre del producto es obligatorio');
                return;
            }
            if (!data.unidadPredeterminada) {
                setError('La unidad predeterminada es obligatoria');
                return;
            }
        }
        
        if (isEditing) {
            // Lógica para actualizar
            let dataToUpdate;
            if (item === 'color') {
                dataToUpdate = { 
                    nombre: data.nombre, 
                    codigoInterno: data.codigoInterno 
                };
            } else if (item === 'producto') {
                // Asegurarse de que la unidad predeterminada esté definida
                const unidadPredeterminada = data.unidadPredeterminada || '';
                
                // Establecer el tipo de bulto según la unidad
                let tipoBulto = data.tipoBultoPredeterminado;
                if (!tipoBulto && unidadPredeterminada) {
                    const unidadLower = unidadPredeterminada.toLowerCase();
                    if (unidadLower === 'm' || unidadLower === 'kg') {
                        tipoBulto = 'rollo';
                    } else if (unidadLower === 'uni') {
                        tipoBulto = 'caja';
                    }
                }
                
                dataToUpdate = {
                    nombre: data.nombre,
                    unidadPredeterminada: unidadPredeterminada,
                    codigoInterno: data.codigoInterno,
                    tipoBultoPredeterminado: tipoBulto || ''
                };
            } else {
                dataToUpdate = { nombre: data.nombre };
            }
            
            console.log('Datos de actualización a enviar:', dataToUpdate);
            
            axios.put(`http://localhost:5000/api/items/${item}/${editingId}`, dataToUpdate)
            .then((response) => {
                console.log('Respuesta del servidor (actualización):', response.data);
                if (response.status === 200) {
                    fetchItems(); // Refrescar la lista
                    resetForm();
                }
            })
            .catch((error) => {
                console.error('Error actualizando el item:', error);
                setError('Error al actualizar el item. Intente nuevamente.');
            });
        } else {
            // Lógica para crear nuevo
            let dataToSend;
            
            if (item === 'producto') {
                // Asegurarse de que la unidad predeterminada esté definida
                const unidadPredeterminada = data.unidadPredeterminada || '';
                
                // Establecer el tipo de bulto según la unidad
                let tipoBulto = data.tipoBultoPredeterminado;
                if (!tipoBulto && unidadPredeterminada) {
                    const unidadLower = unidadPredeterminada.toLowerCase();
                    if (unidadLower === 'm' || unidadLower === 'kg') {
                        tipoBulto = 'rollo';
                    } else if (unidadLower === 'uni') {
                        tipoBulto = 'caja';
                    }
                }
                
                dataToSend = { 
                    nombre: data.nombre, 
                    unidadPredeterminada: unidadPredeterminada,
                    codigoInterno: data.codigoInterno,
                    tipoBultoPredeterminado: tipoBulto || ''
                };
                
                console.log('Datos del producto a enviar:', dataToSend);
            } else if (item === 'color') {
                dataToSend = { 
                    nombre: data.nombre, 
                    codigoInterno: data.codigoInterno 
                };
            } else {
                dataToSend = { nombre: data.nombre };
            }
            
            console.log('Enviando datos al servidor:', dataToSend);
            console.log('URL:', `http://localhost:5000/api/items/${item}`);
            
            axios.post(`http://localhost:5000/api/items/${item}`, dataToSend)
            .then((response) => {
                console.log('Respuesta del servidor:', response.data);
                if (response.status === 200) {
                    fetchItems(); // Refrescar la lista
                    resetForm();
                }
            })
            .catch((error) => {
                console.error('Error agregando el item:', error);
                console.error('Detalles del error:', error.response ? error.response.data : 'No hay detalles adicionales');
                
                // Verificar si es un error de producto duplicado (código 400)
                if (error.response && error.response.status === 400 && error.response.data && error.response.data.error) {
                    // Mostrar el mensaje personalizado del backend
                    setError(error.response.data.error);
                } else {
                    setError('Error al agregar el item. Intente nuevamente.');
                }
            });
        }
    };

    const handleEdit = (itemData) => {
        setEditingId(item === 'color' ? itemData.idColor : 
                     item === 'proveedor' ? itemData.idProveedor : 
                     itemData.idProducto);
        setIsEditing(true);
        reset({
            nombre: itemData.nombre,
            unidadPredeterminada: itemData.unidadPredeterminada || '',
            codigoInterno: itemData.codigoInterno || '',
            tipoBultoPredeterminado: itemData.tipoBultoPredeterminado || ''
        });
    };

    const resetForm = () => {
        reset({
            nombre: '',
            unidadPredeterminada: '',
            codigoInterno: '',
            tipoBultoPredeterminado: ''
        });
        setEditingId(null);
        setIsEditing(false);
        setError('');
    };

    return (
        <div className="principal-container">
            <form className="agregar-container" onSubmit={formSubmit(onSubmit)}>
                <h2 className="titulo">
                    {isEditing ? `Editar ${item}` : `Agregar ${item}`}
                </h2>
                
                {error && <div className="error-message">{error}</div>}
                
                <div className="input-container">
                    <label htmlFor="nombre">{`Nombre de ${item}:`} <span className="required">*</span></label>
                    <Controller
                        name="nombre"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <input 
                                {...field}
                                type="text" 
                                id="nombre"
                                className={errors.nombre ? 'error-input' : ''}
                            />
                        )}
                    />
                    {errors.nombre && <span className="error-text">Este campo es obligatorio</span>}
                </div>
                
                {item === 'producto' && (
                    <>
                        <div className="input-container">
                            <label htmlFor="unidadPredeterminada">Unidad predeterminada: <span className="required">*</span></label>
                            <Controller
                                name="unidadPredeterminada"
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <select 
                                        {...field}
                                        id="unidadPredeterminada"
                                        className={errors.unidadPredeterminada ? 'error-input' : ''}
                                        onChange={(e) => {
                                            const selectedValue = e.target.value;
                                            console.log('Valor seleccionado en el evento:', selectedValue);
                                            field.onChange(selectedValue);
                                            handleUnidadChange(selectedValue);
                                        }}
                                    >
                                        <option value="" disabled>Seleccionar unidad</option>
                                        <option value="m">m</option>
                                        <option value="kg">kg</option>
                                        <option value="uni">uni</option>
                                    </select>
                                )}
                            />
                            {errors.unidadPredeterminada && <span className="error-text">Este campo es obligatorio</span>}
                        </div>
                        
                        <div className="input-container">
                            <label htmlFor="tipoBultoPredeterminado">Tipo de bulto predeterminado:</label>
                            <Controller
                                name="tipoBultoPredeterminado"
                                control={control}
                                render={({ field }) => (
                                    <input 
                                        {...field}
                                        type="text" 
                                        id="tipoBultoPredeterminado"
                                        readOnly
                                        className="readonly-input"
                                    />
                                )}
                            />
                            <span className="info-text">Se establece automáticamente según la unidad seleccionada</span>
                        </div>
                        
                        <div className="input-container">
                            <label htmlFor="codigoInterno">Código interno:</label>
                            <Controller
                                name="codigoInterno"
                                control={control}
                                render={({ field }) => (
                                    <input 
                                        {...field}
                                        type="text" 
                                        id="codigoInterno"
                                        placeholder="Opcional"
                                    />
                                )}
                            />
                            <span className="info-text">Este campo es opcional</span>
                        </div>
                    </>
                )}
                
                {item === 'color' && (
                    <div className="input-container">
                        <label htmlFor="codigoInterno">Código interno:</label>
                        <Controller
                            name="codigoInterno"
                            control={control}
                            render={({ field }) => (
                                <input 
                                    {...field}
                                    type="text" 
                                    id="codigoInterno"
                                />
                            )}
                        />
                    </div>
                )}
                
                <div className="buttons-container">
                    <button type="submit" className="submit-button">
                        {isEditing ? 'Actualizar' : 'Agregar'}
                    </button>
                    
                    {isEditing && (
                        <button type="button" className="cancel-button" onClick={resetForm}>
                            Cancelar
                        </button>
                    )}
                </div>
            </form>
            
            <div className="lista-item-container">
                <h2 className="titulo">Lista de {item}:</h2>
                <ul>
                    {items.map((itemData) => {
                        // Depuración
                        console.log('Renderizando item:', itemData);
                        
                        return (
                            <li key={item === 'color' ? itemData.idColor : 
                                    item === 'proveedor' ? itemData.idProveedor : 
                                    itemData.idProducto}>
                                <div className="item-info">
                                    <div className="item-name">{itemData.nombre}</div>
                                    {item === 'color' && (
                                        <div className="item-details">
                                            <span className="detail-label">Código:</span> 
                                            <span className="detail-value">{itemData.codigoInterno ? itemData.codigoInterno : 'Sin código interno'}</span>
                                        </div>
                                    )}
                                    {item === 'producto' && (
                                        <>
                                            <div className="item-details">
                                                <span className="detail-label">Unidad:</span> 
                                                <span className="detail-value">{itemData.unidadPredeterminada ? itemData.unidadPredeterminada : 'No especificada'}</span>
                                            </div>
                                            {itemData.codigoInterno && (
                                                <div className="item-details">
                                                    <span className="detail-label">Código interno:</span> 
                                                    <span className="detail-value">{itemData.codigoInterno}</span>
                                                </div>
                                            )}
                                            {itemData.tipoBultoPredeterminado && (
                                                <div className="item-details">
                                                    <span className="detail-label">Tipo de bulto:</span> 
                                                    <span className="detail-value">{itemData.tipoBultoPredeterminado}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="item-actions">
                                    <button onClick={() => handleEdit(itemData)} className="edit-button">Editar</button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

export default AgregarItem;
