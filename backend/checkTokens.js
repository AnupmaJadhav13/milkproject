require('dotenv').config();
const mongoose = require('mongoose');
const Farmer = require('./models/Farmer');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const farmers = await Farmer.find({}).select('fullName mobileNumber expoPushToken').lean();
  console.log('Total farmers:', farmers.length);
  const withTokens = farmers.filter(f => f.expoPushToken);
  console.log('With tokens:', withTokens.length);
  if (withTokens.length > 0) {
    withTokens.forEach(f => console.log(f.fullName, ':', f.expoPushToken));
  } else {
    console.log('NO TOKENS FOUND - Farmer needs to login in the app!');
  }
  await mongoose.connection.close();
}
check();
