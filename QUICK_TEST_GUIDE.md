# Quick Test Guide - Push Notifications

## 🚀 Quick Commands

### Check if farmers have push tokens:
```bash
cd backend
node checkTokens.js
```

### Send test push notification:
```bash
cd backend
node testPushNotifications.js
```

---

## ✅ What Should Happen

### 1. Before Farmer Logs In
```bash
node checkTokens.js
```
**Output:**
```
Total farmers: 10
With tokens: 0
NO TOKENS FOUND
```

### 2. Farmer Logs In (on real Android device)
- Opens app
- Enters mobile number + password
- Grants notification permission
- Backend logs: `POST /auth/push-token 200`

### 3. After Farmer Logs In
```bash
node checkTokens.js
```
**Output:**
```
Total farmers: 10
With tokens: 1
Farmer Name : ExponentPushToken[xxxxxx]
```

### 4. Test Push Notification
```bash
node testPushNotifications.js
```
**Output:**
```
✅ Push notification sent successfully!
```

**Farmer's phone:**
- 📱 Notification appears in notification bar
- 🔔 Sound/vibration (if enabled)
- 📲 Tapping opens the app

### 5. Admin Sends Notification
- Admin panel → Notification tab
- Select farmer(s)
- Enter title + message
- Click Send

**Farmer receives:**
- ✅ Push notification (phone notification bar)
- ✅ In-app notification (Notifications screen)
- ✅ Socket event (real-time update)

---

## 🎯 Current Status

**✅ Code Implementation:** COMPLETE  
**✅ Backend Setup:** COMPLETE  
**✅ Frontend Setup:** COMPLETE  
**❌ Farmer Login:** NOT DONE YET

**Next Step:** Farmer must login in the app to save push token.

---

## 📱 Farmer Login Checklist

- [ ] Install NEW APK on real Android device
- [ ] Open app
- [ ] Login with mobile number + password
- [ ] Grant notification permission when prompted
- [ ] Backend logs: `POST /auth/push-token 200`
- [ ] Run: `node checkTokens.js` → Should show token
- [ ] Run: `node testPushNotifications.js` → Should send notification
- [ ] Check phone → Should see notification

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| No tokens found | Farmer needs to login in app |
| Token exists but no notification | Check phone notification permission |
| Backend error | Check backend logs for details |
| Invalid token format | Token should start with `ExponentPushToken[` |
| Notification not appearing | Check internet connection, Do Not Disturb mode |

---

## 📞 Support Commands

### Check backend is running:
```bash
cd backend
npm start
```

### Check frontend packages:
```bash
cd frontend
npm list expo-notifications
```

### Check backend packages:
```bash
cd backend
npm list expo-server-sdk
```

### View backend logs:
```bash
cd backend
# Start server and watch logs
npm start
```

---

## ✅ Success Criteria

Push notifications are working when:

1. ✅ `node checkTokens.js` shows tokens
2. ✅ `node testPushNotifications.js` sends successfully
3. ✅ Farmer's phone receives notification
4. ✅ Admin can send from notification tab
5. ✅ All 7 notification types send push

---

## 🎉 You're Done!

Once farmer logs in and you see the token, push notifications will work automatically for all notification types.

No further code changes needed!
