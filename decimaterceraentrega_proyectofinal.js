const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

mongoose.connect('mongodb://localhost:27017/your_database', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
});

const User = mongoose.model('User', userSchema);

const app = express();
const server = http.createServer(app);

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Your API Documentation',
      version: '1.0.0',
      description: 'Documentation for your API endpoints',
    },
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(cors());
app.use(bodyParser.json());
app.use(session({ secret: 'tu_secreto', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Swagger annotations for products module
/**
 * @swagger
 * /products:
 *   get:
 *     description: Get all products
 *     responses:
 *       '200':
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */

// Swagger annotations for cart module
/**
 * @swagger
 * /cart:
 *   get:
 *     description: Get items in the cart
 *     responses:
 *       '200':
 *         description: A list of items in the cart
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CartItem'
 */

// Route for forgot password
app.post('/forgot_password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({ message: 'Correo electrónico enviado con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


app.post('/reset_password', async (req, res) => {
  try {
    const { email, newPassword, token } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      return res.status(400).json({ message: 'La nueva contraseña no puede ser igual a la actual' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

const port = 8080;

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
