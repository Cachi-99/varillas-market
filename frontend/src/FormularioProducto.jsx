import { useState, useEffect } from 'react';

export default function FormularioProducto({ onProductoAgregado }) {
    const [titulo, setTitulo] = useState('');
    const [precio, setPrecio] = useState('');
    const [imagenUrl, setImagenUrl] = useState('');
    const [comercioId, setComercioId] = useState('');
    const [comercios, setComercios] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [categoriaId, setCategoriaId] = useState('');
    const [mensaje, setMensaje] = useState('');

    // Cargar la lista de comercios para el desplegable (select)
    useEffect(() => {
        fetch('http://localhost:3000/api/comercios')
            .then(res => { if (!res.ok) throw new Error('No se pudieron cargar los comercios'); return res.json(); })
            .then(data => setComercios(data))
            .catch(err => console.error('Error cargando comercios:', err));
        fetch('http://localhost:3000/api/categorias')
            .then(res => { if (!res.ok) throw new Error('No se pudieron cargar las categorías'); return res.json(); })
            .then(setCategorias)
            .catch(err => setMensaje(err.message));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const nuevoProducto = {
            titulo,
            precio: parseFloat(precio),
            url_imagen: imagenUrl,
            comercio_id: parseInt(comercioId),
            categoria_id: parseInt(categoriaId)
        };

        try {
            const respuesta = await fetch('http://localhost:3000/api/productos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoProducto)
            });

            if (respuesta.ok) {
                setMensaje('✅ ¡Producto cargado exitosamente!');
                setTitulo('');
                setPrecio('');
                setImagenUrl('');
                setComercioId('');
                setCategoriaId('');

                // Si le pasamos una función callback, actualizamos la lista de productos
                if (onProductoAgregado) onProductoAgregado();
            } else {
                const detalle = await respuesta.json();
                setMensaje(`❌ ${detalle.error || 'Error al guardar el producto'}`);
            }
        } catch (error) {
            console.error(error);
            setMensaje('❌ Error de conexión con el servidor');
        }
    };

    return (
        <div style={{
            maxWidth: '500px',
            margin: '20px auto',
            padding: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            fontFamily: 'sans-serif'
        }}>
            <h2 style={{ textAlign: 'center', color: '#1e40af', marginBottom: '15px' }}>
                🛒 Cargar Nuevo Producto
            </h2>

            {mensaje && <p style={{ textAlign: 'center', fontWeight: 'bold' }}>{mensaje}</p>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Título del producto:</label>
                    <input
                        type="text"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        required
                        placeholder="Ej. Pelota de Fútbol"
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Precio ($):</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={precio}
                        onChange={(e) => setPrecio(e.target.value)}
                        required
                        placeholder="Ej. 15000"
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>URL de la imagen:</label>
                    <input
                        type="url"
                        value={imagenUrl}
                        onChange={(e) => setImagenUrl(e.target.value)}
                        placeholder="https://ejemplo.com/imagen.jpg"
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Comercio:</label>
                    <select
                        value={comercioId}
                        onChange={(e) => setComercioId(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                    >
                        <option value="">-- Seleccionar Comercio --</option>
                        {comercios.map(comercio => (
                            <option key={comercio.id} value={comercio.id}>
                                {comercio.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="categoria" style={{ display: 'block', marginBottom: '5px' }}>Categoría:</label>
                    <select id="categoria" value={categoriaId} onChange={e => setCategoriaId(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
                        <option value="">-- Seleccionar Categoría --</option>
                        {categorias.map(categoria => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}
                    </select>
                </div>

                <button
                    type="submit"
                    style={{
                        backgroundColor: '#16a34a',
                        color: 'white',
                        padding: '10px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        marginTop: '10px'
                    }}
                >
                    Guardar Producto
                </button>
            </form>
        </div>
    );
}
