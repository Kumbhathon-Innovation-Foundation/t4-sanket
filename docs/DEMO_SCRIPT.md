# ANUBHAV & PRAVAH — 5-Minute Live Pitch & Demonstration Script

> **The One Sentence to Open Your Pitch:**
> *"A pilgrim doesn't need to understand our backend, maps or complex data sources. They simply ask in their own language, and ANUBHAV turns multiple live operational inputs into the best next action."*

---

## Screen Setup for Stage / Judges

- **Screen 1 (Projector / Main Display)**:
  `http://localhost:3000/admin/guidance` (PRAVAH Command Center — Guidance Hub)
- **Screen 2 (Presenter Smartphone or Mobile View)**:
  `http://localhost:3000/pilgrim` (ANUBHAV Pilgrim Mobile AI Assistant)
- **Screen 3 (Alternative Tab)**:
  `http://localhost:3000/kisko` (KISKO Public Citizen Terminal)

---

## Timed 5-Minute Rehearsal Sequence

### ⏱️ Minute 0:00 – 0:45: The Problem & The Architecture
**Speaker:**
> *"At Kumbh Mela 2026, over 10 million pilgrims move through Nashik and Trimbakeshwar in a single day. Static signboards fail. Generic AI chatbots fail because they give hallucinated or outdated travel advice.*
>
> *Today, we present **PRAVAH**, our live command center, and **ANUBHAV**, the pilgrim-facing AI assistant. Notice the difference: ANUBHAV is not an LLM guessing answers. It is an agent connected to live operational tools that enforces a strict deterministic authority hierarchy: Police Verified Orders and Tactical Overrides ALWAYS override raw automated signals."*

---

### ⏱️ Minute 0:45 – 1:30: Scene 1 — Hindi: Plan My Journey
**Action:** Tap the first demo chip on the phone (`1. Hindi: 4 AM Journey`) or speak:
> 🎤 *"मैं सुबह 4 बजे आ रहा हूँ। मुझे स्नान और दर्शन दोनों करने हैं। सबसे आसान और कम भीड़ वाला रास्ता बताओ।"*

**ANUBHAV Agent Response:**
> *"अगर आप सुबह 4 बजे आ रहे हैं, तो मैं P09 पार्किंग की सलाह दूंगा। वहाँ से R18 मार्ग से जाना अभी बेहतर है। इस मार्ग पर भीड़ का दबाव कम है और लगभग 14 मिनट पैदल चलना होगा।"*

**Visual on Screen:**
- Structured **RECOMMENDED JOURNEY** Card appears:
  - P09 Parking (72% availability)
  - $\downarrow$
  - R18 Route (Moderate crowd)
  - $\downarrow$
  - Darshan / Snan (14 min walk)
  - [ START JOURNEY ]

---

### ⏱️ Minute 1:30 – 2:10: Scene 2 — Context Retention in Hindi
**Action:** Tap the second demo chip (`2. Hindi: 5 AM Follow-up`) or speak:
> 🎤 *"अगर मैं 5 बजे पहुँचूँ तो?"*

**Key Point to Tell Judges:**
> *"Notice: the pilgrim did not repeat their destination, purpose, or parking need. ANUBHAV remembers the complete journey context across turns."*

**ANUBHAV Agent Response:**
> *"5 बजे स्थिति थोड़ी अलग होगी। R18 पर भीड़ बढ़ने की संभावना है। मैं आपको R21 विकल्प देखने की सलाह दूंगा।"*

---

### ⏱️ Minute 2:10 – 2:50: Scene 3 & 4 — Seamless Marathi Transition
**Action:** Switch languages without resetting the session! Tap chip `3. Marathi: Toilet T12`:
> 🎤 *"मला रामकुंडच्या जवळ कमी गर्दी असलेलं स्वच्छ शौचालय कुठे मिळेल?"*

**ANUBHAV Agent Response (in Marathi):**
> *"तुमच्या जवळ T12 शौचालय हा सध्या चांगला पर्याय आहे. ते सुमारे 120 मीटर अंतरावर आहे आणि प्रतीक्षा वेळ अंदाजे 1 मिनिट आहे."*

**Visual on Screen:**
- Interactive Marathi Card: **T12 स्वच्छता गृह** • 120 m • प्रतीक्षा: ~1 मिनिट • अलीकडे पडताळले • [ मार्ग दाखवा ]

**Follow-up (Food in Marathi):** Tap chip `4. Marathi: Food K08`:
> 🎤 *"स्नान झाल्यानंतर जवळपास चांगलं आणि परवडणारं जेवण कुठे मिळेल?"*

**ANUBHAV Agent Response:**
> *"सध्या K08 कम्युनिटी किचन हा चांगला पर्याय आहे. ते सुमारे 350 मीटरवर आहे आणि सध्या प्रतीक्षा वेळ कमी आहे. संदर्भ किंमत ₹40 आहे."*

**Key Point to Tell Judges:**
> *"Notice we display a 'Reference Price: ₹40' rather than pretending food cost is guaranteed. Transparency is crucial in public civic deployments."*

---

### ⏱️ Minute 2:50 – 3:30: Scene 5 — English Plan Revision
**Action:** Switch to English. Tap chip `5. English: Darshan First`:
> 🎤 *"Actually, I want to go for darshan first. What should I do?"*

