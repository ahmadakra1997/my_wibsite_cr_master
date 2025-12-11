// backend/clients/exchanges/exchanges/BybitService.js - النسخة المتقدمة والمحسنة
const BaseExchangeService = require('../BaseExchangeService');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class BybitService extends BaseExchangeService {
    constructor(credentials, options = {}) {
        super(credentials, {
            baseUrl: 'https://api.bybit.com',
            apiVersion: 'v5',
            rateLimit: 15,
            precision: 8,
            supportedFeatures: ['spot', 'linear', 'inverse', 'options', 'copy_trading', 'earn'],
            ...options
        });
        
        this.name = 'Bybit';
        this.requiresSignatures = true;
        this.requiresPassphrase = false;
        this.supportedMarkets = new Map();
        this.accountTypes = new Set(['UNIFIED', 'CONTRACT', 'SPOT']);
        this.currentCategory = 'spot'; // spot, linear, inverse, option
        
        this.initializeEndpoints();
        this.initializeMarketInfo();
    }

    // === تهيئة النقاط النهائية وإعدادات المنصة ===
    initializeEndpoints() {
        this.endpoints = {
            base: 'https://api.bybit.com',
            methods: {
                // النقاط النهائية العامة
                time: { method: 'GET', path: '/v5/market/time', auth: false },
                instruments: { method: 'GET', path: '/v5/market/instruments-info', auth: false },
                tickers: { method: 'GET', path: '/v5/market/tickers', auth: false },
                orderbook: { method: 'GET', path: '/v5/market/orderbook', auth: false },
                kline: { method: 'GET', path: '/v5/market/kline', auth: false },
                funding: { method: 'GET', path: '/v5/market/funding/history', auth: false },
                
                // النقاط النهائية الخاصة
                wallet: { method: 'GET', path: '/v5/account/wallet-balance', auth: true },
                position: { method: 'GET', path: '/v5/position/list', auth: true },
                order: { method: 'POST', path: '/v5/order/create', auth: true },
                orderCancel: { method: 'POST', path: '/v5/order/cancel', auth: true },
                orderHistory: { method: 'GET', path: '/v5/order/history', auth: true },
                openOrders: { method: 'GET', path: '/v5/order/realtime', auth: true },
                tradeHistory: { method: 'GET', path: '/v5/execution/list', auth: true },
                setLeverage: { method: 'POST', path: '/v5/position/set-leverage', auth: true },
                riskLimit: { method: 'GET', path: '/v5/position/risk-limit', auth: true }
            }
        };
    }

    initializeMarketInfo() {
        this.categoryConfigs = {
            'spot': {
                name: 'التداول الفوري',
                baseCurrencies: ['USDT', 'BTC', 'ETH', 'USDC'],
                supportedIntervals: ['1', '3', '5', '15', '30', '60', '120', '240', '360', '720', 'D', 'W', 'M'],
                orderTypes: ['Market', 'Limit'],
                timeInForce: ['GTC', 'IOC', 'FOK']
            },
            'linear': {
                name: 'العقود الآجلة الخطية',
                baseCurrencies: ['USDT'],
                supportedIntervals: ['1', '3', '5', '15', '30', '60', '120', '240', '360', '720', 'D', 'W', 'M'],
                orderTypes: ['Market', 'Limit'],
                timeInForce: ['GTC', 'IOC', 'FOK', 'PostOnly']
            },
            'inverse': {
                name: 'العقود الآجلة العكسية',
                baseCurrencies: ['USD'],
                supportedIntervals: ['1', '3', '5', '15', '30', '60', '120', '240', '360', '720', 'D', 'W', 'M'],
                orderTypes: ['Market', 'Limit'],
                timeInForce: ['GTC', 'IOC', 'FOK', 'PostOnly']
            },
            'option': {
                name: 'الخيارات',
                baseCurrencies: ['BTC', 'ETH'],
                supportedIntervals: ['1', '3', '5', '15', '30', '60', '120', '240', '360', '720', 'D'],
                orderTypes: ['Market', 'Limit'],
                timeInForce: ['GTC', 'IOC', 'FOK']
            }
        };
    }

    // === إدارة الاتصال ===
    async connect() {
        try {
            const startTime = Date.now();
            
            // اختبار الاتصال بالنقاط المختلفة
            await Promise.all([
                this.testConnection(),
                this.loadAccountInfo(),
                this.loadMarketInfo()
            ]);

            this.connected = true;
            this.lastPing = new Date();
            
            const connectionTime = Date.now() - startTime;
            
            this.emit('exchange_connected', {
                exchange: this.name,
                timestamp: this.lastPing,
                connectionTime,
                categories: Object.keys(this.categoryConfigs),
                accountTypes: Array.from(this.accountTypes)
            });

            console.log(`✅ تم الاتصال بمنصة ${this.name} بنجاح (${connectionTime}ms)`);
            return true;

        } catch (error) {
            this.handleError('CONNECTION_FAILED', error);
            throw new Error(`فشل الاتصال بمنصة ${this.name}: ${error.message}`);
        }
    }

    async testConnection() {
        return await this.executeWithRetry(async () => {
            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${this.endpoints.methods.time.path}`
            );
            
            if (response.data.retCode !== 0) {
                throw new Error(response.data.retMsg || 'فشل اختبار الاتصال');
            }
            
            return response.data;
        }, 'testConnection');
    }

    async loadAccountInfo() {
        try {
            // جلب معلومات الحساب لتحديد الأنواع المدعومة
            const balance = await this.getBalance();
            this.emit('account_info_loaded', {
                exchange: this.name,
                accountTypes: Array.from(this.accountTypes),
                timestamp: new Date()
            });
            
            return balance;
        } catch (error) {
            this.handleError('ACCOUNT_INFO_LOAD_FAILED', error);
        }
    }

    async loadMarketInfo() {
        try {
            const categories = ['spot', 'linear', 'inverse', 'option'];
            
            for (const category of categories) {
                try {
                    const response = await this.axiosInstance.get(
                        `${this.endpoints.base}${this.endpoints.methods.instruments.path}`,
                        { params: { category } }
                    );

                    if (response.data.retCode === 0 && response.data.result.list) {
                        response.data.result.list.forEach(symbol => {
                            const marketKey = `${category}:${symbol.symbol}`;
                            
                            this.supportedMarkets.set(marketKey, {
                                symbol: symbol.symbol,
                                category: category,
                                base: symbol.baseCoin,
                                quote: symbol.quoteCoin,
                                status: symbol.status,
                                launchTime: symbol.launchTime ? new Date(symbol.launchTime) : null,
                                deliveryTime: symbol.deliveryTime ? new Date(symbol.deliveryTime) : null,
                                precision: {
                                    price: symbol.priceScale || 8,
                                    quantity: symbol.lotSizeFilter?.basePrecision || 8
                                },
                                filters: {
                                    minOrderQty: parseFloat(symbol.lotSizeFilter?.minOrderQty || 0),
                                    maxOrderQty: parseFloat(symbol.lotSizeFilter?.maxOrderQty || 0),
                                    minOrderAmt: parseFloat(symbol.lotSizeFilter?.minOrderAmt || 0),
                                    maxOrderAmt: parseFloat(symbol.lotSizeFilter?.maxOrderAmt || 0),
                                    minPrice: parseFloat(symbol.priceFilter?.minPrice || 0),
                                    maxPrice: parseFloat(symbol.priceFilter?.maxPrice || 0),
                                    tickSize: parseFloat(symbol.priceFilter?.tickSize || 0)
                                },
                                leverage: symbol.leverageFilter ? {
                                    minLeverage: parseFloat(symbol.leverageFilter.minLeverage),
                                    maxLeverage: parseFloat(symbol.leverageFilter.maxLeverage),
                                    leverageStep: parseFloat(symbol.leverageFilter.leverageStep)
                                } : null
                            });
                        });
                    }
                } catch (error) {
                    console.warn(`⚠️ فشل تحميل معلومات السوق للفئة ${category}:`, error.message);
                }
            }

            this.emit('markets_loaded', {
                exchange: this.name,
                count: this.supportedMarkets.size,
                categories: categories.filter(cat => 
                    Array.from(this.supportedMarkets.keys()).some(key => key.startsWith(cat))
                ),
                timestamp: new Date()
            });

        } catch (error) {
            this.handleError('MARKET_INFO_LOAD_FAILED', error);
        }
    }

    // === إدارة الرصيد ===
    async getBalance(accountType = 'UNIFIED', coin = null) {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            
            const params = { 
                accountType: accountType,
                timestamp: timestamp
            };

            if (coin) {
                params.coin = coin;
            }

            const signature = this.createBybitSignature(timestamp, 'GET', 
                this.endpoints.methods.wallet.path, params, recvWindow);

            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${this.endpoints.methods.wallet.path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature, recvWindow),
                    params
                }
            );

            if (response.data.retCode !== 0) {
                throw new Error(response.data.retMsg || 'فشل جلب الرصيد');
            }

            const balances = this.formatBalanceResponse(response.data.result, accountType);
            
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

        if (data.list && data.list.length > 0) {
            data.list.forEach(account => {
                if (account.coin) {
                    account.coin.forEach(coin => {
                        const total = parseFloat(coin.walletBalance || 0);
                        const available = parseFloat(coin.availableToWithdraw || 0);
                        const locked = total - available;
                        
                        if (total > 0 || locked > 0) {
                            balances[coin.coin] = { 
                                free: available,
                                locked: locked,
                                total: total,
                                availableToWithdraw: available,
                                bonus: parseFloat(coin.bonus || 0),
                                accruedInterest: parseFloat(coin.accruedInterest || 0),
                                totalOrderIM: parseFloat(coin.totalOrderIM || 0),
                                totalPositionIM: parseFloat(coin.totalPositionIM || 0),
                                accountType: accountType
                            };
                            this.updateBalance(coin.coin, total);
                        }
                    });
                }
            });
        }

        return balances;
    }

    // === إدارة الطلبات ===
    async createOrder(orderData) {
        this.validateOrderData(orderData);

        return await this.executeWithRetry(async () => {
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            const orderId = orderData.orderId || `x-${uuidv4().split('-')[0]}`;
            
            const params = {
                category: orderData.category || 'spot',
                symbol: this.formatSymbol(orderData.symbol, orderData.category),
                side: orderData.side.charAt(0).toUpperCase() + orderData.side.slice(1).toLowerCase(),
                orderType: orderData.type.charAt(0).toUpperCase() + orderData.type.slice(1).toLowerCase(),
                qty: orderData.quantity.toString(),
                orderLinkId: orderId,
                timestamp: timestamp
            };

            // إضافة معاملات إضافية بناءً على نوع الطلب والفئة
            if (orderData.type === 'limit') {
                params.price = orderData.price.toString();
            }

            if (orderData.timeInForce) {
                params.timeInForce = orderData.timeInForce;
            } else {
                params.timeInForce = 'GTC';
            }

            // معاملات إضافية للعقود الآجلة
            if (orderData.category === 'linear' || orderData.category === 'inverse') {
                if (orderData.reduceOnly !== undefined) {
                    params.reduceOnly = orderData.reduceOnly;
                }
                if (orderData.closeOnTrigger !== undefined) {
                    params.closeOnTrigger = orderData.closeOnTrigger;
                }
                if (orderData.leverage) {
                    params.leverage = orderData.leverage.toString();
                }
            }

            // معاملات إضافية للخيارات
            if (orderData.category === 'option') {
                if (orderData.orderFilter) {
                    params.orderFilter = orderData.orderFilter;
                }
            }

            if (orderData.stopLoss) {
                params.stopLoss = orderData.stopLoss.toString();
            }

            if (orderData.takeProfit) {
                params.takeProfit = orderData.takeProfit.toString();
            }

            if (orderData.triggerPrice) {
                params.triggerPrice = orderData.triggerPrice.toString();
            }

            const signature = this.createBybitSignature(timestamp, 'POST', 
                this.endpoints.methods.order.path, params, recvWindow);

            const response = await this.axiosInstance.post(
                `${this.endpoints.base}${this.endpoints.methods.order.path}`,
                params,
                {
                    headers: this.getAuthHeaders(timestamp, signature, recvWindow),
                }
            );

            if (response.data.retCode !== 0) {
                throw new Error(response.data.retMsg || 'فشل إنشاء الطلب');
            }

            const orderResult = this.formatOrderResponse(response.data.result, orderData.category || 'spot');
            this.updateOrder(orderResult);

            this.emit('order_created', {
                exchange: this.name,
                orderId: orderResult.orderId,
                clientOrderId: orderResult.clientOrderId,
                symbol: orderData.symbol,
                side: orderData.side,
                type: orderData.type,
                category: orderData.category || 'spot',
                quantity: orderData.quantity,
                price: orderData.price,
                timestamp: new Date()
            });

            return orderResult;
        }, 'createOrder');
    }

    async cancelOrder(orderData) {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            
            const params = {
                category: orderData.category || 'spot',
                symbol: this.formatSymbol(orderData.symbol, orderData.category),
                timestamp: timestamp
            };

            // إما orderId أو orderLinkId
            if (orderData.orderId) {
                params.orderId = orderData.orderId;
            } else if (orderData.clientOrderId) {
                params.orderLinkId = orderData.clientOrderId;
            } else {
                throw new Error('يجب توفير إما orderId أو clientOrderId');
            }

            const signature = this.createBybitSignature(timestamp, 'POST', 
                this.endpoints.methods.orderCancel.path, params, recvWindow);

            const response = await this.axiosInstance.post(
                `${this.endpoints.base}${this.endpoints.methods.orderCancel.path}`,
                params,
                {
                    headers: this.getAuthHeaders(timestamp, signature, recvWindow),
                }
            );

            if (response.data.retCode !== 0) {
                throw new Error(response.data.retMsg || 'فشل إلغاء الطلب');
            }

            const cancelledOrder = this.formatOrderResponse(response.data.result, orderData.category || 'spot');

            this.emit('order_cancelled', {
                exchange: this.name,
                orderId: orderData.orderId,
                clientOrderId: orderData.clientOrderId,
                symbol: orderData.symbol,
                category: orderData.category || 'spot',
                timestamp: new Date()
            });

            return cancelledOrder;
        }, 'cancelOrder');
    }

    async getOrder(orderData) {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            
            const params = {
                category: orderData.category || 'spot',
                symbol: this.formatSymbol(orderData.symbol, orderData.category),
                timestamp: timestamp
            };

            if (orderData.orderId) {
                params.orderId = orderData.orderId;
            } else if (orderData.clientOrderId) {
                params.orderLinkId = orderData.clientOrderId;
            } else {
                throw new Error('يجب توفير إما orderId أو clientOrderId');
            }

            const signature = this.createBybitSignature(timestamp, 'GET', 
                this.endpoints.methods.orderHistory.path, params, recvWindow);

            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${this.endpoints.methods.orderHistory.path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature, recvWindow),
                    params
                }
            );

            if (response.data.retCode !== 0) {
                throw new Error(response.data.retMsg || 'فشل جلب الطلب');
            }

            const order = response.data.result.list.find(o => 
                o.orderId === orderData.orderId || o.orderLinkId === orderData.clientOrderId
            );
            
            return order ? this.formatOrderResponse(order, orderData.category || 'spot') : null;
        }, 'getOrder');
    }

    async getOpenOrders(category = 'spot', symbol = null) {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            
            const params = {
                category: category,
                timestamp: timestamp
            };

            if (symbol) {
                params.symbol = this.formatSymbol(symbol, category);
            }

            const signature = this.createBybitSignature(timestamp, 'GET', 
                this.endpoints.methods.openOrders.path, params, recvWindow);

            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${this.endpoints.methods.openOrders.path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature, recvWindow),
                    params
                }
            );

            if (response.data.retCode !== 0) {
                throw new Error(response.data.retMsg || 'فشل جلب الطلبات المفتوحة');
            }

            return response.data.result.list.map(order => 
                this.formatOrderResponse(order, category)
            );
        }, 'getOpenOrders');
    }

    // === إدارة المراكز (للعقود الآجلة) ===
    async getPositions(category = 'linear', symbol = null) {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            
            const params = {
                category: category,
                timestamp: timestamp
            };

            if (symbol) {
                params.symbol = this.formatSymbol(symbol, category);
            }

            const signature = this.createBybitSignature(timestamp, 'GET', 
                this.endpoints.methods.position.path, params, recvWindow);

            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${this.endpoints.methods.position.path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature, recvWindow),
                    params
                }
            );

            if (response.data.retCode !== 0) {
                throw new Error(response.data.retMsg || 'فشل جلب المراكز');
            }

            return response.data.result.list.map(position => ({
                symbol: position.symbol,
                category: category,
                side: position.side,
                size: parseFloat(position.size),
                entryPrice: parseFloat(position.avgPrice),
                markPrice: parseFloat(position.markPrice),
                liqPrice: parseFloat(position.liqPrice),
                bustPrice: parseFloat(position.bustPrice),
                leverage: parseFloat(position.leverage),
                autoAddMargin: position.autoAddMargin === 1,
                positionMargin: parseFloat(position.positionMargin),
                occClosingFee: parseFloat(position.occClosingFee),
                realisedPnl: parseFloat(position.realisedPnl),
                cumRealisedPnl: parseFloat(position.cumRealisedPnl),
                positionValue: parseFloat(position.positionValue),
                takeProfit: parseFloat(position.takeProfit),
                stopLoss: parseFloat(position.stopLoss),
                trailingStop: parseFloat(position.trailingStop),
                positionStatus: position.positionStatus,
                createdTime: new Date(parseInt(position.createdTime)),
                updatedTime: new Date(parseInt(position.updatedTime))
            }));
        }, 'getPositions');
    }

    async setLeverage(category, symbol, leverage, buyLeverage = null, sellLeverage = null) {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            
            const params = {
                category: category,
                symbol: this.formatSymbol(symbol, category),
                buyLeverage: (buyLeverage || leverage).toString(),
                sellLeverage: (sellLeverage || leverage).toString(),
                timestamp: timestamp
            };

            const signature = this.createBybitSignature(timestamp, 'POST', 
                this.endpoints.methods.setLeverage.path, params, recvWindow);

            const response = await this.axiosInstance.post(
                `${this.endpoints.base}${this.endpoints.methods.setLeverage.path}`,
                params,
                {
                    headers: this.getAuthHeaders(timestamp, signature, recvWindow),
                }
            );

            if (response.data.retCode !== 0) {
                throw new Error(response.data.retMsg || 'فشل تعيين الرافعة المالية');
            }

            this.emit('leverage_updated', {
                exchange: this.name,
                symbol,
                category,
                leverage,
                buyLeverage,
                sellLeverage,
                timestamp: new Date()
            });

            return response.data.result;
        }, 'setLeverage');
    }

    // === بيانات السوق ===
    async getMarkets(category = null) {
        if (category) {
            const markets = {};
            for (const [key, market] of this.supportedMarkets) {
                if (key.startsWith(category)) {
                    markets[market.symbol] = market;
                }
            }
            return markets;
        }
        
        return Object.fromEntries(this.supportedMarkets);
    }

    async getTicker(symbol, category = 'spot') {
        return await this.executeWithRetry(async () => {
            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${this.endpoints.methods.tickers.path}`,
                {
                    params: { 
                        category: category,
                        symbol: this.formatSymbol(symbol, category)
                    }
                }
            );

            if (response.data.retCode !== 0) {
                throw new Error(response.data.retMsg || 'فشل جلب بيانات التداول');
            }

            const data = response.data.result.list[0];
            return {
                symbol: symbol,
                category: category,
                lastPrice: parseFloat(data.lastPrice),
                indexPrice: parseFloat(data.indexPrice),
                markPrice: parseFloat(data.markPrice),
                prevPrice24h: parseFloat(data.prevPrice24h),
                price24hPcnt: parseFloat(data.price24hPcnt),
                highPrice24h: parseFloat(data.highPrice24h),
                lowPrice24h: parseFloat(data.lowPrice24h),
                prevPrice1h: parseFloat(data.prevPrice1h),
                openPrice: parseFloat(data.openPrice),
                openInterest: parseFloat(data.openInterest),
                turnover24h: parseFloat(data.turnover24h),
                volume24h: parseFloat(data.volume24h),
                fundingRate: parseFloat(data.fundingRate),
                nextFundingTime: data.nextFundingTime ? new Date(parseInt(data.nextFundingTime)) : null,
                predictedDeliveryPrice: parseFloat(data.predictedDeliveryPrice || 0),
                basisRate: parseFloat(data.basisRate || 0),
                deliveryFeeRate: parseFloat(data.deliveryFeeRate || 0),
                deliveryTime: data.deliveryTime ? new Date(parseInt(data.deliveryTime)) : null,
                timestamp: new Date(parseInt(data.time))
            };
        }, 'getTicker');
    }

    async getOrderBook(symbol, category = 'spot', limit = 200) {
        return await this.executeWithRetry(async () => {
            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${this.endpoints.methods.orderbook.path}`,
                {
                    params: { 
                        category: category,
                        symbol: this.formatSymbol(symbol, category),
                        limit: limit
                    }
                }
            );

            if (response.data.retCode !== 0) {
                throw new Error(response.data.retMsg || 'فشل جلب سجل الطلبات');
            }

            const data = response.data.result;
            return {
                symbol: symbol,
                category: category,
                bids: data.b.map(bid => [parseFloat(bid[0]), parseFloat(bid[1])]),
                asks: data.a.map(ask => [parseFloat(ask[0]), parseFloat(ask[1])]),
                timestamp: new Date(parseInt(data.ts)),
                updateId: data.u
            };
        }, 'getOrderBook');
    }

    async getKline(symbol, category = 'spot', interval = '15', limit = 200) {
        return await this.executeWithRetry(async () => {
            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${this.endpoints.methods.kline.path}`,
                {
                    params: { 
                        category: category,
                        symbol: this.formatSymbol(symbol, category),
                        interval: interval,
                        limit: limit
                    }
                }
            );

            if (response.data.retCode !== 0) {
                throw new Error(response.data.retMsg || 'فشل جلب بيانات الشموع');
            }

            return response.data.result.list.map(kline => ({
                timestamp: new Date(parseInt(kline[0])),
                open: parseFloat(kline[1]),
                high: parseFloat(kline[2]),
                low: parseFloat(kline[3]),
                close: parseFloat(kline[4]),
                volume: parseFloat(kline[5]),
                turnover: parseFloat(kline[6])
            }));
        }, 'getKline');
    }

    // === دوال المساعدة ===
    createBybitSignature(timestamp, method, path, params, recvWindow) {
        const paramString = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');
        
        const payload = timestamp + this.credentials.apiKey + recvWindow + paramString;
        
        return crypto
            .createHmac('sha256', this.credentials.secret)
            .update(payload)
            .digest('hex');
    }

    getAuthHeaders(timestamp, signature, recvWindow) {
        return {
            'X-BAPI-API-KEY': this.credentials.apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
    }

    formatOrderResponse(order, category) {
        const baseOrder = {
            orderId: order.orderId,
            clientOrderId: order.orderLinkId,
            symbol: order.symbol,
            category: category,
            side: order.side.toLowerCase(),
            type: order.orderType.toLowerCase(),
            quantity: parseFloat(order.qty),
            executed: parseFloat(order.cumExecQty),
            price: parseFloat(order.price || 0),
            avgPrice: parseFloat(order.avgPrice || 0),
            status: this.mapOrderStatus(order.orderStatus),
            timeInForce: order.timeInForce,
            createdTime: new Date(parseInt(order.createdTime)),
            updatedTime: new Date(parseInt(order.updatedTime)),
            leverage: parseFloat(order.leverage || 1),
            reduceOnly: order.reduceOnly || false,
            takeProfit: parseFloat(order.takeProfit || 0),
            stopLoss: parseFloat(order.stopLoss || 0),
            triggerPrice: parseFloat(order.triggerPrice || 0),
            tpTriggerBy: order.tpTriggerBy,
            slTriggerBy: order.slTriggerBy
        };

        return baseOrder;
    }

    mapOrderStatus(status) {
        const statusMap = {
            'Created': 'open',
            'New': 'open',
            'Rejected': 'rejected',
            'PartiallyFilled': 'partial',
            'Filled': 'filled',
            'Cancelled': 'cancelled',
            'PendingCancel': 'cancelling'
        };
        return statusMap[status] || status.toLowerCase();
    }

    formatSymbol(symbol, category) {
        return symbol.replace('/', '').toUpperCase();
    }

    parseSymbol(symbol) {
        // تحويل الرموز مثل BTCUSDT إلى BTC/USDT
        const match = symbol.match(/([A-Za-z]+)(USDT|USDC|BUSD|BTC|ETH|USD)$/);
        if (match) {
            return `${match[1]}/${match[2]}`;
        }
        return symbol;
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
        const formattedSymbol = this.formatSymbol(orderData.symbol, orderData.category);
        const marketKey = `${orderData.category || 'spot'}:${formattedSymbol}`;
        
        if (!this.supportedMarkets.has(marketKey)) {
            throw new Error(`الرمز ${orderData.symbol} غير مدعوم أو غير نشط في فئة ${orderData.category || 'spot'}`);
        }

        return true;
    }

    // === الإحصائيات ===
    getExchangeStats() {
        const baseStats = super.getStats();
        return {
            ...baseStats,
            supportedMarkets: this.supportedMarkets.size,
            categories: Object.keys(this.categoryConfigs),
            accountTypes: Array.from(this.accountTypes),
            features: this.options.supportedFeatures
        };
    }

    // === إدارة المخاطر ===
    async getRiskLimit(category = 'linear', symbol = null) {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            
            const params = {
                category: category,
                timestamp: timestamp
            };

            if (symbol) {
                params.symbol = this.formatSymbol(symbol, category);
            }

            const signature = this.createBybitSignature(timestamp, 'GET', 
                this.endpoints.methods.riskLimit.path, params, recvWindow);

            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${this.endpoints.methods.riskLimit.path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature, recvWindow),
                    params
                }
            );

            if (response.data.retCode !== 0) {
                throw new Error(response.data.retMsg || 'فشل جلب حدود المخاطر');
            }

            return response.data.result.list.map(risk => ({
                id: risk.id,
                symbol: risk.symbol,
                category: category,
                riskLimitValue: parseFloat(risk.riskLimitValue),
                maintenanceMargin: parseFloat(risk.maintenanceMargin),
                initialMargin: parseFloat(risk.initialMargin),
                isLowestRisk: risk.isLowestRisk === 1,
                maxLeverage: parseFloat(risk.maxLeverage)
            }));
        }, 'getRiskLimit');
    }
}

module.exports = BybitService;