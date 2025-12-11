# Quantum AI Trader – Full Stack Platform

منصّة **Quantum AI Trader** هي مشروع متكامل للتداول الآلي والذكاء الاصطناعي، يجمع بين:

- واجهة تداول احترافية (React + WebSockets + Realtime Charts)
- نظام بوت تداول متقدم (Node.js / Python)
- طبقة أمان ومراقبة وأدوات تحليل أداء

> الهدف: توفير Cockpit واحد للمستخدم يتحكّم منه في استراتيجياته، المخاطر، وسلوك البوت في الزمن الحقيقي.

---

## 1. Tech Stack

### Frontend

- **React 18** + **React Router v6**
- **Redux Toolkit / React-Redux**
- **Tailwind CSS** + تصميم مخصص *Quantum Neon*
- **WebSockets** و **socket.io-client** لتدفق البيانات الحي
- **Recharts / lightweight-charts** لرسوم التداول
- **i18next** لدعم عدة لغات (ar/en/ru/tr/zh)
- Hooks مخصّصة: `useWebSocket`, `useTrading`, سياقات `AuthContext`, `TradingContext`, إلخ.

### Backend

#### Node.js Layer

- **Express.js** مع:
  - طبقة أمان (Helmet, Rate Limit, CORS, Compression, Logging)
  - Middlewares مخصّصة (auth, botAuth, upload, …)
- هيكلية متقدمة في: `backend/src/`
  - `app.js` كـ Bootstrap رئيسي
  - Routes منظمة (`auth`, `bot`, `client`, `admin/security`, `webhooks/telegram`, `webhooks/exchanges`)
  - خدمات أمان: `CyberSecurityMonitor`, `AntiReverseEngineering`
  - Models للتداول والبوت: `Bot`, `BotSettings`, `TradeHistory` …

#### Python AI & Trading Engine

- FastAPI (مخطط له – `requirements.txt`)
- ملف أساسي: `backend/python/trading_engine.py`
  - تكامل مع:
    - **CCXT** للتداول والتعامل مع البورصات
    - **TA-Lib / pandas-ta** للمؤشرات الفنية
    - **TensorFlow / scikit-learn** لنماذج الذكاء الاصطناعي
    - **Redis / websockets / aiohttp** للتعامل غير المتزامن
- وحدات مراقبة وتشخيص:
  - `monitoring/health_monitor.py`
  - `monitoring/performance_auditor.py`
  - `monitoring/performance_tracker.py`
  - `diagnostics/project_analyzer.py` لتحليل هيكل المشروع

---

## 2. Project Structure

```text
my_wibsite_cr-master/
├─ frontend/                # React Frontend (Quantum AI UI)
│  ├─ public/
│  └─ src/
│     ├─ index.js
│     ├─ index.css         # Tailwind + Global styles + Quantum theme helpers
│     ├─ App.js            # Root Router + Layout + Error boundaries
│     ├─ App.css
│     ├─ store/            # Redux store, trading slice, persisted state
│     ├─ services/         # websocketService, PerformanceMonitor, SecurityService, ErrorTrackingService...
│     ├─ context/          # AuthContext, BotContext, TradingContext...
│     ├─ hooks/            # useTrading, useWebSocket, ...
│     ├─ components/
│     │  ├─ trading/       # TradingInterface, OrderBook, RiskMonitor, LiveCharts, AISignals...
│     │  ├─ bot/           # BotDashboard, BotControls, BotSettings, BotPerformance...
│     │  ├─ dashboard/     # Monitoring Dashboard, LivePerformance...
│     │  ├─ auth/          # AuthModal / AuthPanel
│     │  ├─ settings/      # SettingsPage (interface + risk + notifications)
│     │  ├─ layout/        # AppHeader, AppFooter
│     │  ├─ common/        # LoadingSpinner, ErrorFallback, EmptyState, MaintenanceMode, Toasts...
│     │  └─ landing/       # HeroSection, FeaturesSection, etc.
│     └─ locales/          # i18n translations (ar/en/ru/tr/zh)
│
└─ backend/
   ├─ config/               # database.js, env.js (secure config)
   ├─ controllers/          # legacy controllers (auth, products, orders, payments, users...)
   ├─ routes/               # legacy REST routes (auth, products, orders, payment, users...)
   ├─ middleware/           # auth, botAuth, upload
   ├─ models/               # Cart, Client, Order, Product, User
   ├─ nodejs/
   │  └─ services/          # botCreator.js, botManager.js (Node bot services)
   ├─ src/
   │  ├─ app.js             # Advanced Express app bootstrap (QATraderBackend class)
   │  ├─ controllers/bot/   # botController (v2) + botService
   │  ├─ models/bot/        # Bot, BotSettings
   │  ├─ models/trading/    # TradeHistory
   │  ├─ routes/bot.js      # New secure bot routes
   │  ├─ security/          # cyberSecurityMonitor, antiReverseEngineering, exchange clients...
   │  └─ utils/             # logger, errorHandler, responseHandler...
   └─ python/
      ├─ trading_engine.py  # Core AI trading engine (no strategy logic touched)
      ├─ config/            # settings.py
      ├─ monitoring/        # health_monitor, performance_auditor, performance_tracker
      ├─ diagnostics/       # project_analyzer
      ├─ testing/           # different integration tests & scenario runners
      └─ requirements.txt   # Python dependencies