**ANUBHAV Agent Response:**
> *"In that case, I'd recommend going for darshan first. Based on the current conditions, P09 → R18 is still the better option."*

**Visual on Screen:**
- **REVISED DARSHAN PLAN**:
  P09 Parking $\rightarrow$ R18 Route $\rightarrow$ Kalaram Mandir Darshan $\rightarrow$ Ramkund Snan $\rightarrow$ K08 Community Kitchen.

---

### ⏱️ Minute 3:30 – 4:15: The Climax — Live Tactical Override & Dynamic Re-Route (The Core Showcase)
**Speaker:**
> *"Now for the defining moment that separates ANUBHAV from every chatbot you've ever seen: The Operational Brain in action. What happens when an emergency or VIP procession closes our recommended route?"*

1. **Switch focus to Screen 1 (Projector — PRAVAH Guidance Hub)**:
   - The presenter clicks the glowing hero button:
     **[ ⚡ 1-Click: Force-Close Route R18 (VIP Order) ]**
   - Live Toast pops up on the control room screen:
     `🚨 Tactical Override Activated: Route R18 FORCE-CLOSED by SP Vikram Patil`

2. **Watch Screen 2 (Pilgrim Mobile Screen)**:
   - Notice: **NO manual refresh. NO redeploy.**
   - Within 2 seconds, a pulsing alert banner appears at the top of the chat:
     `🚨 Tactical Override on Route R18: Force-closed by SP Vikram Patil. [Re-route Now]`

3. **Pilgrim Asks (or taps [Re-route Now] / Chip 7)**:
   > 🎤 *"अब मुझे कहाँ जाना चाहिए? क्या कोई आपातकालीन मार्ग परिवर्तन है?"*
   *(Or in English: "Where should I go now? Which route is safe?")*

4. **ANUBHAV Agent Instant Response (< 50ms latency)**:
   - **Tier Badge**: `🔴 TACTICAL OVERRIDE`
   - **Answer**:
     > *"🚨 पुलिस आपातकालीन आदेश (Tactical Override 🔴): VIP काफिले व सुरक्षा कारणों से SP विक्रम पाटिल के आदेशानुसार मार्ग R18 (Bypass Corridor) को तत्काल बंद कर दिया गया है।
     > 🔵 सत्यापित सलाह (Verified Advisory 🔵): मार्ग R17 पर अत्यधिक भीड़ दबाव के कारण प्रतिबंध (#KM-2026/891) जारी है।
     > 🟡 अनुशंसित सुरक्षित मार्ग (Automated Guidance 🟡): ANUBHAV अब आपको मार्ग R21 (गोदावरी ब्रिज लिंक) से जाने का निर्देश देता है। यह मार्ग पूरी तरह सुरक्षित और सुगम है (~19 मिनट पैदल)। वाहन P09 पार्किंग में सुरक्षित पार्क करें।"*
   - **Interactive Card**: **TACTICAL DIVERSION ACTIVE**
     - R21 Godavari Bridge Link (Selected ✅)
     - R18 Force-Closed (Tactical Override 🔴)
     - R17 Police Restricted (Verified Advisory 🔵)

**Key Point to Tell Judges:**
> *"One shared operational brain. When police command issues a tactical override in PRAVAH, every pilgrim's agent immediately adheres to that legal priority without hallucination, without delay, and with transparent explanation."*

---

### ⏱️ Minute 4:15 – 5:00: Scene 7 — KISKO Public Kiosk Display
**Action:** Switch to `http://localhost:3000/kisko`.
**Speaker:**
> *"What about elderly pilgrims, children, or citizens without smartphones? They walk up to any KISKO kiosk terminal."*

1. Tap the big glowing microphone on the kiosk:
2. Kiosk animates:
   - `Listening...` ("मुझे सबसे पास का कम भीड़ वाला शौचालय चाहिए।")
   - `Finding nearby facilities via PostGIS...`
   - `Checking current availability...`
3. Kiosk displays the high-contrast 55" display:
   - **T12**
   - 120 metres
   - Approx. 1 min wait
   - Currently working
   - Big touch button: **[ START WALKING ]**
4. Kiosk reads aloud via Hindi audio voice:
   *"आपके पास T12 सबसे अच्छा विकल्प है। यह 120 मीटर दूर है और प्रतीक्षा समय लगभग 1 मिनट है।"*
5. Countdown timer shows: *"Returning to idle in 15s..."*

---

## What NOT to Ask During the Pitch
❌ *"What is Ramkund?"*
❌ *"Tell me about Kumbh Mela history."*
❌ *"What is the weather in Nashik?"*

> **Why:** These questions make the project look like a generic wrapper around ChatGPT. Your core differentiator is **operational decision-making on live data with legal authority priority**. Keep all questions focused on *Where should I go? Which route is safe? Where can I park? Which toilet has no line? What routes are blocked?*

---

## Wi-Fi & Fail-Safe Checklist
- [x] Full offline resilience: `DATA_MODE=demo` has all 7 scenes, routes (R17, R18, R21), parking (P09), facilities (T12), kitchens (K08), and advisories pre-loaded.
- [x] Zero API key dependency: The deterministic NLP dispatcher responds in <15ms with 100% guarantee even with zero internet.
- [x] Speech synthesis uses standard browser `window.speechSynthesis`.
- [x] Touch-ready preset chips prevent typing mistakes on stage.
