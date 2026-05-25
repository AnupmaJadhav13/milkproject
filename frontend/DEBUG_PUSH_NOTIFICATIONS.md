# Debug Push Notifications

## 🔍 How to Debug

### Step 1: Check Logs When Farmer Logs In

When you login as a farmer in the app, you should see these logs in order:

```
🔄 PushNotificationHandler effect triggered
👤 User: [Farmer Name] Role: farmer
🔑 Token exists: true
✅ Farmer logged in, registering for push notifications...
🚀 Starting push token registration...

🔔 ========================================
🔔 PUSH NOTIFICATION REGISTRATION START
🔔 ========================================
✅ Running on physical device
📱 Device info: { brand: ..., modelName: ..., osName: 'Android', osVersion: ... }
🔔 Starting push notification registration...
📋 Current permission status: undetermined (or granted)
🔔 Requesting notification permission... (if not granted)
📋 Permission request result: granted
✅ Permission granted, getting push token...
📱 Project ID: 1e6e0529-2de7-4b69-8ef5-8f389b4c111f
✅ Expo Push Token obtained successfully!
📱 Token: ExponentPushToken[xxxxxxxxxxxxxx]
📱 Token length: 50+
📱 Token starts with ExponentPushToken: true
🤖 Configuring Android notification channel...
✅ Android notification channel configured
🔔 ========================================
🔔 PUSH NOTIFICATION REGISTRATION SUCCESS
🔔 ========================================

📱 Got push token: ExponentPushToken[xxxxxxxxxxxxxx]
📱 Saving to backend...
✅ Push token saved successfully: { success: true, message: 'Push token saved successfully' }
```

---

## ❌ Common Issues and Solutions

### Issue 1: "Not a physical device"
```
❌ Not a physical device - push notifications only work on real devices
```

**Solution:** You're testing on an emulator. Use a real Android phone.

---

### Issue 2: "Permission denied"
```
❌ Push notification permission denied
```

**Solution:** 
1. Uninstall the app
2. Reinstall
3. When prompted, tap "Allow" for notifications
4. Or go to phone Settings → Apps → Sarvasvaa Dairy → Notifications → Enable

---

### Issue 3: "Error getting push token"
```
❌ PUSH NOTIFICATION REGISTRATION FAILED
❌ Error: [error message]
```

**Possible causes:**
1. **No internet connection** - Phone needs internet to get token
2. **Expo project ID missing** - Check app.json has `extra.eas.projectId`
3. **Expo services down** - Check https://status.expo.dev/

**Solution:**
1. Check phone has WiFi or mobile data
2. Check app.json has:
   ```json
   "extra": {
     "eas": {
       "projectId": "1e6e0529-2de7-4b69-8ef5-8f389b4c111f"
     }
   }
   ```
3. Rebuild the APK if app.json was changed

---

### Issue 4: "Token not saving to backend"
```
📱 Got push token: ExponentPushToken[xxx]
📱 Saving to backend...
❌ Error in registerAndSavePushToken: [error]
```

**Possible causes:**
1. **Backend not running** - Backend server is down
2. **Wrong API URL** - Frontend pointing to wrong backend
3. **Network error** - Phone can't reach backend

**Solution:**
1. Check backend is running: `cd backend && npm start`
2. Check frontend/src/api/api.js:
   ```javascript
   const USE_LOCAL = false; // Should be false for production
   const PRODUCTION_URL = 'https://milkproject.onrender.com/api';
   ```
3. Check phone can access the backend URL

---

### Issue 5: "No logs appearing at all"
```
(No logs when farmer logs in)
```

**Possible causes:**
1. **Old APK** - Using old APK without push notification code
2. **Not logged in as farmer** - Logged in as admin or collection head
3. **Redux state issue** - User/token not in Redux state

**Solution:**
1. Build NEW APK: `cd frontend && eas build -p android --profile preview`
2. Install the NEW APK
3. Login as FARMER (not admin)
4. Check Redux state has user.role === 'farmer'

---

## 🔧 How to View Logs

### Option 1: Using React Native Debugger (Recommended)
1. Install React Native Debugger
2. Open it before starting the app
3. All console.log will appear there

### Option 2: Using Expo CLI
```bash
cd frontend
npx expo start
```
Then press 'j' to open debugger

### Option 3: Using ADB (Android Debug Bridge)
```bash
adb logcat | grep -i "expo\|notification\|push"
```

### Option 4: Using Expo Go (for testing)
If you have Expo Go installed:
```bash
cd frontend
npx expo start
```
Scan QR code with Expo Go app - logs will appear in terminal

---

## ✅ Success Checklist

When everything works, you should see:

- [ ] ✅ Running on physical device
- [ ] ✅ Permission granted
- [ ] ✅ Expo Push Token obtained
- [ ] ✅ Token starts with "ExponentPushToken["
- [ ] ✅ Token saved to backend successfully
- [ ] ✅ `node backend/checkTokens.js` shows token
- [ ] ✅ `node backend/testPushNotifications.js` sends notification
- [ ] ✅ Phone receives notification in notification bar

---

## 🚀 Quick Test After Login

After farmer logs in, immediately run:

```bash
cd backend
node checkTokens.js
```

**Expected output:**
```
Total farmers: 10
With tokens: 1
[Farmer Name] : ExponentPushToken[xxxxxxxxxxxxxx]
```

If you see this, push notifications are working! 🎉

If you see "With tokens: 0", check the logs above to see what went wrong.

---

## 📱 Test Notification

Once token is saved, test it:

```bash
cd backend
node testPushNotifications.js
```

This will send a test notification to the farmer's phone.

**Expected result:**
- ✅ Notification appears in phone notification bar
- ✅ Sound/vibration (if enabled)
- ✅ Tapping opens the app

---

## 🆘 Still Not Working?

If you've tried everything and it's still not working:

1. **Share the logs** - Copy all logs from when farmer logs in
2. **Check token in database** - Run `node backend/checkTokens.js`
3. **Check backend logs** - Look for errors when saving token
4. **Check phone settings** - Notifications enabled for the app
5. **Try different phone** - Test on another Android device
6. **Check Expo status** - Visit https://status.expo.dev/

---

## 📞 Support

If you need help, provide:
1. Full logs from app when farmer logs in
2. Output of `node backend/checkTokens.js`
3. Backend logs when token is being saved
4. Phone model and Android version
5. Whether using preview or production APK
