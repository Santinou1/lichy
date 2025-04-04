import ProductoLista from "../components/ProductoLista";
import "../styles/ListaProductos.css";
import { useState, useEffect } from "react";
import axios from "axios";

function ListaProductos() {
  const [productosSinContenedor, setProductosSinContenedor] = useState([]);
  const [productosConContenedor, setProductosConContenedor] = useState([]);
  const [categoria, setCategoria] = useState("con contenedor");
  const [busqueda, setBusqueda] = useState("");
  const [productosFiltrados, setProductosFiltrados] = useState([]);

  // Obtener datos de la API
  useEffect(() => {
    axios
      .get("http://localhost:3000/api/producto/sin-contenedor")
      .then((response) => {
        setProductosSinContenedor(response.data);
      })
      .catch((error) => {
        console.error("Error trayendo productos sin contenedor:", error);
      });

    axios
      .get("http://localhost:3000/api/producto/con-contenedor")
      .then((response) => {
        setProductosConContenedor(response.data);
      })
      .catch((error) => {
        console.error("Error trayendo productos con contenedor:", error);
      });
  }, []);

  // Filtrar productos por categoría y búsqueda
  useEffect(() => {
    const productos =
      categoria === "con contenedor"
        ? productosConContenedor
        : productosSinContenedor;

    const filtrados = productos.filter((producto) =>
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    setProductosFiltrados(filtrados);
  }, [categoria, busqueda, productosConContenedor, productosSinContenedor]);

  return (
    <div className="lista-container">
      <div className="productos-container">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h1 className="titulo">Lista de productos:</h1>
          <input
            className="input-buscar"
            placeholder="Buscar por nombre"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <label>
          Categorías:{" "}
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="con contenedor">En contenedores</option>
            <option value="sin contenedor">Sin contenedor</option>
          </select>
        </label>

        <hr />

        {productosFiltrados.length === 0 ? (
          <p className="text-gray-500">No se encontraron productos.</p>
        ) : (
          productosFiltrados.map((item) => (
            <ProductoLista key={item.id} data={item} />
          ))
        )}
      </div>
    </div>
  );
}

export default ListaProductos;
