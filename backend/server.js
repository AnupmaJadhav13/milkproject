const express         = require('express');
const http            = require('http');
const dotenv          = require('dotenv');
const cors            = require('cors');
const connectDB       = require('./config/db');
const authRoutes      = require('./routes/authRoutes');
const centerRoutes    = require('./routes/centerRoutes');
const farmerRoutes    = require('./routes/farmerRoutes');
const foodRoutes      = require('./routes/foodRoutes');
const rateChartRoutes = require('./routes/rateChartRoutes');
const milkRoutes      = require('./routes/milkRoutes');
const annualBonusRoutes   = require('./routes/annualBonusRoutes');
const advanceRoutes       = require('./routes/advanceRoutes');
const payableRoutes       = require('./routes/payableRoutes');
const paymentRoutes       = require('./routes/paymentRoutes');
const reportRoutes        = require('./routes/reportRoutes');
const notificationRoutes  = require('./routes/notificationRoutes');
const farmerDashboardRoutes = require('./routes/farmerDashboardRoutes');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { initSocket } = require('./socket');

dotenv.config();
connectDB();

console.log('──────────────────────────────────────────');
console.log('Sarvasvaa Milk Backend starting...');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log('──────────────────────────────────────────');

const app = express();
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',                authRoutes);
app.use('/api/centers',             centerRoutes);
app.use('/api/farmers',             farmerRoutes);
app.use('/api/food',                foodRoutes);
app.use('/api/admin/rate-chart',    rateChartRoutes);
app.use('/api/milk',                milkRoutes);
app.use('/api/admin/annual-bonus',  annualBonusRoutes);
app.use('/api/advances',            advanceRoutes);
app.use('/api/payable',             payableRoutes);
app.use('/api/payments',            paymentRoutes);
app.use('/api/reports',             reportRoutes);
app.use('/api/notifications',       notificationRoutes);
app.use('/api/farmer-dashboard',    farmerDashboardRoutes);

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocket(server, corsOrigin);

server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
