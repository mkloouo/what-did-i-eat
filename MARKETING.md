# App Store Submission Copy & Metadata — What Did I Eat

---

## 1. App Store Metadata

### **App Name**
What Did I Eat

### **Subtitle** (30 characters max)
Mindful, calorie-free food journal

### **Promotional Text** (170 characters max)
Track your meals with photos—no calories, no guilt, no complicated logging. Just mindful awareness of what you eat.

### **Category**
- **Primary:** Health & Fitness
- **Secondary:** Photo & Video (or Food & Drink)

### **Keywords** (100 characters max, comma-separated)
food journal,meal tracker,mindful eating,photo diary,no calorie counting,food log,diet journal,meals

---

## 2. App Store Description

### **Full Description**

**Mindful Food Tracking Without the Guilt or Numbers**

*What Did I Eat* is a simple, photo-first food journal designed to help you build a healthier, more conscious relationship with eating.

Say goodbye to tedious calorie counting, strict macro targets, and the guilt that comes with overshooting arbitrary goals. *What Did I Eat* focuses purely on mindful awareness: capturing what you eat, when you eat, and how you felt about it.

---

### **Why You’ll Love "What Did I Eat"**

- 📸 **Instant Photo Logging:** Snap a photo or choose one from your library, add a quick comment, and you're done in seconds.
- 🚫 **No Calories, No Guilt:** Focus on awareness rather than numbers or strict targets.
- 📅 **Smart Auto-Grouping:** View your meals grouped naturally by hour intervals or bundled by day.
- 🗺️ **Rich Entry Details:** Look back at full-screen zoomable photos, notes, timestamps, and optional geotags.
- 🔒 **100% Private & Local:** Your data stays on your device. No cloud database, no tracking, no account required.

---

### **Key Features**

- **Simple & Intuitive Design:** A clean, flat design interface that makes logging effortless.
- **Flexible Photo Grouping:** Switch easily between hourly meal grouping or daily digest views in settings.
- **Detailed Memories:** Tap any photo to zoom in, view location tags, and read your notes.
- **Complete Privacy:** No analytics SDKs, no ads, no third-party tracking. Everything stays locally on your iPhone.

Shift your focus from strict diet math to true food awareness. Download *What Did I Eat* today!

---

## 3. App Store Connect Information

### **Primary Support URL**
`https://mkloouo.com` *(or your app support link)*

### **Marketing URL**
`https://mkloouo.com` *(optional)*

### **Privacy Policy URL**
`https://mkloouo.com/privacy` *(link to hosted privacy policy file)*

---

## 4. App Privacy (App Store Connect Data Types)

When completing the **App Privacy** questionnaire in App Store Connect:

- **Data Collection:** Select **"No, we do not collect data from this app."**
- **Explanation:** All user data (photos, comments, locations) is saved exclusively in the application's local storage container on the device and is never transmitted to an external server.

---

## 5. Permission Request Strings (`Info.plist`)

These are the user-facing permission explanations required when accessing device capabilities:

```xml
<!-- Camera Access -->
<key>NSCameraUsageDescription</key>
<string>What Did I Eat needs camera access so you can take photos of your meals to add to your journal.</string>

<!-- Photo Library Access -->
<key>NSPhotoLibraryUsageDescription</key>
<string>What Did I Eat needs access to your photo library so you can select meal photos to add to your journal.</string>

<!-- Location Access -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>What Did I Eat uses your location while logging a meal to save where your photo was taken.</string>

<!-- Microphone Access (if required by camera picker) -->
<key>NSMicrophoneUsageDescription</key>
<string>What Did I Eat requires microphone access while using the camera picker.</string>
```

---

## 6. Reviewer Notes (App Review Information)

### **Notes for App Reviewer**
> *What Did I Eat* is a simple, local-only photo food journal.
>
> - **Account Credentials:** No login or account creation is required.
> - **Backend / Servers:** The app operates entirely offline and does not connect to any server or cloud API.
> - **Testing steps:**
>   1. Tap the addition button to capture or select a food photo.
>   2. Add an optional comment and save the entry.
>   3. View entries grouped on the main timeline (toggle hourly/daily bundling in the Config screen).
>   4. Tap any group or photo to view detailed zoomable images, notes, and local metadata.
