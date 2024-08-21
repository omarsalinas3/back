const express = require('express');
   const mysql = require('mysql2');
   const bcrypt = require('bcrypt');
   const cors = require('cors');
   require('dotenv').config();

   const app = express();

   app.use(express.json());
   app.use(cors());

   const pool = mysql.createPool({
     host: process.env.DB_HOST || 'localhost',
     user: process.env.DB_USER || 'root',
     password: process.env.DB_PASSWORD || '',
     database: process.env.DB_NAME || 'citasmedicas',
     waitForConnections: true,
     connectionLimit: 10,
     queueLimit: 0
   });

   const promisePool = pool.promise();

   // Rutas para usuarios
   app.post('/api/dates', async (req, res) => {
     try {
       const { nombre, apePaterno, apeMaterno, correo, contrase } = req.body;
       const hashedPassword = await bcrypt.hash(contrase, 10);
       const [result] = await promisePool.query(
         'INSERT INTO usuarios (nombre, apePaterno, apeMaterno, correo, contrase) VALUES (?, ?, ?, ?, ?)',
         [nombre, apePaterno, apeMaterno, correo, hashedPassword]
       );
       res.status(201).json({ message: 'Usuario registrado exitosamente', id: result.insertId });
     } catch (error) {
       console.error('Error en el registro:', error);
       res.status(500).json({ error: 'Error al registrar usuario' });
     }
   });

   app.get('/api/dates', async (req, res) => {
     try {
       const [rows] = await promisePool.query('SELECT * FROM usuarios');
       res.json(rows);
     } catch (error) {
       console.error('Error al obtener usuarios:', error);
       res.status(500).json({ error: 'Error al obtener usuarios' });
     }
   });

   app.get('/api/dates/:id', async (req, res) => {
     try {
       const [rows] = await promisePool.query('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
       if (rows.length > 0) {
         res.json(rows[0]);
       } else {
         res.status(404).json({ error: 'Usuario no encontrado' });
       }
     } catch (error) {
       console.error('Error al obtener usuario:', error);
       res.status(500).json({ error: 'Error al obtener usuario' });
     }
   });

   app.post('/api/auth', async (req, res) => {
     try {
       const { correo, contrase } = req.body;
       const [rows] = await promisePool.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
       if (rows.length > 0) {
         const user = rows[0];
         const isMatch = await bcrypt.compare(contrase, user.contrase);
         if (isMatch) {
           res.json({ isAuthenticated: true, userId: user.id.toString(), userName: user.nombre });
         } else {
           res.json({ isAuthenticated: false });
         }
       } else {
         res.json({ isAuthenticated: false });
       }
     } catch (error) {
       console.error('Error en la autenticación:', error);
       res.status(500).json({ error: 'Error en la autenticación' });
     }
   });


   // Rutas para citas
   app.post('/api/citas', async (req, res) => {
     try {
       const { idPaciente, fecha, hora, motivo } = req.body;
       const [result] = await promisePool.query(
         'INSERT INTO citas (idPaciente, fecha, hora, motivo) VALUES (?, ?, ?, ?)',
         [idPaciente, fecha, hora, motivo]
       );
       res.status(201).json({ message: 'Cita guardada exitosamente', id: result.insertId });
     } catch (error) {
       console.error('Error al guardar cita:', error);
       res.status(500).json({ error: 'Error al guardar cita' });
     }
   });

   app.get('/api/citas', async (req, res) => {
     try {
       const [rows] = await promisePool.query('SELECT * FROM citas');
       res.json(rows);
     } catch (error) {
       console.error('Error al obtener citas:', error);
       res.status(500).json({ error: 'Error al obtener citas' });
     }
   });

   app.get('/api/citas/paciente/:idPaciente', async (req, res) => {
     try {
       const [rows] = await promisePool.query('SELECT * FROM citas WHERE idPaciente = ?', [req.params.idPaciente]);
       res.json(rows);
     } catch (error) {
       console.error('Error al obtener citas del paciente:', error);
       res.status(500).json({ error: 'Error al obtener citas del paciente' });
     }
   });

   const PORT = process.env.PORT || 3000;
   app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));