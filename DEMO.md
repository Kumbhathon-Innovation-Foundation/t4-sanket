# ANUBHAV — Live Demonstration & Rehearsal Guide

**Tower 4:** Pilgrim Experience  
**Team:** Sanket  
**Live URL / Port:** `http://localhost:3000`

---

## 🎬 3-Step Core Showcase: The Shared Operational Brain

This scenario proves live that **PRAVAH (Admin)** and **ANUBHAV (Pilgrim)** share a single operational brain, and that emergency police directives override algorithmic recommendations instantly.

### Step 1: 4:00 AM Arrival Query (Pilgrim Phone)
- **Screen:** Open `http://localhost:3000/pilgrim`
- **Action:** Tap preset chip `1. Hindi: 4 AM Journey` or ask:
  > *"मैं सुबह 4 बजे आ रहा हूँ। मुझे स्नान और दर्शन दोनों करने हैं। सबसे आसान और कम भीड़ वाला रास्ता बताओ।"*
- **Agent Response:**
  - Recommends **P09 Parking** (72% available) + **Route R18 (Bypass Corridor)** (~14 min walk).
  - Explicitly states that **Route R17 is rejected** under Police Advisory #KM-2026/891 due to peak crowd pressure.
  - Displays Tier Badges: `🟡 AUTOMATED GUIDANCE` & `🔵 VERIFIED ADVISORY`.

---

### Step 2: Live Tactical Override (Projector Screen)
- **Screen:** Open `http://localhost:3000/admin/guidance`
- **Action:** Click the glowing button in the Stage Hero Banner:
  > **`[ ⚡ 1-Click: Force-Close Route R18 (VIP Order) ]`**
- **Result:**
  - Control room displays: `🚨 Tactical Override Activated: Route R18 FORCE-CLOSED by SP Vikram Patil`.
  - **Within 2 seconds, the Pilgrim screen automatically lights up with a red alert banner:**
    `🚨 Tactical Override on Route R18: Force-closed by SP Vikram Patil. [Re-route Now]`
  - *(Notice: No manual page reload. No code redeploy. Instant real-time synchronization).*

---

### Step 3: Immediate Safe Re-Route (The Climax)
- **Action:** On the Pilgrim screen, tap **[Re-route Now]** or chip `🚨 7. Re-route / Override Check`:
  > *"अब मुझे कहाँ जाना चाहिए? क्या कोई आपातकालीन मार्ग परिवर्तन है?"*
- **Agent Instant Response (< 50ms):**
  - **Tier Badge:** `🔴 TACTICAL OVERRIDE`
  - **Answer:**
    > *"🚨 पुलिस आपातकालीन आदेश (Tactical Override 🔴): VIP काफिले व सुरक्षा कारणों से SP विक्रम पाटिल के आदेशानुसार मार्ग R18 (Bypass Corridor) को तत्काल बंद (FORCE-CLOSED) कर दिया गया है।
    > 🔵 सत्यापित सलाह (Verified Advisory 🔵): मार्ग R17 पर अत्यधिक भीड़ दबाव के कारण प्रतिबंध (#KM-2026/891) जारी है।
    > 🟡 अनुशंसित सुरक्षित मार्ग (Automated Guidance 🟡): ANUBHAV अब आपको मार्ग R21 (गोदावरी ब्रिज लिंक) से जाने का निर्देश देता है। यह मार्ग पूरी तरह सुरक्षित और सुगम है (~19 मिनट पैदल)। वाहन P09 पार्किंग में सुरक्षित पार्क करें।"*
  - **Structured UI Card:** Displays **TACTICAL DIVERSION ACTIVE** pointing to **R21 Godavari Bridge Link**.

---

## 📱 Additional Multilingual Showcase Scenes

1. **Context Retention (Hindi):** Ask *"अगर मैं 5 बजे पहुँचूँ तो?"* — ANUBHAV retains the journey context without needing parking/snan repeated, forecasting 5 AM crowd surge.
2. **Marathi Facility Search:** Ask *"मला रामकुंडच्या जवळ कमी गर्दी असलेलं स्वच्छ शौचालय कुठे मिळेल?"* — Recommends T12 Sanitation Unit (120m, 1 min wait).
3. **Marathi Food & Langar:** Ask *"स्नान झाल्यानंतर जवळपास चांगलं आणि परवडणारं जेवण कुठे मिळेल?"* — Recommends K08 Annakshetra (350m, ₹40 reference price).
4. **English Darshan-First Plan:** Ask *"Actually, I want to go for darshan first. What should I do?"* — Dynamically shifts sequence to Kalaram Mandir first.
5. **Citizen Kiosk Terminal:** Open `http://localhost:3000/kisko` for the 55" high-contrast public touch kiosk.

---

## ⚙️ Deterministic Test Data

| Resource | Identifier | Role in Demo |
|---|---|---|
| Route | **R17** (Direct Ghat Link) | Peak crowd + Active Police Restriction (#KM-2026/891) |
| Route | **R18** (Bypass Corridor) | Recommended initially, then targeted by 1-click Force-Close |
| Route | **R21** (Godavari Bridge Link) | Clear backup route selected after override |
| Parking | **P09** (North Ring Staging) | Recommended parking with 72% bay availability |
| Facility | **T12** (Sanitation Block) | Lowest wait time (~1 min) near Ramkund |
| Kitchen | **K08** (Community Kitchen) | 2,400+ meals available, ₹40 reference price |
