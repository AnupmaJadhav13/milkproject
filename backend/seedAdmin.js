const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');

dotenv.config();
connectDB();

const seedAdmin = async () => {
  try {
    const exists = await Admin.findOne({ username: 'admin' });
    if (exists) {
      console.log('Admin already exists');
      process.exit();
    }
    await Admin.create({
      name: 'Milk Project Admin',
      email: 'admin@milkproject.local',
      username: 'admin',
      password: 'Admin@123'
    });
    console.log('Admin user created: username=admin password=Admin@123');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();
