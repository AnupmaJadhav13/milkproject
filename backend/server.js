const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const centerRoutes = require('./routes/centerRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const foodRoutes = require('./routes/foodRoutes');
const rateChartRoutes = require('./routes/rateChartRoutes');
const milkRoutes = require('./routes/milkRoutes');
const annualBonusRoutes = require('./routes/annualBonusRoutes');
const adminSmsRoutes = require('./routes/adminSmsRoutes');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/admin/rate-chart', rateChartRoutes);
app.use('/api/milk', milkRoutes);
app.use('/api/admin/annual-bonus', annualBonusRoutes);
app.use('/api/admin/sms', adminSmsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
