# 🪔 कारीगर (Karigar) - भारत का विश्वसनीय कारीगर व सेवा मंच
### *India's Trusted Artisans & Hyperlocal Services Platform*

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-orange.svg)](https://vitejs.dev)
[![NodeJS](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20Prisma-blue.svg)](https://www.prisma.io)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8.svg)](https://tailwindcss.com)
[![Web Audio](https://img.shields.io/badge/Audio-Web%20Audio%20API-amber.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![License](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

---

## 🌟 परिचय (Introduction)

**कारीगर (Karigar)** भारत के हर राज्य, ज़िले और मोहल्ले के मेहनती कारीगरों (इलेक्ट्रीशियन, प्लंबर, बढ़ई, पेंटर, माली, हलवाई, दर्जी, मैकेनिक आदि) और ग्राहकों को सीधे जोड़ने वाला एक अत्यंत सरल, सुंदर और सांस्कृतिक मंच है।

यह कोई कॉर्पोरेट या एजेंसी आधारित ऐप नहीं है; यहाँ हर स्वतंत्र कारीगर अपना सीधा प्रोफ़ाइल बनाता है, और ग्राहक अपनी गली-मोहल्ले में उपलब्ध कारीगर को बिना किसी बिचौलिये या कमीशन के सीधे फ़ोन कॉल कर काम पर बुला सकते हैं।

---

## ✨ मुख्य विशेषताएँ (Key Highlights)

### 1. 🇮🇳 भारतीय संस्कृति से प्रेरित डिज़ाइन (Indian Cultural Aesthetics)
- **रंग और कला**: मिट्टी (Terracotta), गहरा पीतल (Brass), हल्दी-केसरिया (Amber/Marigold) और पारंपरिक **रंगोली व मांडणा (Rangoli & Mandana)** पैटर्न्स। *(राष्ट्रीय ध्वज के रंगों का व्यावसायिक उपयोग वर्जित रखा गया है)*।
- **सरल भाषा विकल्प**: शुद्ध व सम्मानजनक हिंदी (देवनागरी) तथा स्पष्ट अंग्रेजी भाषा में तुरंत स्विच करने की सुविधा।

### 2. 📱 बिना ईमेल की झंझट - सिर्फ़ मोबाइल नंबर (Zero Email Barrier)
- भारत के ज़्यादातर कुशल कारीगरों के पास ईमेल आईडी नहीं होती। कारीगर मंच पर रजिस्ट्रेशन और लॉगिन **केवल 10-अंकों के मोबाइल नंबर** से तुरंत हो जाता है।
- कारीगर अपनी पहचान के लिए केवल नाम, काम की श्रेणी और वैकल्पिक आधार/पैन/ड्राइविंग लाइसेंस नंबर दर्ज करते हैं।

### 3. ⏱️ 3-स्थिति ड्यूटी स्विचर (3-State Real-Time Duty Switcher)
कारीगर जब चाहें अपने काम की उपलब्धता खुद नियंत्रित कर सकते हैं:
- 🟢 **उपलब्ध (फ्री)** — नए काम की कॉल पाने के लिए तैयार।
- 🟡 **काम पर व्यस्त (Busy on Job)** — अभी ग्राहक के यहाँ काम चालू है।
- ⚪ **विश्राम पर (Off Duty)** — आज का काम समाप्त या अवकाश।

### 4. 🔔 मंगल ध्वनि व ऑडियो फ़ीडबैक (Acoustic Web Audio Feedback)
- भारी ऑडियो फ़ाइलों (MP3) के बिना, ब्राउज़र के नेटिव **Web Audio API सिंथेसाइज़र** द्वारा निर्मित सुखद व पारंपरिक मंदिर की घंटी (Temple Chime) और वीणा के सुर।
- रजिस्ट्रेशन पूरा होने पर मंगल ध्वनि, ड्यूटी बदलने पर सौम्य बीप, और स्टार रेटिंग चुनते समय मधुर कॉर्ड्स।

### 5. 🤝 ग्राहक सम्मान व समीक्षा प्रणाली (Respectful Feedback & Gratitude)
- काम पूरा होने के बाद ग्राहक कारीगर को 1 से 5 स्टार रेटिंग और सकारात्मक सम्मान बैज दे सकते हैं:
  - ⏱️ *समय के पाबंद (Punctual)*
  - 💰 *वाजिब दाम (Fair Price)*
  - 🛠️ *हुनरमंद कारीगर (Skilled Work)*
  - ✨ *सफ़ाई पसंद (Clean & Tidy)*
  - 🙏 *सभ्य व्यवहार (Polite & Respectful)*
  - ⚡ *तुरंत समाधान (Quick Fix)*

---

## 📁 प्रोजेक्ट संरचना (Folder Structure)

```text
Karigar-Platform/
├── backend/                  # Node.js + Express + Prisma REST API
│   ├── prisma/               # Database Schema (PostgreSQL)
│   ├── scripts/              # Database starter & seed scripts
│   ├── src/
│   │   ├── config/           # Database & environment config
│   │   ├── middleware/       # JWT auth, validation, rate limiting
│   │   ├── modules/          # Auth, Vendors, Search, Reviews, Reports
│   │   └── server.js         # Express server entry point
│   ├── tests/                # 122+ Automated Jest unit & integration tests
│   ├── Dockerfile            # Container configuration
│   └── package.json
│
├── frontend/                 # React 18 + Vite + Tailwind CSS SPA
│   ├── src/
│   │   ├── api/              # Axios API client
│   │   ├── components/       # Common, Rangoli, Duty Switcher, Reviews
│   │   ├── context/          # Auth & Duty state providers
│   │   ├── locales/          # Pure Hindi & English translation dictionaries
│   │   ├── pages/            # Home, Search, Vendor Profile, Dashboards
│   │   └── utils/            # Web Audio synthesis & Indian locations database
│   ├── Dockerfile            # Production Nginx container
│   ├── nginx.conf            # SPA routing & reverse proxy
│   ├── vercel.json           # Vercel deployment configuration
│   └── package.json
│
├── docs/                     # Design philosophy & architectural guidelines
├── DEPLOY_24_7.md            # Step-by-step 100% Free 24/7 Cloud Hosting Guide
├── docker-compose.yml        # 1-command startup for Postgres + Backend + Frontend
├── render.yaml               # 1-click cloud backend deployment blueprint
├── start-windows.bat         # 1-click double-click launcher for Windows
└── README.md
```

---

## 🚀 GitHub पर अपलोड कैसे करें (How to Upload to GitHub)

### विकल्प 1: GitHub Desktop द्वारा (सबसे आसान - Most Recommended)
1. [GitHub Desktop डाउनलोड करें](https://desktop.github.com) और अपने GitHub खाते से लॉगिन करें।
2. **File** > **Add Local Repository** पर क्लिक करें।
3. अपने Desktop पर मौजूद `Karigar-Platform` फ़ोल्डर को चुनें।
4. **Create a Repository** पर क्लिक करें।
5. ऊपर दाईं ओर **Publish repository** बटन दबाएं। आपका कोड तुरंत GitHub पर सुरक्षित अपलोड हो जाएगा!

### विकल्प 2: GitHub वेबसाइट पर ड्रैग-एंड-ड्रॉप (Drag & Drop via Web)
1. [GitHub.com](https://github.com) पर जाकर नया रिपॉजिटरी बनाएं: नाम दें `Karigar-Platform`।
2. रिपॉजिटरी पेज पर **"uploading an existing file"** पर क्लिक करें।
3. Desktop से `Karigar-Platform` के सभी फ़ाइल्स और फ़ोल्डर्स को सीधे ब्राउज़र विंडो में खींचकर छोड़ दें।
4. नीचे **Commit changes** पर क्लिक करें।

### विकल्प 3: Git कमांड लाइन द्वारा (Git CLI)
```bash
cd c:\Users\24f20\Desktop\Karigar-Platform
git init
git add .
git commit -m "Initial commit: कारीगर (Karigar) Full-Stack Platform"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/Karigar-Platform.git
git push -u origin main
```

---

## 💻 अपने कंप्यूटर पर चलाएं (Local Quickstart)

### विंडोज़ 1-क्लिक स्टार्टर (Windows 1-Click):
Desktop पर `Karigar-Platform` फ़ोल्डर खोलें और **`start-windows.bat`** पर डबल-क्लिक करें!
यह स्वचालित रूप से डेटाबेस, बैकएंड और फ़्रंटएंड चालू कर देगा।

### मैन्युअल कमांड द्वारा (Manual):
1. **डिपेंडेंसी इंस्टॉल करें**:
   ```bash
   npm run install:all
   ```

2. **डेवलपमेंट सर्वर शुरू करें**:
   ```bash
   npm run dev
   ```

3. ब्राउज़र में खोलें:
   - **फ़्रंटएंड**: [http://localhost:5173](http://localhost:5173)
   - **बैकएंड API**: [http://localhost:5000](http://localhost:5000)

---

## 🌐 24/7 मुफ़्त क्लाउड पर लाइव करें (Deploy 24/7 Free)

विस्तृत जानकारी के लिए [DEPLOY_24_7.md](./DEPLOY_24_7.md) फ़ाइल देखें। संक्षेप में:
1. **Database**: [Neon.tech](https://neon.tech) पर मुफ़्त सर्वरलेस PostgreSQL डेटाबेस बनाएं।
2. **Backend**: [Render.com](https://render.com) पर मुफ़्त Web Service बनाएं (GitHub रेपो कनेक्ट करके)।
3. **Frontend**: [Vercel.com](https://vercel.com) पर मुफ़्त SPA होस्ट करें।
4. **24/7 एक्टिवेशन**: [UptimeRobot.com](https://uptimerobot.com) द्वारा बैकएंड के `/api/v1/health` पर हर 5 मिनट में पिंग सेट करें ताकि सर्वर कभी स्लीप न हो!

---

## 📜 लाइसेंस (License)

यह प्रोजेक्ट MIT लाइसेंस के तहत खुला और मुफ़्त उपलब्ध है।
