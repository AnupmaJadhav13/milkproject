# Quick Start - Notification Permission Feature

## ✨ What's New?

When farmers or collection centers login, they will see:

### ✅ If Permission Granted:
```
┌─────────────────────┐
│        ✓            │
│  सूचना सक्रिय!      │
│  Notification       │
│  Activated!         │
└─────────────────────┘
```
*Auto-dismisses in 3 seconds*

### ⚠️ If Permission Denied:
```
┌─────────────────────────┐
│         ⚠               │
│   सूचना बंद आहेत        │
│   Notifications         │
│   Disabled              │
│                         │
│ Benefits:               │
│ • Milk records          │
│ • Payment updates       │
│ • Advance amounts       │
│ • Important messages    │
│                         │
│ [Enable Notifications]  │
│ [Open Settings]         │
│ [Later]                 │
└─────────────────────────┘
```
*Stays until user acts*

---

## 🚀 How to Deploy

### Step 1: Build APK
```bash
cd frontend
eas build -p android --profile preview
```

### Step 2: Install on Device
- Download APK from EAS
- Install on real Android device

### Step 3: Test
1. Login as farmer or collection head
2. Grant permission when asked
3. See success popup
4. Wait 10 seconds
5. Run: `cd backend && node checkTokens.js`
6. Should see token saved

---

## ✅ What Happens

### Timeline:
```
0s  → User logs in
1s  → Permission requested (if needed)
2s  → User taps "Allow"
3s  → Token registered
4s  → Success popup appears
7s  → Popup auto-dismisses
```

### If User Denies:
```
0s  → User logs in
1s  → Permission requested
2s  → User taps "Deny"
3s  → Warning screen appears
    → User can:
      - Retry (tap "Enable Notifications")
      - Open Settings (tap "Open Settings")
      - Dismiss (tap "Later")
```

---

## 🔍 Verify It's Working

### Check Token Saved:
```bash
cd backend
node checkTokens.js
```

**Success:**
```
With tokens: 1
[User Name] : ExponentPushToken[xxx]
```

### Send Test:
```bash
cd backend
node testPushNotifications.js
```

**Success:**
- Notification appears on phone

---

## 📱 User Experience

### For Farmers:
- Clear feedback when notifications enabled
- Easy retry if denied
- Knows they'll receive milk records, payments, etc.

### For Collection Centers:
- Same experience as farmers
- Knows they'll receive collection summaries, alerts, etc.

### For Admin:
- No popup (admin doesn't need push notifications)

---

## 🎯 Key Features

1. ✅ **Auto-detects** permission status
2. ✅ **Success popup** when activated (3 seconds)
3. ✅ **Warning screen** if denied (stays until action)
4. ✅ **Retry button** to request again
5. ✅ **Settings button** to open phone settings
6. ✅ **Bilingual** (Marathi + English)
7. ✅ **Works for** farmers and collection centers
8. ✅ **Saves token** to backend automatically

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| No popup appears | Check user is farmer/collection head (not admin) |
| Token not saved | Check backend running, phone has internet |
| Can't retry | Use "Open Settings" button |
| Popup appears every time | Token not saving - check backend logs |

---

## ✅ Done!

That's it! Build the APK, install it, and the feature will work automatically.

**No configuration needed!** 🎉
