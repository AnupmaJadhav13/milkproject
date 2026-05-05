const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');

dotenv.config();
connectDB();

const checkAdmin = async () => {
  try {
    const admin = await Admin.findOne({ username: 'admin' });
    console.log('Admin document:', JSON.stringify(admin, null, 2));
    console.log('\nPhone Number:', admin?.phoneNumber);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

setTimeout(checkAdmin, 2000);
