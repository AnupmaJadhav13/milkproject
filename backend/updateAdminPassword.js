const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');

dotenv.config();
connectDB();

const updatePassword = async () => {
  try {
    const admin = await Admin.findOne({ username: 'admin' });
    if (!admin) {
      console.log('Admin not found');
      process.exit(1);
    }
    
    admin.password = 'Admin@123';
    await admin.save();
    console.log('Password reset to: Admin@123');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

setTimeout(updatePassword, 2000);
