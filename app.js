const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoute.js'); 
const userRoutes = require('./routes/userRoute.js');
const projectRoutes = require('./routes/projectRoute.js'); 
const imagesRoutes = require('./routes/imagesRoutes.js');
const appointmentRoutes = require('./routes/appointmentRoute.js');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(express.static(`${__dirname}/public`));


// Mount auth routes under /api/auth
app.use('/api/auth', authRoutes);

// Mount user routes under /api/users
app.use('/api/users', userRoutes);

// Mount project routes under /api/projects
app.use('/api/projects', projectRoutes);

// Mount images routes under /api/images
app.use('/api/images', imagesRoutes);

// Mount appointment routes under /api/appointments
app.use('/api/appointments', appointmentRoutes);

// Health check or other routes
app.get('/', (req, res) => {
  res.send('API is running');
});

module.exports = app;
