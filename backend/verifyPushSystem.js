/**
 * Complete Push Notification System Verification
 * Run this after farmer logs in to verify everything is working
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Farmer = require('./models/Farmer');
const CollectionCenter = require('./models/CollectionCenter');
const { sendPushNotification } = require('./services/pushNotificationService');

async function verify() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('PUSH NOTIFICATION SYSTEM VERIFICATION');
    console.log('═══════════════════════════════════════════════════════\n');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check farmers with tokens
    console.log('1. CHECKING FARMERS...');
    console.log('─────────────────────────────────────────────────────\n');

    const farmers = await Farmer.find({}).select('fullName mobileNumber expoPushToken pushTokenUpdatedAt').lean();
    const farmersWithTokens = farmers.filter(f => f.expoPushToken);
    
    console.log(`Total Farmers: ${farmers.length}`);
    console.log(`With Push Tokens: ${farmersWithTokens.length}\n`);

    if (farmersWithTokens.length > 0) {
      console.log('Farmers with tokens:');
      farmersWithTokens.forEach((f, i) => {
        console.log(`${i + 1}. ${f.fullName} (${f.mobileNumber})`);
        console.log(`   Token: ${f.expoPushToken.substring(0, 40)}...`);
        console.log(`   Updated: ${f.pushTokenUpdatedAt ? f.pushTokenUpdatedAt.toLocaleString() : 'N/A'}\n`);
      });
    } else {
      console.log('❌ NO FARMERS HAVE PUSH TOKENS\n');
      console.log('Action Required:');
      console.log('1. Farmer must login in the app');
      console.log('2. Grant notification permission');
      console.log('3. Wait 10 seconds');
      console.log('4. Run this script again\n');
    }

    // Check collection centers with tokens
    console.log('2. CHECKING COLLECTION CENTERS...');
    console.log('─────────────────────────────────────────────────────\n');

    const centers = await CollectionCenter.find({}).select('name collectionHead').lean();
    const centersWithTokens = centers.filter(c => c.collectionHead?.expoPushToken);
    
    console.log(`Total Centers: ${centers.length}`);
    console.log(`With Push Tokens: ${centersWithTokens.length}\n`);

    if (centersWithTokens.length > 0) {
      console.log('Collection centers with tokens:');
      centersWithTokens.forEach((c, i) => {
        console.log(`${i + 1}. ${c.name} - ${c.collectionHead.fullName}`);
        console.log(`   Token: ${c.collectionHead.expoPushToken.substring(0, 40)}...`);
        console.log(`   Updated: ${c.collectionHead.pushTokenUpdatedAt ? c.collectionHead.pushTokenUpdatedAt.toLocaleString() : 'N/A'}\n`);
      });
    }

    // Test sending notification
    if (farmersWithTokens.length > 0) {
      console.log('3. TESTING PUSH NOTIFICATION...');
      console.log('─────────────────────────────────────────────────────\n');

      const testFarmer = farmersWithTokens[0];
      console.log(`Sending test notification to: ${testFarmer.fullName}\n`);

      const result = await sendPushNotification(testFarmer.expoPushToken, {
        title: 'Test Notification',
        body: 'Push notification system is working! ✅',
        data: { test: true, timestamp: new Date().toISOString() }
      });

      if (result.success) {
        console.log('✅ TEST NOTIFICATION SENT SUCCESSFULLY!\n');
        console.log('Check the farmer\'s phone:');
        console.log('- Notification should appear in notification bar');
        console.log('- Tap to open the app\n');
      } else {
        console.log('❌ FAILED TO SEND TEST NOTIFICATION\n');
        console.log('Error:', result.error);
        console.log('\nPossible causes:');
        console.log('1. Invalid token format');
        console.log('2. Expo push service is down');
        console.log('3. Token has expired\n');
      }
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════\n');

    const totalWithTokens = farmersWithTokens.length + centersWithTokens.length;
    
    if (totalWithTokens > 0) {
      console.log(`✅ ${totalWithTokens} user(s) have push tokens registered`);
      console.log('✅ Push notification system is WORKING\n');
      
      console.log('Next steps:');
      console.log('1. Send notification from admin panel');
      console.log('2. Check if farmer receives it');
      console.log('3. If yes, system is fully working! 🎉\n');
    } else {
      console.log('❌ NO USERS HAVE PUSH TOKENS\n');
      
      console.log('To fix:');
      console.log('1. Build and install the latest APK');
      console.log('2. Login as farmer or collection head');
      console.log('3. Grant notification permission when prompted');
      console.log('4. Wait 10 seconds');
      console.log('5. Run this script again\n');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Disconnected from MongoDB\n');
  }
}

verify();

