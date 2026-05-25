/**
 * Test Push Notifications - Complete Diagnostic
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Farmer = require('./models/Farmer');
const { sendPushNotification } = require('./services/pushNotificationService');

async function testPush() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Check farmers with tokens
    console.log('═══════════════════════════════════════════════════════');
    console.log('STEP 1: Checking Farmers with Push Tokens');
    console.log('═══════════════════════════════════════════════════════\n');

    const farmers = await Farmer.find({}).select('fullName mobileNumber expoPushToken').lean();
    const withTokens = farmers.filter(f => f.expoPushToken);
    
    console.log(`Total Farmers: ${farmers.length}`);
    console.log(`With Push Tokens: ${withTokens.length}`);
    console.log(`Without Push Tokens: ${farmers.length - withTokens.length}\n`);

    if (withTokens.length === 0) {
      console.log('❌ NO FARMERS HAVE PUSH TOKENS!\n');
      console.log('This means:');
      console.log('1. No farmer has logged in with the new APK');
      console.log('2. OR notification permission was denied');
      console.log('3. OR push token registration failed\n');
      console.log('To fix:');
      console.log('1. Install the APK on a real device');
      console.log('2. Login as a farmer');
      console.log('3. Grant notification permission');
      console.log('4. Check if backend receives POST /auth/push-token');
      console.log('5. Run this script again\n');
      return;
    }

    // Step 2: Show farmers with tokens
    console.log('═══════════════════════════════════════════════════════');
    console.log('STEP 2: Farmers with Push Tokens');
    console.log('═══════════════════════════════════════════════════════\n');

    withTokens.forEach((f, i) => {
      console.log(`${i + 1}. ${f.fullName} (${f.mobileNumber})`);
      console.log(`   Token: ${f.expoPushToken.substring(0, 50)}...`);
      console.log('');
    });

    // Step 3: Test sending to first farmer
    console.log('═══════════════════════════════════════════════════════');
    console.log('STEP 3: Testing Push Notification');
    console.log('═══════════════════════════════════════════════════════\n');

    const testFarmer = withTokens[0];
    console.log(`Sending test notification to: ${testFarmer.fullName}\n`);

    const result = await sendPushNotification(testFarmer.expoPushToken, {
      title: 'Test Notification',
      body: 'This is a test push notification from backend!',
      data: { test: true }
    });

    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('');

    if (result.success) {
      console.log('✅ Push notification sent successfully!');
      console.log('');
      console.log('Check the farmer\'s phone:');
      console.log('- Notification should appear in notification bar');
      console.log('- If not, check:');
      console.log('  1. Phone has internet connection');
      console.log('  2. Notification permission is granted');
      console.log('  3. Expo Push API status: https://status.expo.dev/');
    } else {
      console.log('❌ Failed to send push notification');
      console.log('Error:', result.error);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testPush();
