import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from './pages/Login.jsx';
import Contenedores from "./pages/Contenedores.jsx";
import Navegador from "./components/Navegador.jsx";
import ContendorDetalle from "./pages/ContenedorDetalle.jsx";
import NuevoContenedor from "./pages/NuevoContenedor.jsx";
import ListaProductos from "./pages/ListaProductos.jsx";
import ProductoDetalle from "./pages/ProductoDetalle.jsx";
import AgregarItem from "./pages/AgregarItem.jsx";
import Redireccion from "./components/Redireccion.jsx";
import ActualizarProductos from "./pages/ActualizarProductos.jsx";

import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { useUserContext } from "./UserProvider.jsx";
import ConfiguraciónUsuarios from "./pages/ConfiguracionUsuarios.jsx";
import Bienvenido from "./pages/Bienvenido.jsx";

function App() {
  const { user } = useUserContext();

  return (

     
      <Router>
        {
          user ? 
          <>
            <Navegador user={user}/>

          </> : <></>
        }
        
        <Routes>
          <Route path='/' element={<Login />} />
          <Route path="/bienvenido" element={<Bienvenido />}/>
          <Route element={<ProtectedRoute user={user} requiredPermission={'Contenedores'}/>}>
            <Route path='/ver-contenedores'  element={<Contenedores />} />
            <Route path='/contenedor-detalle/:id'  element={<ContendorDetalle user={user}/>}/>
            <Route path='/redireccion' element={<Redireccion />} />
            <Route path='/nuevo-contenedor' element={<NuevoContenedor />} />
            <Route path='actualizar-producto-contenedor/:id' element={<ActualizarProductos />}/>
           
          </Route> 
          <Route element={<ProtectedRoute user={user} requiredPermission={'Items'}/>}>
            <Route path='/ver-items/:item' element={<AgregarItem />} />
          </Route>
          <Route  element={<ProtectedRoute user={user} requiredPermission={'Productos'} />}>
            <Route path='/ver-productos' element={<ListaProductos />} />
            <Route path='/producto-detalle/:producto' element={<ProductoDetalle />} />
          </Route>
          <Route element={<ProtectedRoute user={user} requiredPermission={'Usuarios'} />}>
            <Route path='/ver-usuarios' element={<ConfiguraciónUsuarios />} />
          </Route>
          <Route path='*' element={<h1>Not Found</h1>} />  
        </Routes>
      </Router>

  )
}

export default App
