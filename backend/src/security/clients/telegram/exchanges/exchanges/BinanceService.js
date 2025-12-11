// backend/clients/exchanges/exchanges/BinanceService.js - النسخة المتقدمة
const BaseExchangeService = require('../BaseExchangeService');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class BinanceService extends BaseExchangeService {
    constructor(credentials, options = {}) {
        super(credentials, {
            baseUrl: 'https://api.binance.com',
            apiVersion: 'v3',
            rateLimit: 20,
            precision: 8,
            supportedFeatures: ['spot', 'future', 'margin', 'options', 'staking', 'earn'],
            ...options
        });
        
        this.name = 'Binance';
        this.requiresSignatures = true;
        this.requiresPassphrase = false;
        this.supportedMarkets = new Map();
        this.futuresEnabled = false;
        this.marginEnabled = false;
        
        this.initializeEndpoints();
    }

    initializeEndpoints() {
        this.endpoints = {
            spot: {
                base: 'https://api.binance.com',
                future: 'https://fapi.binance.com',
                margin: 'https://api.binance.com',
                wallet: 'https://api.binance.com'
            },
            methods: {
                // Spot endpoints
                ping: { method: 'GET', path: '/api/v3/ping', auth: false },
                time: { method: 'GET', path: '/api/v3/time', auth: false },
                exchangeInfo: { method: 'GET', path: '/api/v3/exchangeInfo', auth: false },
                account: { method: 'GET', path: '/api/v3/account', auth: true },
                order: { method: 'POST', path: '/api/v3/order', auth: true },
                orderCancel: { method: 'DELETE', path: '/api/v3/order', auth: true },
                openOrders: { method: 'GET', path: '/api/v3/openOrders', auth: true },
                allOrders: { method: 'GET', path: '/api/v3/allOrders', auth: true },
                ticker24hr: { method: 'GET', path: '/api/v3/ticker/24hr', auth: false },
                tickerPrice: { method: 'GET', path: '/api/v3/ticker/price', auth: false },
                depth: { method: 'GET', path: '/api/v3/depth', auth: false },
                trades: { method: 'GET', path: '/api/v3/trades', auth: false },
                historicalTrades: { method: 'GET', path: '/api/v3/historicalTrades', auth: false },
                
                // Futures endpoints
                futurePing: { method: 'GET', path: '/fapi/v1/ping', auth: false },
                futureExchangeInfo: { method: 'GET', path: '/fapi/v1/exchangeInfo', auth: false },
                futureAccount: { method: 'GET', path: '/fapi/v2/account', auth: true },
                futurePosition: { method: 'GET', path: '/fapi/v2/positionRisk', auth: true },
                futureOrder: { method: 'POST', path: '/fapi/v1/order', auth: true },
                futureOrderCancel: { method: 'DELETE', path: '/fapi/v1/order', auth: true },
                
                // Margin endpoints
                marginAccount: { method: 'GET', path: '/sapi/v1/margin/account', auth: true },
                marginOrder: { method: 'POST', path: '/sapi/v1/margin/order', auth: true }
            }
        };
    }

    async connect() {
        try {
            const startTime = Date.now();
            
            // اختبار الاتصال بالنقاط المختلفة
            await Promise.all([
                this.testSpotConnection(),
                this.testFutureConnection().catch(() => {}), // Future قد لا يكون مفعلاً
                this.testMarginConnection().catch(() => {})  // Margin قد لا يكون مفعلاً
            ]);

            // تحميل معلومات السوق
            await this.loadMarketInfo();

            this.connected = true;
            this.lastPing = new Date();
            
            const connectionTime = Date.now() - startTime;
            
            this.emit('exchange_connected', {
                exchange: this.name,
                timestamp: this.lastPing,
                connectionTime,
                features: {
                    spot: true,
                    future: this.futuresEnabled,
                    margin: this.marginEnabled
                }
            });

            console.log(`✅ تم الاتصال بمنصة ${this.name} بنجاح (${connectionTime}ms)`);
            return true;

        } catch (error) {
            this.handleError('CONNECTION_FAILED', error);
            throw new Error(`فشل الاتصال بمنصة ${this.name}: ${error.message}`);
        }
    }

    async testSpotConnection() {
        return await this.executeWithRetry(async () => {
            const response = await this.axiosInstance.get(
                `${this.endpoints.spot.base}${this.endpoints.methods.ping.path}`
            );
            return response.data;
        }, 'testSpotConnection');
    }

    async testFutureConnection() {
        try {
            const response = await this.axiosInstance.get(
                `${this.endpoints.spot.future}${this.endpoints.methods.futurePing.path}`
            );
            this.futuresEnabled = true;
            return response.data;
        } catch (error) {
            this.futuresEnabled = false;
            throw error;
        }
    }

    async testMarginConnection() {
        try {
            const timestamp = Date.now();
            const signature = this.createSignature(`timestamp=${timestamp}`, this.credentials.secret);
            
            const response = await this.axiosInstance.get(
                `${this.endpoints.spot.base}${this.endpoints.methods.marginAccount.path}`,
                {
                    headers: { 'X-MBX-APIKEY': this.credentials.apiKey },
                    params: { timestamp, signature }
                }
            );
            this.marginEnabled = true;
            return response.data;
        } catch (error) {
            this.marginEnabled = false;
            throw error;
        }
    }

    async loadMarketInfo() {
        try {
            const response = await this.axiosInstance.get(
                `${this.endpoints.spot.base}${this.endpoints.methods.exchangeInfo.path}`
            );

            response.data.symbols.forEach(symbol => {
                if (symbol.status === 'TRADING') {
                    const priceFilter = symbol.filters.find(f => f.filterType === 'PRICE_FILTER');
                    const lotSize = symbol.filters.find(f => f.filterType === 'LOT_SIZE');
                    const minNotional = symbol.filters.find(f => f.filterType === 'MIN_NOTIONAL');
                    const maxOrders = symbol.filters.find(f => f.filterType === 'MAX_NUM_ORDERS');
                    
                    this.supportedMarkets.set(symbol.symbol, {
                        symbol: symbol.symbol,
                        base: symbol.baseAsset,
                        quote: symbol.quoteAsset,
                        status: symbol.status,
                        basePrecision: symbol.baseAssetPrecision,
                        quotePrecision: symbol.quoteAssetPrecision,
                        filters: {
                            price: {
                                min: parseFloat(priceFilter?.minPrice || 0),
                                max: parseFloat(priceFilter?.maxPrice || 0),
                                tick: parseFloat(priceFilter?.tickSize || 0)
                            },
                            quantity: {
                                min: parseFloat(lotSize?.minQty || 0),
                                max: parseFloat(lotSize?.maxQty || 0),
                                step: parseFloat(lotSize?.stepSize || 0)
                            },
                            notional: {
                                min: parseFloat(minNotional?.minNotional || 0)
                            },
                            orders: {
                                max: parseInt(maxOrders?.maxNumOrders || 0)
                            }
                        },
                        permissions: symbol.permissions,
                        orderTypes: symbol.orderTypes
                    });
                }
            });

            this.emit('markets_loaded', {
                exchange: this.name,
                count: this.supportedMarkets.size,
                timestamp: new Date()
            });

        } catch (error) {
            this.handleError('MARKET_INFO_LOAD_FAILED', error);
        }
    }

    async getBalance(accountType = 'spot') {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now();
            let endpoint, params = { timestamp, recvWindow: 60000 };

            switch (accountType) {
                case 'spot':
                    endpoint = this.endpoints.methods.account;
                    break;
                case 'future':
                    endpoint = this.endpoints.methods.futureAccount;
                    break;
                case 'margin':
                    endpoint = this.endpoints.methods.marginAccount;
                    break;
                default:
                    throw new Error(`نوع الحساب غير مدعوم: ${accountType}`);
            }

            const queryString = Object.keys(params)
                .map(key => `${key}=${params[key]}`)
                .join('&');
            const signature = this.createSignature(queryString, this.credentials.secret);

            const baseUrl = accountType === 'future' ? this.endpoints.spot.future : this.endpoints.spot.base;
            const response = await this.axiosInstance.get(
                `${baseUrl}${endpoint.path}`,
                {
                    headers: { 'X-MBX-APIKEY': this.credentials.apiKey },
                    params: { ...params, signature }
                }
            );

            const balances = this.formatBalanceResponse(response.data, accountType);
            
            this.emit('balance_loaded', {
                exchange: this.name,
                accountType,
                balances,
                timestamp: new Date()
            });

            return balances;
        }, `getBalance_${accountType}`);
    }

    formatBalanceResponse(data, accountType) {
        const balances = {};

        if (accountType === 'spot') {
            data.balances.forEach(balance => {
                const free = parseFloat(balance.free);
                const locked = parseFloat(balance.locked);
                const total = free + locked;
                
                if (total > 0) {
                    balances[balance.asset] = { free, locked, total };
                    this.updateBalance(balance.asset, total);
                }
            });
        } else if (accountType === 'future') {
            data.assets.forEach(asset => {
                const wallet = parseFloat(asset.walletBalance);
                if (wallet > 0) {
                    balances[asset.asset] = { 
                        free: wallet,
                        locked: 0,
                        total: wallet
                    };
                    this.updateBalance(asset.asset, wallet);
                }
            });
        } else if (accountType === 'margin') {
            data.userAssets.forEach(asset => {
                const free = parseFloat(asset.free);
                const locked = parseFloat(asset.locked);
                const borrowed = parseFloat(asset.borrowed);
                const total = free + locked;
                
                if (total > 0 || borrowed > 0) {
                    balances[asset.asset] = { 
                        free, 
                        locked, 
                        borrowed,
                        total,
                        net: free - borrowed
                    };
                    this.updateBalance(asset.asset, total);
                }
            });
        }

        return balances;
    }

    async createOrder(orderData) {
        this.validateOrderData(orderData);

        return await this.executeWithRetry(async () => {
            const timestamp = Date.now();
            const clientOrderId = orderData.clientOrderId || `x-${uuidv4().split('-')[0]}`;
            
            let endpoint, baseUrl, params = {
                symbol: this.formatSymbol(orderData.symbol),
                side: orderData.side.toUpperCase(),
                type: orderData.type.toUpperCase(),
                quantity: orderData.quantity,
                newClientOrderId: clientOrderId,
                timestamp: timestamp,
                recvWindow: 60000
            };

            // تحديد النقطة النهائية بناءً على نوع الحساب
            if (orderData.accountType === 'future') {
                endpoint = this.endpoints.methods.futureOrder;
                baseUrl = this.endpoints.spot.future;
                
                // إضافة معاملات العقود الآجلة
                if (orderData.positionSide) {
                    params.positionSide = orderData.positionSide;
                }
                if (orderData.reduceOnly !== undefined) {
                    params.reduceOnly = orderData.reduceOnly;
                }
            } else if (orderData.accountType === 'margin') {
                endpoint = this.endpoints.methods.marginOrder;
                baseUrl = this.endpoints.spot.base;
                
                // إضافة معاملات الهامش
                if (orderData.isIsolated !== undefined) {
                    params.isIsolated = orderData.isIsolated;
                }
                if (orderData.sideEffectType) {
                    params.sideEffectType = orderData.sideEffectType;
                }
            } else {
                endpoint = this.endpoints.methods.order;
                baseUrl = this.endpoints.spot.base;
            }

            // إضافة معاملات إضافية بناءً على نوع الطلب
            if (orderData.type === 'limit') {
                params.price = orderData.price;
                params.timeInForce = orderData.timeInForce || 'GTC';
            }

            if (orderData.stopPrice) {
                params.stopPrice = orderData.stopPrice;
            }

            if (orderData.icebergQty) {
                params.icebergQty = orderData.icebergQty;
            }

            const queryString = Object.keys(params)
                .map(key => `${key}=${params[key]}`)
                .join('&');
            const signature = this.createSignature(queryString, this.credentials.secret);

            const response = await this.axiosInstance({
                method: endpoint.method,
                url: `${baseUrl}${endpoint.path}`,
                headers: { 'X-MBX-APIKEY': this.credentials.apiKey },
                params: { ...params, signature }
            });

            const orderResult = this.formatOrderResponse(response.data, orderData.accountType || 'spot');
            this.updateOrder(orderResult);

            this.emit('order_created', {
                exchange: this.name,
                orderId: orderResult.orderId,
                clientOrderId: orderResult.clientOrderId,
                symbol: orderData.symbol,
                side: orderData.side,
                type: orderData.type,
                quantity: orderData.quantity,
                price: orderData.price,
                accountType: orderData.accountType || 'spot',
                timestamp: new Date()
            });

            return orderResult;
        }, 'createOrder');
    }

    async cancelOrder(orderId, symbol, accountType = 'spot') {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now();
            let endpoint, baseUrl, params = {
                symbol: this.formatSymbol(symbol),
                timestamp: timestamp,
                recvWindow: 60000
            };

            // إضافة معرّف الطلب
            if (orderId) {
                params.orderId = orderId;
            }

            // تحديد النقطة النهائية
            if (accountType === 'future') {
                endpoint = this.endpoints.methods.futureOrderCancel;
                baseUrl = this.endpoints.spot.future;
            } else if (accountType === 'margin') {
                endpoint = this.endpoints.methods.marginOrder;
                baseUrl = this.endpoints.spot.base;
                params.isIsolated = false; // يمكن جعل هذا قابل للتكوين
            } else {
                endpoint = this.endpoints.methods.orderCancel;
                baseUrl = this.endpoints.spot.base;
            }

            const queryString = Object.keys(params)
                .map(key => `${key}=${params[key]}`)
                .join('&');
            const signature = this.createSignature(queryString, this.credentials.secret);

            const response = await this.axiosInstance({
                method: endpoint.method,
                url: `${baseUrl}${endpoint.path}`,
                headers: { 'X-MBX-APIKEY': this.credentials.apiKey },
                params: { ...params, signature }
            });

            const cancelledOrder = this.formatOrderResponse(response.data, accountType);

            this.emit('order_cancelled', {
                exchange: this.name,
                orderId,
                symbol,
                accountType,
                timestamp: new Date()
            });

            return cancelledOrder;
        }, 'cancelOrder');
    }

    async getOrder(orderId, symbol, accountType = 'spot') {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now();
            let endpoint, baseUrl, params = {
                symbol: this.formatSymbol(symbol),
                timestamp: timestamp,
                recvWindow: 60000
            };

            // إضافة معرّف الطلب
            if (orderId) {
                params.orderId = orderId;
            }

            // تحديد النقطة النهائية
            if (accountType === 'future') {
                // Binance Futures لا يوفر نقطة نهائية مباشرة للحصول على طلب بمفرده
                // سنستخدم openOrders ونقوم بالتصفية
                const orders = await this.getOpenOrders(symbol, accountType);
                return orders.find(order => order.orderId == orderId) || null;
            } else {
                endpoint = this.endpoints.methods.order;
                baseUrl = this.endpoints.spot.base;
            }

            const queryString = Object.keys(params)
                .map(key => `${key}=${params[key]}`)
                .join('&');
            const signature = this.createSignature(queryString, this.credentials.secret);

            const response = await this.axiosInstance.get(
                `${baseUrl}${endpoint.path}`,
                {
                    headers: { 'X-MBX-APIKEY': this.credentials.apiKey },
                    params: { ...params, signature }
                }
            );

            return this.formatOrderResponse(response.data, accountType);
        }, 'getOrder');
    }

    async getOpenOrders(symbol = null, accountType = 'spot') {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now();
            let endpoint, baseUrl, params = { timestamp, recvWindow: 60000 };

            if (symbol) {
                params.symbol = this.formatSymbol(symbol);
            }

            if (accountType === 'future') {
                endpoint = this.endpoints.methods.futureOrder;
                baseUrl = this.endpoints.spot.future;
                // تحتاج العقود الآجلة إلى نقطة نهائية مختلفة للطلبات المفتوحة
                // هذا تبسيط - في الواقع تحتاج إلى التكيف مع واجهة برمجة التطبيقات Futures
                return [];
            } else {
                endpoint = this.endpoints.methods.openOrders;
                baseUrl = this.endpoints.spot.base;
            }

            const queryString = Object.keys(params)
                .map(key => `${key}=${params[key]}`)
                .join('&');
            const signature = this.createSignature(queryString, this.credentials.secret);

            const response = await this.axiosInstance.get(
                `${baseUrl}${endpoint.path}`,
                {
                    headers: { 'X-MBX-APIKEY': this.credentials.apiKey },
                    params: { ...params, signature }
                }
            );

            return Array.isArray(response.data) 
                ? response.data.map(order => this.formatOrderResponse(order, accountType))
                : [this.formatOrderResponse(response.data, accountType)];
        }, 'getOpenOrders');
    }

    async getMarkets() {
        // إرجاع الأسواق المحملة مسبقاً
        return Object.fromEntries(this.supportedMarkets);
    }

    async getTicker(symbol) {
        return await this.executeWithRetry(async () => {
            const response = await this.axiosInstance.get(
                `${this.endpoints.spot.base}${this.endpoints.methods.ticker24hr.path}`,
                {
                    params: { symbol: this.formatSymbol(symbol) }
                }
            );

            return {
                symbol: response.data.symbol,
                price: parseFloat(response.data.lastPrice),
                change: parseFloat(response.data.priceChange),
                changePercent: parseFloat(response.data.priceChangePercent),
                high: parseFloat(response.data.highPrice),
                low: parseFloat(response.data.lowPrice),
                volume: parseFloat(response.data.volume),
                quoteVolume: parseFloat(response.data.quoteVolume),
                open: parseFloat(response.data.openPrice),
                previousClose: parseFloat(response.data.prevClosePrice),
                timestamp: new Date(response.data.closeTime)
            };
        }, 'getTicker');
    }

    async getOrderBook(symbol, limit = 100) {
        return await this.executeWithRetry(async () => {
            const response = await this.axiosInstance.get(
                `${this.endpoints.spot.base}${this.endpoints.methods.depth.path}`,
                {
                    params: {
                        symbol: this.formatSymbol(symbol),
                        limit
                    }
                }
            );

            return {
                symbol: symbol,
                bids: response.data.bids.map(bid => [
                    parseFloat(bid[0]), // price
                    parseFloat(bid[1])  // quantity
                ]),
                asks: response.data.asks.map(ask => [
                    parseFloat(ask[0]), // price
                    parseFloat(ask[1])  // quantity
                ]),
                lastUpdateId: response.data.lastUpdateId,
                timestamp: new Date()
            };
        }, 'getOrderBook');
    }

    async getTrades(symbol, since = null, limit = 100) {
        return await this.executeWithRetry(async () => {
            const params = {
                symbol: this.formatSymbol(symbol),
                limit
            };

            if (since) {
                params.fromId = since;
            }

            const response = await this.axiosInstance.get(
                `${this.endpoints.spot.base}${this.endpoints.methods.trades.path}`,
                { params }
            );

            return response.data.map(trade => ({
                id: trade.id,
                symbol: symbol,
                price: parseFloat(trade.price),
                quantity: parseFloat(trade.qty),
                quoteQuantity: parseFloat(trade.quoteQty),
                time: new Date(trade.time),
                isBuyerMaker: trade.isBuyerMaker,
                isBestMatch: trade.isBestMatch
            }));
        }, 'getTrades');
    }

    // === دوال العقود الآجلة ===
    async getFuturePositions(symbol = null) {
        if (!this.futuresEnabled) {
            throw new Error('العقود الآجلة غير مفعلة لهذا الحساب');
        }

        return await this.executeWithRetry(async () => {
            const timestamp = Date.now();
            const params = { timestamp, recvWindow: 60000 };
            
            if (symbol) {
                params.symbol = this.formatSymbol(symbol);
            }

            const queryString = Object.keys(params)
                .map(key => `${key}=${params[key]}`)
                .join('&');
            const signature = this.createSignature(queryString, this.credentials.secret);

            const response = await this.axiosInstance.get(
                `${this.endpoints.spot.future}${this.endpoints.methods.futurePosition.path}`,
                {
                    headers: { 'X-MBX-APIKEY': this.credentials.apiKey },
                    params: { ...params, signature }
                }
            );

            return response.data.map(position => ({
                symbol: position.symbol,
                positionSide: position.positionSide,
                positionAmount: parseFloat(position.positionAmt),
                entryPrice: parseFloat(position.entryPrice),
                markPrice: parseFloat(position.markPrice),
                unrealizedProfit: parseFloat(position.unrealizedProfit),
                liquidationPrice: parseFloat(position.liquidationPrice),
                leverage: parseInt(position.leverage),
                marginType: position.marginType,
                isolatedMargin: parseFloat(position.isolatedMargin),
                isAutoAddMargin: position.isAutoAddMargin === 'true'
            }));
        }, 'getFuturePositions');
    }

    // === دوال المساعدة ===
    formatOrderResponse(order, accountType = 'spot') {
        const baseOrder = {
            orderId: order.orderId.toString(),
            clientOrderId: order.clientOrderId,
            symbol: this.parseSymbol(order.symbol),
            side: order.side.toLowerCase(),
            type: order.type.toLowerCase(),
            quantity: parseFloat(order.origQty),
            executed: parseFloat(order.executedQty),
            price: parseFloat(order.price || 0),
            status: this.mapOrderStatus(order.status),
            timestamp: new Date(order.time || order.updateTime || Date.now()),
            accountType
        };

        // إضافة حقول إضافية بناءً على نوع الحساب
        if (accountType === 'future') {
            baseOrder.positionSide = order.positionSide;
            baseOrder.reduceOnly = order.reduceOnly || false;
            baseOrder.avgPrice = parseFloat(order.avgPrice || 0);
        } else if (accountType === 'margin') {
            baseOrder.isIsolated = order.isIsolated || false;
        }

        return baseOrder;
    }

    mapOrderStatus(status) {
        const statusMap = {
            'NEW': 'open',
            'PARTIALLY_FILLED': 'partial',
            'FILLED': 'filled',
            'CANCELED': 'cancelled',
            'REJECTED': 'rejected',
            'EXPIRED': 'expired',
            'PENDING_CANCEL': 'cancelling'
        };
        return statusMap[status] || status.toLowerCase();
    }

    formatSymbol(symbol) {
        return symbol.replace('/', '').toUpperCase();
    }

    parseSymbol(symbol) {
        const match = symbol.match(/([A-Za-z]+)(USDT|BUSD|USDC|BTC|ETH|BNB|EUR|GBP|JPY)$/);
        if (match) {
            return `${match[1]}/${match[2]}`;
        }
        return symbol;
    }

    createSignature(data, secret) {
        return crypto
            .createHmac('sha256', secret)
            .update(data)
            .digest('hex');
    }

    // === التحقق من الصحة ===
    validateOrderData(orderData) {
        const required = ['symbol', 'side', 'type', 'quantity'];
        const missing = required.filter(field => !orderData[field]);
        
        if (missing.length > 0) {
            throw new Error(`بيانات الطلب ناقصة: ${missing.join(', ')}`);
        }

        if (orderData.type === 'limit' && !orderData.price) {
            throw new Error('سعر الطلب مطلوب لأوامر الحد');
        }

        if (orderData.quantity <= 0) {
            throw new Error('الكمية يجب أن تكون أكبر من الصفر');
        }

        if (orderData.price && orderData.price <= 0) {
            throw new Error('السعر يجب أن يكون أكبر من الصفر');
        }

        // التحقق من الرموز المدعومة
        const formattedSymbol = this.formatSymbol(orderData.symbol);
        if (!this.supportedMarkets.has(formattedSymbol)) {
            throw new Error(`الرمز ${orderData.symbol} غير مدعوم أو غير نشط`);
        }

        return true;
    }

    // === الإحصائيات ===
    getExchangeStats() {
        const baseStats = super.getStats();
        return {
            ...baseStats,
            supportedMarkets: this.supportedMarkets.size,
            futuresEnabled: this.futuresEnabled,
            marginEnabled: this.marginEnabled,
            features: this.options.supportedFeatures
        };
    }
}

module.exports = BinanceService;