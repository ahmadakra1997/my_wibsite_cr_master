// backend/clients/exchanges/exchanges/MEXCService.js - النسخة المتقدمة والمحسنة
const BaseExchangeService = require('../BaseExchangeService');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class MEXCService extends BaseExchangeService {
    constructor(credentials, options = {}) {
        super(credentials, {
            baseUrl: 'https://api.mexc.com',
            apiVersion: 'v3',
            rateLimit: 20,
            precision: 8,
            supportedFeatures: ['spot', 'future', 'margin', 'staking', 'savings', 'earn'],
            ...options
        });
        
        this.name = 'MEXC Global';
        this.requiresSignatures = true;
        this.requiresPassphrase = false;
        this.supportedMarkets = new Map();
        this.accountTypes = new Set(['spot', 'margin', 'future']);
        this.currentAccountType = 'spot';
        
        this.initializeEndpoints();
        this.initializeMarketInfo();
    }

    // === تهيئة النقاط النهائية وإعدادات المنصة ===
    initializeEndpoints() {
        this.endpoints = {
            base: 'https://api.mexc.com',
            future: 'https://contract.mexc.com',
            methods: {
                // النقاط النهائية العامة
                ping: { method: 'GET', path: '/api/v3/ping', auth: false },
                time: { method: 'GET', path: '/api/v3/time', auth: false },
                exchangeInfo: { method: 'GET', path: '/api/v3/exchangeInfo', auth: false },
                ticker24hr: { method: 'GET', path: '/api/v3/ticker/24hr', auth: false },
                tickerPrice: { method: 'GET', path: '/api/v3/ticker/price', auth: false },
                depth: { method: 'GET', path: '/api/v3/depth', auth: false },
                trades: { method: 'GET', path: '/api/v3/trades', auth: false },
                klines: { method: 'GET', path: '/api/v3/klines', auth: false },
                
                // النقاط النهائية الخاصة - Spot
                account: { method: 'GET', path: '/api/v3/account', auth: true },
                order: { method: 'POST', path: '/api/v3/order', auth: true },
                orderCancel: { method: 'DELETE', path: '/api/v3/order', auth: true },
                orderDetail: { method: 'GET', path: '/api/v3/order', auth: true },
                openOrders: { method: 'GET', path: '/api/v3/openOrders', auth: true },
                allOrders: { method: 'GET', path: '/api/v3/allOrders', auth: true },
                myTrades: { method: 'GET', path: '/api/v3/myTrades', auth: true },
                
                // النقاط النهائية الخاصة - Futures
                futureAccount: { method: 'GET', path: '/api/v1/private/account/assets', auth: true },
                futurePositions: { method: 'GET', path: '/api/v1/private/position/list', auth: true },
                futureOrder: { method: 'POST', path: '/api/v1/private/order/submit', auth: true },
                futureOrderCancel: { method: 'POST', path: '/api/v1/private/order/cancel', auth: true },
                futureOrderDetail: { method: 'GET', path: '/api/v1/private/order/detail', auth: true },
                futureOpenOrders: { method: 'GET', path: '/api/v1/private/order/open', auth: true }
            }
        };
    }

    initializeMarketInfo() {
        this.marketConfigs = {
            'spot': {
                name: 'التداول الفوري',
                orderTypes: ['LIMIT', 'MARKET', 'STOP_LOSS', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT', 'TAKE_PROFIT_LIMIT'],
                timeInForce: ['GTC', 'IOC', 'FOK'],
                accountTypes: ['spot']
            },
            'future': {
                name: 'العقود الآجلة',
                orderTypes: ['LIMIT', 'MARKET', 'STOP', 'STOP_MARKET', 'TAKE_PROFIT', 'TAKE_PROFIT_MARKET'],
                timeInForce: ['GTC', 'IOC', 'FOK'],
                accountTypes: ['future'],
                positionSides: ['LONG', 'SHORT', 'BOTH']
            },
            'margin': {
                name: 'الهامش',
                orderTypes: ['LIMIT', 'MARKET'],
                timeInForce: ['GTC', 'IOC', 'FOK'],
                accountTypes: ['margin']
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
                accountTypes: Array.from(this.accountTypes),
                features: this.options.supportedFeatures
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
                `${this.endpoints.base}${this.endpoints.methods.ping.path}`
            );
            
            return response.data;
        }, 'testConnection');
    }

    async loadAccountInfo() {
        try {
            // اختبار الحسابات المتاحة
            const accountTests = [
                this.getBalance('spot').then(() => 'spot').catch(() => null),
                this.getFutureBalance().then(() => 'future').catch(() => null)
            ];

            const results = await Promise.allSettled(accountTests);
            const availableAccounts = results
                .filter(result => result.status === 'fulfilled' && result.value)
                .map(result => result.value);

            this.accountTypes = new Set(availableAccounts);
            
            this.emit('account_info_loaded', {
                exchange: this.name,
                accountTypes: Array.from(this.accountTypes),
                timestamp: new Date()
            });
            
        } catch (error) {
            this.handleError('ACCOUNT_INFO_LOAD_FAILED', error);
        }
    }

    async loadMarketInfo() {
        try {
            const marketTypes = ['spot', 'future'];
            
            for (const marketType of marketTypes) {
                try {
                    let response;
                    let symbols = [];

                    if (marketType === 'spot') {
                        response = await this.axiosInstance.get(
                            `${this.endpoints.base}${this.endpoints.methods.exchangeInfo.path}`
                        );
                        symbols = response.data.symbols || [];
                    } else if (marketType === 'future') {
                        response = await this.axiosInstance.get(
                            `${this.endpoints.future}/api/v1/contract/detail`
                        );
                        symbols = response.data.data || [];
                    }

                    symbols.forEach(symbol => {
                        const marketKey = `${marketType}:${symbol.symbol}`;
                        
                        this.supportedMarkets.set(marketKey, {
                            symbol: symbol.symbol,
                            type: marketType,
                            base: symbol.baseAsset || symbol.currency,
                            quote: symbol.quoteAsset || 'USDT',
                            status: symbol.status === 'TRADING' ? 'active' : 'inactive',
                            precision: {
                                price: symbol.pricePrecision || 8,
                                quantity: symbol.quantityPrecision || 8
                            },
                            filters: {
                                minNotional: parseFloat(symbol.minNotional) || 0,
                                minQuantity: parseFloat(symbol.minQuantity) || 0,
                                maxQuantity: parseFloat(symbol.maxQuantity) || 0,
                                stepSize: parseFloat(symbol.stepSize) || 0,
                                minPrice: parseFloat(symbol.minPrice) || 0,
                                maxPrice: parseFloat(symbol.maxPrice) || 0,
                                tickSize: parseFloat(symbol.tickSize) || 0
                            },
                            leverage: symbol.leverage ? {
                                min: parseFloat(symbol.leverage.min) || 1,
                                max: parseFloat(symbol.leverage.max) || 100
                            } : null,
                            fee: {
                                maker: parseFloat(symbol.makerCommission) || 0.002,
                                taker: parseFloat(symbol.takerCommission) || 0.002
                            }
                        });
                    });
                } catch (error) {
                    console.warn(`⚠️ فشل تحميل معلومات السوق للنوع ${marketType}:`, error.message);
                }
            }

            this.emit('markets_loaded', {
                exchange: this.name,
                count: this.supportedMarkets.size,
                types: marketTypes.filter(type => 
                    Array.from(this.supportedMarkets.keys()).some(key => key.startsWith(type))
                ),
                timestamp: new Date()
            });

        } catch (error) {
            this.handleError('MARKET_INFO_LOAD_FAILED', error);
        }
    }

    // === إدارة الرصيد ===
    async getBalance(accountType = 'spot') {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now();
            let path, method = 'GET', baseUrl = this.endpoints.base;

            if (accountType === 'future') {
                return await this.getFutureBalance();
            }

            path = this.endpoints.methods.account.path;
            const queryString = `timestamp=${timestamp}`;
            const signature = this.createMEXCSignature(queryString);

            const response = await this.axiosInstance.get(
                `${baseUrl}${path}`,
                {
                    headers: this.getAuthHeaders(),
                    params: {
                        timestamp,
                        signature
                    }
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

    async getFutureBalance() {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now().toString();
            const method = 'GET';
            const path = this.endpoints.methods.futureAccount.path;
            const baseUrl = this.endpoints.future;

            const params = {
                timestamp: timestamp
            };

            const signature = this.createMEXCFutureSignature(params, method, path);

            const response = await this.axiosInstance.get(
                `${baseUrl}${path}`,
                {
                    headers: this.getFutureAuthHeaders(timestamp, signature, method, path),
                    params
                }
            );

            if (response.data.code !== 200) {
                throw new Error(response.data.msg || 'فشل جلب رصيد العقود الآجلة');
            }

            return this.formatFutureBalanceResponse(response.data.data);
        }, 'getFutureBalance');
    }

    formatBalanceResponse(data, accountType) {
        const balances = {};

        if (data && data.balances) {
            data.balances.forEach(balance => {
                const free = parseFloat(balance.free);
                const locked = parseFloat(balance.locked);
                const total = free + locked;
                
                if (total > 0) {
                    balances[balance.asset] = { 
                        free,
                        locked,
                        total,
                        accountType
                    };
                    this.updateBalance(balance.asset, free);
                }
            });
        }

        return balances;
    }

    formatFutureBalanceResponse(data) {
        const balances = {};
        
        if (data && data.length > 0) {
            data.forEach(asset => {
                const available = parseFloat(asset.availableBalance);
                const frozen = parseFloat(asset.frozenBalance);
                const total = available + frozen;
                
                if (total > 0) {
                    balances[asset.currency] = {
                        free: available,
                        locked: frozen,
                        total: total,
                        margin: parseFloat(asset.marginBalance),
                        unrealizedPNL: parseFloat(asset.unrealizedPNL),
                        realizedPNL: parseFloat(asset.realizedPNL),
                        accountType: 'future'
                    };
                    this.updateBalance(asset.currency, available);
                }
            });
        }

        return balances;
    }

    // === إدارة الطلبات ===
    async createOrder(orderData) {
        this.validateOrderData(orderData);

        return await this.executeWithRetry(async () => {
            const timestamp = Date.now();
            let path, method = 'POST', baseUrl = this.endpoints.base, params;

            if (orderData.accountType === 'future') {
                baseUrl = this.endpoints.future;
                path = this.endpoints.methods.futureOrder.path;
                
                params = {
                    symbol: this.formatSymbol(orderData.symbol, 'future'),
                    positionId: orderData.positionId || 0,
                    price: orderData.price?.toString(),
                    vol: orderData.quantity.toString(),
                    lever: orderData.leverage?.toString() || '20',
                    side: orderData.side.toLowerCase() === 'buy' ? 1 : 2,
                    type: orderData.type === 'market' ? 1 : 2,
                    openType: orderData.isolated ? 1 : 2,
                    positionMode: orderData.positionMode || 1,
                    orderType: orderData.orderType || 1
                };

                if (orderData.stopPrice) {
                    params.triggerPrice = orderData.stopPrice.toString();
                    params.triggerType = 1;
                }

                const futureTimestamp = Date.now().toString();
                const signature = this.createMEXCFutureSignature(params, method, path, futureTimestamp);

                const response = await this.axiosInstance.post(
                    `${baseUrl}${path}`,
                    params,
                    {
                        headers: this.getFutureAuthHeaders(futureTimestamp, signature, method, path, 'application/json')
                    }
                );

                if (response.data.code !== 200) {
                    throw new Error(response.data.msg || 'فشل إنشاء الطلب');
                }

                const orderResult = this.formatFutureOrderResponse(response.data.data, orderData);
                this.updateOrder(orderResult);

                this.emit('order_created', {
                    exchange: this.name,
                    orderId: orderResult.orderId,
                    symbol: orderData.symbol,
                    side: orderData.side,
                    type: orderData.type,
                    accountType: 'future',
                    quantity: orderData.quantity,
                    price: orderData.price,
                    timestamp: new Date()
                });

                return orderResult;
            } else {
                // Spot Order
                path = this.endpoints.methods.order.path;
                params = {
                    symbol: this.formatSymbol(orderData.symbol, 'spot'),
                    side: orderData.side.toUpperCase(),
                    type: orderData.type.toUpperCase(),
                    quantity: orderData.quantity.toString(),
                    timestamp: timestamp
                };

                if (orderData.type === 'limit') {
                    params.price = orderData.price.toString();
                    params.timeInForce = orderData.timeInForce || 'GTC';
                }

                if (orderData.stopPrice) {
                    params.stopPrice = orderData.stopPrice.toString();
                }

                if (orderData.icebergQty) {
                    params.icebergQty = orderData.icebergQty.toString();
                }

                if (orderData.clientOrderId) {
                    params.newClientOrderId = orderData.clientOrderId;
                }

                const queryString = Object.keys(params)
                    .map(key => `${key}=${params[key]}`)
                    .join('&');
                const signature = this.createMEXCSignature(queryString);

                const response = await this.axiosInstance.post(
                    `${baseUrl}${path}`,
                    null,
                    {
                        headers: this.getAuthHeaders(),
                        params: {
                            ...params,
                            signature
                        }
                    }
                );

                const orderResult = this.formatOrderResponse(response.data, orderData);
                this.updateOrder(orderResult);

                this.emit('order_created', {
                    exchange: this.name,
                    orderId: orderResult.orderId,
                    symbol: orderData.symbol,
                    side: orderData.side,
                    type: orderData.type,
                    accountType: 'spot',
                    quantity: orderData.quantity,
                    price: orderData.price,
                    timestamp: new Date()
                });

                return orderResult;
            }
        }, 'createOrder');
    }

    async cancelOrder(orderData) {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now();
            let path, method, baseUrl = this.endpoints.base, params;

            if (orderData.accountType === 'future') {
                baseUrl = this.endpoints.future;
                path = this.endpoints.methods.futureOrderCancel.path;
                method = 'POST';
                
                params = {
                    orderId: orderData.orderId
                };

                const futureTimestamp = Date.now().toString();
                const signature = this.createMEXCFutureSignature(params, method, path, futureTimestamp);

                const response = await this.axiosInstance.post(
                    `${baseUrl}${path}`,
                    params,
                    {
                        headers: this.getFutureAuthHeaders(futureTimestamp, signature, method, path, 'application/json')
                    }
                );

                if (response.data.code !== 200) {
                    throw new Error(response.data.msg || 'فشل إلغاء الطلب');
                }

                this.emit('order_cancelled', {
                    exchange: this.name,
                    orderId: orderData.orderId,
                    symbol: orderData.symbol,
                    accountType: 'future',
                    timestamp: new Date()
                });

                return response.data.data;
            } else {
                path = this.endpoints.methods.orderCancel.path;
                method = 'DELETE';
                params = {
                    symbol: this.formatSymbol(orderData.symbol, 'spot'),
                    orderId: orderData.orderId,
                    timestamp: timestamp
                };

                const queryString = Object.keys(params)
                    .map(key => `${key}=${params[key]}`)
                    .join('&');
                const signature = this.createMEXCSignature(queryString);

                const response = await this.axiosInstance.delete(
                    `${baseUrl}${path}`,
                    {
                        headers: this.getAuthHeaders(),
                        params: {
                            ...params,
                            signature
                        }
                    }
                );

                const cancelledOrder = this.formatOrderResponse(response.data, orderData);

                this.emit('order_cancelled', {
                    exchange: this.name,
                    orderId: orderData.orderId,
                    symbol: orderData.symbol,
                    accountType: 'spot',
                    timestamp: new Date()
                });

                return cancelledOrder;
            }
        }, 'cancelOrder');
    }

    async getOrder(orderData) {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now();
            let path, method = 'GET', baseUrl = this.endpoints.base, params;

            if (orderData.accountType === 'future') {
                baseUrl = this.endpoints.future;
                path = this.endpoints.methods.futureOrderDetail.path;
                
                params = {
                    orderId: orderData.orderId
                };

                const futureTimestamp = Date.now().toString();
                const signature = this.createMEXCFutureSignature(params, method, path, futureTimestamp);

                const response = await this.axiosInstance.get(
                    `${baseUrl}${path}`,
                    {
                        headers: this.getFutureAuthHeaders(futureTimestamp, signature, method, path),
                        params
                    }
                );

                if (response.data.code !== 200) {
                    throw new Error(response.data.msg || 'فشل جلب الطلب');
                }

                return this.formatFutureOrderResponse(response.data.data, orderData);
            } else {
                path = this.endpoints.methods.orderDetail.path;
                params = {
                    symbol: this.formatSymbol(orderData.symbol, 'spot'),
                    orderId: orderData.orderId,
                    timestamp: timestamp
                };

                const queryString = Object.keys(params)
                    .map(key => `${key}=${params[key]}`)
                    .join('&');
                const signature = this.createMEXCSignature(queryString);

                const response = await this.axiosInstance.get(
                    `${baseUrl}${path}`,
                    {
                        headers: this.getAuthHeaders(),
                        params: {
                            ...params,
                            signature
                        }
                    }
                );

                return this.formatOrderResponse(response.data, orderData);
            }
        }, 'getOrder');
    }

    async getOpenOrders(accountType = 'spot', symbol = null) {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now();
            let path, method = 'GET', baseUrl = this.endpoints.base, params = { timestamp };

            if (accountType === 'future') {
                baseUrl = this.endpoints.future;
                path = this.endpoints.methods.futureOpenOrders.path;
                
                if (symbol) {
                    params.symbol = this.formatSymbol(symbol, 'future');
                }

                const futureTimestamp = Date.now().toString();
                const signature = this.createMEXCFutureSignature(params, method, path, futureTimestamp);

                const response = await this.axiosInstance.get(
                    `${baseUrl}${path}`,
                    {
                        headers: this.getFutureAuthHeaders(futureTimestamp, signature, method, path),
                        params
                    }
                );

                if (response.data.code !== 200) {
                    throw new Error(response.data.msg || 'فشل جلب الطلبات المفتوحة');
                }

                return Array.isArray(response.data.data) 
                    ? response.data.data.map(order => this.formatFutureOrderResponse(order, { accountType }))
                    : [this.formatFutureOrderResponse(response.data.data, { accountType })];
            } else {
                path = this.endpoints.methods.openOrders.path;
                
                if (symbol) {
                    params.symbol = this.formatSymbol(symbol, 'spot');
                }

                const queryString = Object.keys(params)
                    .map(key => `${key}=${params[key]}`)
                    .join('&');
                const signature = this.createMEXCSignature(queryString);

                const response = await this.axiosInstance.get(
                    `${baseUrl}${path}`,
                    {
                        headers: this.getAuthHeaders(),
                        params: {
                            ...params,
                            signature
                        }
                    }
                );

                return Array.isArray(response.data) 
                    ? response.data.map(order => this.formatOrderResponse(order, { accountType }))
                    : [this.formatOrderResponse(response.data, { accountType })];
            }
        }, 'getOpenOrders');
    }

    // === إدارة المراكز (للعقود الآجلة) ===
    async getPositions(symbol = null) {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now().toString();
            const method = 'GET';
            const path = this.endpoints.methods.futurePositions.path;
            const baseUrl = this.endpoints.future;

            const params = {};
            if (symbol) {
                params.symbol = this.formatSymbol(symbol, 'future');
            }

            const signature = this.createMEXCFutureSignature(params, method, path, timestamp);

            const response = await this.axiosInstance.get(
                `${baseUrl}${path}`,
                {
                    headers: this.getFutureAuthHeaders(timestamp, signature, method, path),
                    params
                }
            );

            if (response.data.code !== 200) {
                throw new Error(response.data.msg || 'فشل جلب المراكز');
            }

            return response.data.data.map(position => ({
                symbol: position.symbol,
                positionId: position.id,
                side: position.side === 1 ? 'LONG' : 'SHORT',
                size: parseFloat(position.vol),
                leverage: parseFloat(position.lever),
                entryPrice: parseFloat(position.openPrice),
                markPrice: parseFloat(position.markPrice),
                liquidationPrice: parseFloat(position.liquidatePrice),
                margin: parseFloat(position.positionMargin),
                unrealizedPNL: parseFloat(position.unRealizedProfit),
                realizedPNL: parseFloat(position.realizedProfit),
                availableMargin: parseFloat(position.availableMargin),
                positionMode: position.positionMode === 1 ? 'ISOLATED' : 'CROSS',
                holdFee: parseFloat(position.holdFee),
                openTime: new Date(parseInt(position.openTime)),
                updateTime: new Date(parseInt(position.updateTime))
            }));
        }, 'getPositions');
    }

    // === بيانات السوق ===
    async getMarkets(marketType = null) {
        if (marketType) {
            const markets = {};
            for (const [key, market] of this.supportedMarkets) {
                if (key.startsWith(marketType)) {
                    markets[market.symbol] = market;
                }
            }
            return markets;
        }
        
        return Object.fromEntries(this.supportedMarkets);
    }

    async getTicker(symbol, marketType = 'spot') {
        return await this.executeWithRetry(async () => {
            let response;
            let baseUrl = this.endpoints.base;
            let path = this.endpoints.methods.ticker24hr.path;

            if (marketType === 'future') {
                baseUrl = this.endpoints.future;
                path = '/api/v1/contract/ticker';
            }

            const params = { symbol: this.formatSymbol(symbol, marketType) };

            response = await this.axiosInstance.get(
                `${baseUrl}${path}`,
                { params }
            );

            const data = marketType === 'future' ? response.data.data : response.data;
            return {
                symbol: symbol,
                marketType: marketType,
                lastPrice: parseFloat(data.lastPrice || data.price),
                change: parseFloat(data.priceChange || data.riseFallValue) || 0,
                changePercent: parseFloat(data.priceChangePercent || data.riseFallRate) * 100 || 0,
                high: parseFloat(data.highPrice || data.high24Price),
                low: parseFloat(data.lowPrice || data.low24Price),
                volume: parseFloat(data.volume || data.volume24),
                quoteVolume: parseFloat(data.quoteVolume || data.amount24),
                bid: parseFloat(data.bidPrice) || 0,
                ask: parseFloat(data.askPrice) || 0,
                open: parseFloat(data.openPrice) || 0,
                prevClose: parseFloat(data.prevClosePrice) || 0,
                timestamp: new Date(data.closeTime || data.time)
            };
        }, 'getTicker');
    }

    async getOrderBook(symbol, marketType = 'spot', limit = 100) {
        return await this.executeWithRetry(async () => {
            let response;
            let baseUrl = this.endpoints.base;
            let path = this.endpoints.methods.depth.path;

            if (marketType === 'future') {
                baseUrl = this.endpoints.future;
                path = '/api/v1/contract/depth';
            }

            const params = {
                symbol: this.formatSymbol(symbol, marketType),
                limit
            };

            response = await this.axiosInstance.get(
                `${baseUrl}${path}`,
                { params }
            );

            const data = marketType === 'future' ? response.data.data : response.data;
            return {
                symbol: symbol,
                marketType: marketType,
                bids: data.bids.map(bid => [parseFloat(bid[0]), parseFloat(bid[1])]),
                asks: data.asks.map(ask => [parseFloat(ask[0]), parseFloat(ask[1])]),
                timestamp: new Date(),
                lastUpdateId: data.lastUpdateId || 0
            };
        }, 'getOrderBook');
    }

    async getKlines(symbol, marketType = 'spot', interval = '15m', limit = 100) {
        return await this.executeWithRetry(async () => {
            let response;
            let baseUrl = this.endpoints.base;
            let path = this.endpoints.methods.klines.path;

            if (marketType === 'future') {
                baseUrl = this.endpoints.future;
                path = '/api/v1/contract/kline';
            }

            const params = {
                symbol: this.formatSymbol(symbol, marketType),
                interval,
                limit
            };

            response = await this.axiosInstance.get(
                `${baseUrl}${path}`,
                { params }
            );

            const data = marketType === 'future' ? response.data.data : response.data;
            return data.map(kline => ({
                timestamp: new Date(kline[0]),
                open: parseFloat(kline[1]),
                high: parseFloat(kline[2]),
                low: parseFloat(kline[3]),
                close: parseFloat(kline[4]),
                volume: parseFloat(kline[5]),
                closeTime: new Date(kline[6]),
                quoteVolume: parseFloat(kline[7]) || 0,
                trades: parseInt(kline[8]) || 0
            }));
        }, 'getKlines');
    }

    // === دوال المساعدة ===
    createMEXCSignature(queryString) {
        return crypto
            .createHmac('sha256', this.credentials.secret)
            .update(queryString)
            .digest('hex');
    }

    createMEXCFutureSignature(params, method, path, timestamp) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');
        
        const payload = `${timestamp}${method}${path}${sortedParams}`;
        
        return crypto
            .createHmac('sha256', this.credentials.secret)
            .update(payload)
            .digest('hex');
    }

    getAuthHeaders() {
        return {
            'X-MEXC-APIKEY': this.credentials.apiKey,
            'Content-Type': 'application/json'
        };
    }

    getFutureAuthHeaders(timestamp, signature, method, path, contentType = '') {
        const headers = {
            'ApiKey': this.credentials.apiKey,
            'Request-Time': timestamp,
            'Signature': signature,
            'Content-Type': contentType || 'application/x-www-form-urlencoded'
        };

        return headers;
    }

    formatOrderResponse(order, orderData = {}) {
        return {
            orderId: order.orderId.toString(),
            clientOrderId: order.clientOrderId,
            symbol: this.parseSymbol(order.symbol),
            accountType: orderData.accountType || 'spot',
            side: order.side.toLowerCase(),
            type: order.type.toLowerCase(),
            quantity: parseFloat(order.origQty),
            executed: parseFloat(order.executedQty),
            price: parseFloat(order.price),
            avgPrice: parseFloat(order.avgPrice) || 0,
            status: this.mapOrderStatus(order.status),
            timeInForce: order.timeInForce,
            createdTime: new Date(order.time),
            updatedTime: new Date(order.updateTime || order.time),
            isWorking: order.isWorking || true,
            icebergQty: parseFloat(order.icebergQty) || 0
        };
    }

    formatFutureOrderResponse(order, orderData = {}) {
        return {
            orderId: order.orderId,
            clientOrderId: order.clientOrderId || '',
            symbol: order.symbol,
            accountType: 'future',
            side: order.side === 1 ? 'buy' : 'sell',
            type: order.orderType === 1 ? 'market' : 'limit',
            quantity: parseFloat(order.vol),
            executed: parseFloat(order.dealVol),
            price: parseFloat(order.price),
            avgPrice: parseFloat(order.avgPrice) || 0,
            status: this.mapFutureOrderStatus(order.state),
            leverage: parseFloat(order.lever),
            positionMode: order.openType === 1 ? 'ISOLATED' : 'CROSS',
            createdTime: new Date(parseInt(order.createTime)),
            updatedTime: new Date(parseInt(order.updateTime)),
            fee: parseFloat(order.fee) || 0,
            profit: parseFloat(order.profit) || 0
        };
    }

    mapOrderStatus(status) {
        const statusMap = {
            'NEW': 'open',
            'PARTIALLY_FILLED': 'partial',
            'FILLED': 'filled',
            'CANCELED': 'cancelled',
            'REJECTED': 'rejected',
            'EXPIRED': 'expired'
        };
        return statusMap[status] || status.toLowerCase();
    }

    mapFutureOrderStatus(status) {
        const statusMap = {
            1: 'open',
            2: 'partial',
            3: 'filled',
            4: 'cancelled',
            5: 'rejected',
            6: 'expired'
        };
        return statusMap[status] || 'unknown';
    }

    formatSymbol(symbol, marketType) {
        if (marketType === 'future') {
            return symbol.replace('/', '').toUpperCase();
        }
        return symbol.replace('/', '').toUpperCase();
    }

    parseSymbol(symbol) {
        const match = symbol.match(/([A-Za-z]+)(USDT|BUSD|USDC|BTC|ETH)$/);
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
        const formattedSymbol = this.formatSymbol(orderData.symbol, orderData.accountType || 'spot');
        const marketKey = `${orderData.accountType || 'spot'}:${formattedSymbol}`;
        
        if (!this.supportedMarkets.has(marketKey)) {
            throw new Error(`الرمز ${orderData.symbol} غير مدعوم أو غير نشط في نوع السوق ${orderData.accountType || 'spot'}`);
        }

        return true;
    }

    // === الإحصائيات ===
    getExchangeStats() {
        const baseStats = super.getStats();
        return {
            ...baseStats,
            supportedMarkets: this.supportedMarkets.size,
            accountTypes: Array.from(this.accountTypes),
            features: this.options.supportedFeatures,
            marketTypes: Object.keys(this.marketConfigs)
        };
    }

    // === إدارة السيولة ===
    async getLiquidity(symbol, marketType = 'spot') {
        try {
            const orderbook = await this.getOrderBook(symbol, marketType, 50);
            
            const bidLiquidity = orderbook.bids.reduce((sum, bid) => sum + bid[0] * bid[1], 0);
            const askLiquidity = orderbook.asks.reduce((sum, ask) => sum + ask[0] * ask[1], 0);
            const spread = orderbook.asks[0][0] - orderbook.bids[0][0];
            const spreadPercent = (spread / orderbook.bids[0][0]) * 100;

            return {
                symbol,
                marketType,
                bidLiquidity,
                askLiquidity,
                totalLiquidity: bidLiquidity + askLiquidity,
                spread,
                spreadPercent,
                bestBid: orderbook.bids[0][0],
                bestAsk: orderbook.asks[0][0],
                timestamp: orderbook.timestamp
            };
        } catch (error) {
            this.handleError('LIQUIDITY_CHECK_FAILED', error);
            throw error;
        }
    }
}

module.exports = MEXCService;