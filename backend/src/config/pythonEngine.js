// backend/src/config/pythonEngine.js
// تكوين الاتصال بمحرك التداول Python (FastAPI)
// هذا الملف لا يغيّر منطق التداول، فقط يعرّف عناوين الاتصال

require('dotenv').config();

const PYTHON_ENGINE_HOST = process.env.PYTHON_ENGINE_HOST || 'localhost';
const PYTHON_ENGINE_PORT = process.env.PYTHON_PORT || 8000;
// المسار الأساسي للـ API داخل محرك Python (حسب trading_engine.py)
const PYTHON_ENGINE_BASE_PATH = process.env.PYTHON_ENGINE_BASE_PATH || '/api/v1';

const PYTHON_ENGINE_BASE_URL =
  process.env.PYTHON_ENGINE_URL ||
  `http://${PYTHON_ENGINE_HOST}:${PYTHON_ENGINE_PORT}${PYTHON_ENGINE_BASE_PATH}`;

module.exports = {
  host: PYTHON_ENGINE_HOST,
  port: PYTHON_ENGINE_PORT,
  basePath: PYTHON_ENGINE_BASE_PATH,
  baseUrl: PYTHON_ENGINE_BASE_URL,
};
