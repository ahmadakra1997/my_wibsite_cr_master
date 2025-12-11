// backend/services/botCreator.js
// جسر بين الكود القديم والجديد لخدمة إنشاء البوتات.
// يجعل المسار ../services/botCreator يعمل مع الخدمة الفعلية الموجودة داخل backend/nodejs/services/botCreator.js

const BotCreatorService = require('../nodejs/services/botCreator');

module.exports = BotCreatorService;
