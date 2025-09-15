-- SQL script to create the excel_files table in PostgreSQL
CREATE TABLE IF NOT EXISTS excel_files (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample Excel files for testing
INSERT INTO excel_files (name, content) VALUES 
('ventas_enero.csv', 'Producto,Cantidad,Precio
Laptop,10,1200
Mouse,50,25
Teclado,30,45'),
('inventario.csv', 'ID,Producto,Stock,Categoria
1,Laptop Dell,15,Computadoras
2,Mouse Logitech,100,Accesorios
3,Monitor Samsung,25,Pantallas'),
('empleados.csv', 'Nombre,Departamento,Salario
Juan Perez,Ventas,3000
Maria Garcia,Marketing,3500
Carlos Lopez,IT,4000');
