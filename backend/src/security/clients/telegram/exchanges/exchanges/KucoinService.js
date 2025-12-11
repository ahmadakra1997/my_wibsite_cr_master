// backend/clients/exchanges/exchanges/KucoinService.js - النسخة المتقدمة والمحسنة
const BaseExchangeService = require('../BaseExchangeService');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class KucoinService extends BaseExchangeService {
    constructor(credentials, options = {}) {
        super(credentials, {
            baseUrl: 'https://api.kucoin.com',
            apiVersion: 'v1',
            rateLimit: 18,
            precision: 8,
            supportedFeatures: ['spot', 'margin', 'futures', 'staking', 'lending', 'earn'],
            ...options
        });
        
        this.name = 'KuCoin';
        this.requiresSignatures = true;
        this.requiresPassphrase = true;
        this.supportedMarkets = new Map();
        this.accountTypes = new Set(['main', 'trade', 'margin', 'futures', 'pool', 'isolated']);
        this.currentAccountType = 'trade';
        
        this.initializeEndpoints();
        this.initializeMarketInfo();
    }

    // === تهيئة النقاط النهائية وإعدادات المنصة ===
    initializeEndpoints() {
        this.endpoints = {
            base: 'https://api.kucoin.com',
            future: 'https://api-futures.kucoin.com',
            methods: {
                // النقاط النهائية العامة
                time: { method: 'GET', path: '/api/v1/timestamp', auth: false },
                symbols: { method: 'GET', path: '/api/v1/symbols', auth: false },
                currencies: { method: 'GET', path: '/api/v1/currencies', auth: false },
                tickers: { method: 'GET', path: '/api/v1/market/allTickers', auth: false },
                orderbook: { method: 'GET', path: '/api/v1/market/orderbook/level2_100', auth: false },
                stats: { method: 'GET', path: '/api/v1/market/stats', auth: false },
                candles: { method: 'GET', path: '/api/v1/market/candles', auth: false },
                
                // النقاط النهائية الخاصة - Spot
                accounts: { method: 'GET', path: '/api/v1/accounts', auth: true },
                accountDetail: { method: 'GET', path: '/api/v1/accounts/{accountId}', auth: true },
                spotOrders: { method: 'POST', path: '/api/v1/orders', auth: true },
                spotOrderCancel: { method: 'DELETE', path: '/api/v1/orders/{orderId}', auth: true },
                spotOrderDetail: { method: 'GET', path: '/api/v1/orders/{orderId}', auth: true },
                spotOpenOrders: { method: 'GET', path: '/api/v1/orders', auth: true },
                spotOrderHistory: { method: 'GET', path: '/api/v1/orders', auth: true },
                
                // النقاط النهائية الخاصة - Margin
                marginAccounts: { method: 'GET', path: '/api/v1/margin/account', auth: true },
                marginOrders: { method: 'POST', path: '/api/v1/margin/order', auth: true },
                marginOrderCancel: { method: 'DELETE', path: '/api/v1/margin/order/{orderId}', auth: true },
                marginBorrow: { method: 'POST', path: '/api/v1/margin/borrow', auth: true },
                marginRepay: { method: 'POST', path: '/api/v1/margin/repay', auth: true },
                
                // النقاط النهائية الخاصة - Futures
                futureAccounts: { method: 'GET', path: '/api/v1/account-overview', auth: true },
                futurePositions: { method: 'GET', path: '/api/v1/positions', auth: true },
                futureOrders: { method: 'POST', path: '/api/v1/orders', auth: true },
                futureOrderCancel: { method: 'DELETE', path: '/api/v1/orders/{orderId}', auth: true },
                futureOrderDetail: { method: 'GET', path: '/api/v1/orders/{orderId}', auth: true },
                futureOpenOrders: { method: 'GET', path: '/api/v1/orders', auth: true }
            }
        };
    }

    initializeMarketInfo() {
        this.marketConfigs = {
            'spot': {
                name: 'التداول الفوري',
                orderTypes: ['limit', 'market', 'stop_limit', 'stop_market'],
                timeInForce: ['GTC', 'GTT', 'IOC', 'FOK'],
                accountTypes: ['main', 'trade']
            },
            'margin': {
                name: 'الهامش',
                orderTypes: ['limit', 'market'],
                timeInForce: ['GTC', 'IOC', 'FOK'],
                accountTypes: ['margin'],
                modes: ['cross', 'isolated']
            },
            'futures': {
                name: 'العقود الآجلة',
                orderTypes: ['limit', 'market', 'stop'],
                timeInForce: ['GTC', 'IOC', 'FOK'],
                accountTypes: ['futures'],
                settlement: ['USDT', 'USDM']
            },
            'pool': {
                name: 'التجميع',
                orderTypes: ['limit', 'market'],
                timeInForce: ['GTC'],
                accountTypes: ['pool']
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
                `${this.endpoints.base}${this.endpoints.methods.time.path}`
            );
            
            if (response.data.code !== '200000') {
                throw new Error(response.data.msg || 'فشل اختبار الاتصال');
            }
            
            return response.data;
        }, 'testConnection');
    }

    async loadAccountInfo() {
        try {
            // اختبار الحسابات المتاحة
            const accountTests = [
                this.getBalance('trade').then(() => 'trade').catch(() => null),
                this.getBalance('margin').then(() => 'margin').catch(() => null),
                this.getFutureBalance().then(() => 'futures').catch(() => null)
            ];

            const results = await Promise.allSettled(accountTests);
            const availableAccounts = results
                .filter(result => result.status === 'fulfilled' && result.value)
                .map(result => result.value);

            this.accountTypes = new Set(['main', ...availableAccounts]);
            
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
            const marketTypes = ['spot', 'margin', 'futures'];
            
            for (const marketType of marketTypes) {
                try {
                    let response;
                    let symbols = [];

                    if (marketType === 'spot') {
                        response = await this.axiosInstance.get(
                            `${this.endpoints.base}${this.endpoints.methods.symbols.path}`
                        );
                        symbols = response.data.data || [];
                    } else if (marketType === 'futures') {
                        response = await this.axiosInstance.get(
                            `${this.endpoints.future}/api/v1/contracts/active`
                        );
                        symbols = response.data.data || [];
                    } else {
                        // Margin يستخدم نفس رموز Spot
                        continue;
                    }

                    symbols.forEach(symbol => {
                        const marketKey = `${marketType}:${symbol.symbol}`;
                        
                        this.supportedMarkets.set(marketKey, {
                            symbol: symbol.symbol,
                            type: marketType,
                            base: symbol.baseCurrency || symbol.baseAsset,
                            quote: symbol.quoteCurrency || symbol.quoteAsset,
                            status: symbol.enableTrading ? 'active' : 'inactive',
                            precision: {
                                price: this.getPrecision(symbol.priceIncrement || symbol.tickSize),
                                quantity: this.getPrecision(symbol.baseIncrement || symbol.lotSize)
                            },
                            limits: {
                                minAmount: parseFloat(symbol.baseMinSize || symbol.minOrderQty) || 0,
                                maxAmount: parseFloat(symbol.baseMaxSize || symbol.maxOrderQty) || 0,
                                minFunds: parseFloat(symbol.quoteMinSize || symbol.minOrderFunds) || 0,
                                minPrice: parseFloat(symbol.priceLimitRate?.min) || 0,
                                maxPrice: parseFloat(symbol.priceLimitRate?.max) || 0
                            },
                            leverage: symbol.leverage ? {
                                min: parseFloat(symbol.leverage.min) || 1,
                                max: parseFloat(symbol.leverage.max) || 100
                            } : null,
                            fee: {
                                maker: parseFloat(symbol.makerFeeRate) || 0.001,
                                taker: parseFloat(symbol.takerFeeRate) || 0.001
                            },
                            risk: symbol.riskLimit ? {
                                level: symbol.riskLimit.level,
                                maxLeverage: parseFloat(symbol.riskLimit.maxLeverage)
                            } : null
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
    async getBalance(accountType = 'trade', currency = null) {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now().toString();
            const method = 'GET';
            let path = this.endpoints.methods.accounts.path;
            let baseUrl = this.endpoints.base;

            // تحديد المسار بناءً على نوع الحساب
            if (accountType === 'margin') {
                path = this.endpoints.methods.marginAccounts.path;
            } else if (accountType === 'futures') {
                return await this.getFutureBalance(currency);
            }

            const queryString = currency ? `currency=${currency}&type=${accountType}` : `type=${accountType}`;
            const signature = this.createKucoinSignature(timestamp, method, path, queryString);

            const response = await this.axiosInstance.get(
                `${baseUrl}${path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature, method, path, queryString),
                    params: currency ? { currency, type: accountType } : { type: accountType }
                }
            );

            if (response.data.code !== '200000') {
                throw new Error(response.data.msg || 'فشل جلب الرصيد');
            }

            const balances = this.formatBalanceResponse(response.data.data, accountType);
            
            this.emit('balance_loaded', {
                exchange: this.name,
                accountType,
                balances,
                timestamp: new Date()
            });

            return balances;
        }, `getBalance_${accountType}`);
    }

    async getFutureBalance(currency = null) {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now().toString();
            const method = 'GET';
            const path = this.endpoints.methods.futureAccounts.path;
            const baseUrl = this.endpoints.future;

            const queryString = currency ? `currency=${currency}` : '';
            const signature = this.createKucoinSignature(timestamp, method, path, queryString, 'future');

            const response = await this.axiosInstance.get(
                `${baseUrl}${path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature, method, path, queryString, 'future'),
                    params: currency ? { currency } : {}
                }
            );

            if (response.data.code !== '200000') {
                throw new Error(response.data.msg || 'فشل جلب رصيد العقود الآجلة');
            }

            return this.formatFutureBalanceResponse(response.data.data);
        }, 'getFutureBalance');
    }

    formatBalanceResponse(data, accountType) {
        const balances = {};

        if (Array.isArray(data)) {
            data.forEach(account => {
                const currency = account.currency;
                const available = parseFloat(account.available || 0);
                const holds = parseFloat(account.holds || 0);
                const total = available + holds;
                
                if (total > 0 || holds > 0) {
                    balances[currency] = { 
                        free: available,
                        locked: holds,
                        total: total,
                        accountType: accountType,
                        accountId: account.id
                    };

                    // إضافة حقول إضافية بناءً على نوع الحساب
                    if (accountType === 'margin') {
                        balances[currency].borrowed = parseFloat(account.borrowed || 0);
                        balances[currency].available = parseFloat(account.available || 0);
                        balances[currency].holds = parseFloat(account.holds || 0);
                        balances[currency].lent = parseFloat(account.lent || 0);
                        balances[currency].transferable = parseFloat(account.transferable || 0);
                    }

                    this.updateBalance(currency, available);
                }
            });
        }

        return balances;
    }

    formatFutureBalanceResponse(data) {
        const balances = {};
        
        if (data) {
            balances[data.accountEquity] = {
                free: parseFloat(data.availableBalance),
                locked: parseFloat(data.accountEquity) - parseFloat(data.availableBalance),
                total: parseFloat(data.accountEquity),
                unrealisedPNL: parseFloat(data.unrealisedPNL),
                realisedPNL: parseFloat(data.realisedPNL),
                marginBalance: parseFloat(data.marginBalance),
                positionMargin: parseFloat(data.positionMargin),
                orderMargin: parseFloat(data.orderMargin),
                frozenFunds: parseFloat(data.frozenFunds),
                accountType: 'futures'
            };
            this.updateBalance(data.accountEquity, parseFloat(data.availableBalance));
        }

        return balances;
    }

    // === إدارة الطلبات ===
    async createOrder(orderData) {
        this.validateOrderData(orderData);

        return await this.executeWithRetry(async () => {
            const timestamp = Date.now().toString();
            const clientOid = orderData.clientOrderId || `x-${uuidv4().split('-')[0]}`;
            let path, method = 'POST', baseUrl = this.endpoints.base, body;

            // تحديد المسار والبيانات بناءً على نوع الحساب
            if (orderData.accountType === 'futures') {
                baseUrl = this.endpoints.future;
                path = this.endpoints.methods.futureOrders.path;
                
                body = {
                    clientOid: clientOid,
                    symbol: this.formatSymbol(orderData.symbol, 'futures'),
                    side: orderData.side.toLowerCase(),
                    type: orderData.type.toLowerCase(),
                    leverage: orderData.leverage || 1,
                    size: orderData.quantity
                };

                if (orderData.type === 'limit') {
                    body.price = orderData.price;
                    body.timeInForce = orderData.timeInForce || 'GTC';
                }

                if (orderData.stopPrice) {
                    body.stopPrice = orderData.stopPrice;
                }

                if (orderData.reduceOnly !== undefined) {
                    body.reduceOnly = orderData.reduceOnly;
                }

                if (orderData.closeOrder !== undefined) {
                    body.closeOrder = orderData.closeOrder;
                }
            } else if (orderData.accountType === 'margin') {
                path = this.endpoints.methods.marginOrders.path;
                body = {
                    clientOid: clientOid,
                    side: orderData.side.toLowerCase(),
                    symbol: this.formatSymbol(orderData.symbol, 'margin'),
                    type: orderData.type.toLowerCase(),
                    size: orderData.quantity,
                    marginMode: orderData.marginMode || 'cross'
                };

                if (orderData.type === 'limit') {
                    body.price = orderData.price;
                    body.timeInForce = orderData.timeInForce || 'GTC';
                }

                if (orderData.autoBorrow !== undefined) {
                    body.autoBorrow = orderData.autoBorrow;
                }
            } else {
                // Spot
                path = this.endpoints.methods.spotOrders.path;
                body = {
                    clientOid: clientOid,
                    side: orderData.side.toLowerCase(),
                    symbol: this.formatSymbol(orderData.symbol, 'spot'),
                    type: orderData.type.toLowerCase(),
                    size: orderData.quantity
                };

                if (orderData.type === 'limit') {
                    body.price = orderData.price;
                    body.timeInForce = orderData.timeInForce || 'GTC';
                }

                if (orderData.stopPrice) {
                    body.stopPrice = orderData.stopPrice;
                }

                if (orderData.stopType) {
                    body.stop = orderData.stopType;
                }

                if (orderData.postOnly !== undefined) {
                    body.postOnly = orderData.postOnly;
                }

                if (orderData.hidden !== undefined) {
                    body.hidden = orderData.hidden;
                }

                if (orderData.iceberg !== undefined) {
                    body.iceberg = orderData.iceberg;
                }

                if (orderData.visibleSize) {
                    body.visibleSize = orderData.visibleSize;
                }
            }

            const signature = this.createKucoinSignature(
                method, 
                path, 
                '', 
                timestamp,
                orderData.accountType === 'futures' ? 'future' : 'spot'
            );

            const response = await this.axiosInstance.post(
                `${baseUrl}${path}`,
                body,
                {
                    headers: this.getAuthHeaders(
                        timestamp, 
                        signature, 
                        method, 
                        path, 
                        '', 
                        orderData.accountType === 'futures' ? 'future' : 'spot'
                    )
                }
            );

            if (response.data.code !== '200000') {
                throw new Error(response.data.msg || 'فشل إنشاء الطلب');
            }

            const orderResult = this.formatOrderResponse(
                response.data.data, 
                orderData.accountType || 'spot',
                orderData,
                clientOid
            );
            
            this.updateOrder(orderResult);

            this.emit('order_created', {
                exchange: this.name,
                orderId: orderResult.orderId,
                clientOrderId: orderResult.clientOrderId,
                symbol: orderData.symbol,
                side: orderData.side,
                type: orderData.type,
                accountType: orderData.accountType || 'spot',
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
            const method = 'DELETE';
            let path, baseUrl = this.endpoints.base;

            if (orderData.accountType === 'futures') {
                baseUrl = this.endpoints.future;
                path = this.endpoints.methods.futureOrderCancel.path.replace('{orderId}', orderData.orderId);
            } else if (orderData.accountType === 'margin') {
                path = this.endpoints.methods.marginOrderCancel.path.replace('{orderId}', orderData.orderId);
            } else {
                path = this.endpoints.methods.spotOrderCancel.path.replace('{orderId}', orderData.orderId);
            }

            const signature = this.createKucoinSignature(
                method, 
                path, 
                '', 
                timestamp,
                orderData.accountType === 'futures' ? 'future' : 'spot'
            );

            const response = await this.axiosInstance.delete(
                `${baseUrl}${path}`,
                {
                    headers: this.getAuthHeaders(
                        timestamp, 
                        signature, 
                        method, 
                        path, 
                        '', 
                        orderData.accountType === 'futures' ? 'future' : 'spot'
                    )
                }
            );

            if (response.data.code !== '200000') {
                throw new Error(response.data.msg || 'فشل إلغاء الطلب');
            }

            const cancelledOrder = this.formatOrderResponse(
                response.data.data, 
                orderData.accountType || 'spot'
            );

            this.emit('order_cancelled', {
                exchange: this.name,
                orderId: orderData.orderId,
                symbol: orderData.symbol,
                accountType: orderData.accountType || 'spot',
                timestamp: new Date()
            });

            return cancelledOrder;
        }, 'cancelOrder');
    }

    async getOrder(orderData) {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now().toString();
            const method = 'GET';
            let path, baseUrl = this.endpoints.base;

            if (orderData.accountType === 'futures') {
                baseUrl = this.endpoints.future;
                path = this.endpoints.methods.futureOrderDetail.path.replace('{orderId}', orderData.orderId);
            } else if (orderData.accountType === 'margin') {
                path = this.endpoints.methods.marginOrderCancel.path.replace('{orderId}', orderData.orderId);
                // Note: KuCoin Margin قد يحتاج إلى تعديل
                return null;
            } else {
                path = this.endpoints.methods.spotOrderDetail.path.replace('{orderId}', orderData.orderId);
            }

            const signature = this.createKucoinSignature(
                method, 
                path, 
                '', 
                timestamp,
                orderData.accountType === 'futures' ? 'future' : 'spot'
            );

            const response = await this.axiosInstance.get(
                `${baseUrl}${path}`,
                {
                    headers: this.getAuthHeaders(
                        timestamp, 
                        signature, 
                        method, 
                        path, 
                        '', 
                        orderData.accountType === 'futures' ? 'future' : 'spot'
                    )
                }
            );

            if (response.data.code !== '200000') {
                throw new Error(response.data.msg || 'فشل جلب الطلب');
            }

            return this.formatOrderResponse(
                response.data.data, 
                orderData.accountType || 'spot'
            );
        }, 'getOrder');
    }

    async getOpenOrders(accountType = 'spot', symbol = null) {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now().toString();
            const method = 'GET';
            let path, baseUrl = this.endpoints.base;

            if (accountType === 'futures') {
                baseUrl = this.endpoints.future;
                path = this.endpoints.methods.futureOpenOrders.path;
            } else {
                path = this.endpoints.methods.spotOpenOrders.path;
            }

            const queryParams = symbol ? `symbol=${this.formatSymbol(symbol, accountType)}` : '';
            const signature = this.createKucoinSignature(
                method, 
                path, 
                queryParams, 
                timestamp,
                accountType === 'futures' ? 'future' : 'spot'
            );

            const response = await this.axiosInstance.get(
                `${baseUrl}${path}`,
                {
                    headers: this.getAuthHeaders(
                        timestamp, 
                        signature, 
                        method, 
                        path, 
                        queryParams, 
                        accountType === 'futures' ? 'future' : 'spot'
                    ),
                    params: symbol ? { symbol: this.formatSymbol(symbol, accountType) } : {}
                }
            );

            if (response.data.code !== '200000') {
                throw new Error(response.data.msg || 'فشل جلب الطلبات المفتوحة');
            }

            const orders = response.data.data.items || response.data.data;
            return Array.isArray(orders) 
                ? orders.map(order => this.formatOrderResponse(order, accountType))
                : [this.formatOrderResponse(orders, accountType)];
        }, 'getOpenOrders');
    }

    // === إدارة المراكز (للعقود الآجلة) ===
    async getPositions(symbol = null) {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now().toString();
            const method = 'GET';
            const path = this.endpoints.methods.futurePositions.path;
            const baseUrl = this.endpoints.future;

            const queryParams = symbol ? `symbol=${this.formatSymbol(symbol, 'futures')}` : '';
            const signature = this.createKucoinSignature(method, path, queryParams, timestamp, 'future');

            const response = await this.axiosInstance.get(
                `${baseUrl}${path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature, method, path, queryParams, 'future'),
                    params: symbol ? { symbol: this.formatSymbol(symbol, 'futures') } : {}
                }
            );

            if (response.data.code !== '200000') {
                throw new Error(response.data.msg || 'فشل جلب المراكز');
            }

            return response.data.data.map(position => ({
                symbol: position.symbol,
                positionId: position.id,
                side: position.side,
                size: parseFloat(position.currentQty),
                leverage: parseFloat(position.leverage),
                entryPrice: parseFloat(position.avgEntryPrice),
                markPrice: parseFloat(position.markPrice),
                liquidationPrice: parseFloat(position.liquidationPrice),
                margin: parseFloat(position.margin),
                unrealisedPNL: parseFloat(position.unrealisedPnl),
                realisedPNL: parseFloat(position.realisedPnl),
                openOrderSize: parseFloat(position.openOrderBuyQty) + parseFloat(position.openOrderSellQty),
                riskLimit: parseFloat(position.riskLimit),
                autoDeposit: position.autoDeposit,
                maintMarginReq: parseFloat(position.maintMarginReq),
                crossMode: position.crossMode,
                isolated: !position.crossMode,
                isolatedWallet: parseFloat(position.isolatedWallet),
                adl: position.adl
            }));
        }, 'getPositions');
    }

    // === إدارة الهامش ===
    async getMarginInfo() {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now().toString();
            const method = 'GET';
            const path = '/api/v1/margin/config';
            const baseUrl = this.endpoints.base;

            const signature = this.createKucoinSignature(method, path, '', timestamp);

            const response = await this.axiosInstance.get(
                `${baseUrl}${path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature, method, path, '')
                }
            );

            if (response.data.code !== '200000') {
                throw new Error(response.data.msg || 'فشل جلب معلومات الهامش');
            }

            return response.data.data;
        }, 'getMarginInfo');
    }

    async marginBorrow(currency, amount, term = 7) {
        return await this.executeWithRetry(async () => {
            const timestamp = Date.now().toString();
            const method = 'POST';
            const path = this.endpoints.methods.marginBorrow.path;
            const baseUrl = this.endpoints.base;

            const body = {
                currency: currency.toUpperCase(),
                size: amount.toString(),
                term: term.toString()
            };

            const signature = this.createKucoinSignature(method, path, '', timestamp);

            const response = await this.axiosInstance.post(
                `${baseUrl}${path}`,
                body,
                {
                    headers: this.getAuthHeaders(timestamp, signature, method, path, '')
                }
            );

            if (response.data.code !== '200000') {
                throw new Error(response.data.msg || 'فشل طلب القرض');
            }

            this.emit('margin_borrowed', {
                exchange: this.name,
                currency,
                amount,
                term,
                orderId: response.data.data.orderId,
                timestamp: new Date()
            });

            return response.data.data;
        }, 'marginBorrow');
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
            let path = '/api/v1/market/orderbook/level1';

            if (marketType === 'futures') {
                baseUrl = this.endpoints.future;
                path = '/api/v1/ticker';
            }

            const params = { symbol: this.formatSymbol(symbol, marketType) };

            response = await this.axiosInstance.get(
                `${baseUrl}${path}`,
                { params }
            );

            if (response.data.code !== '200000') {
                throw new Error(response.data.msg || 'فشل جلب بيانات التداول');
            }

            const data = response.data.data;
            return {
                symbol: symbol,
                marketType: marketType,
                lastPrice: parseFloat(data.price || data.last),
                change: parseFloat(data.changePrice) || 0,
                changePercent: parseFloat(data.changeRate) * 100 || 0,
                high: parseFloat(data.high || data.high24h),
                low: parseFloat(data.low || data.low24h),
                volume: parseFloat(data.vol || data.vol24h),
                quoteVolume: parseFloat(data.volValue || data.volValue24h),
                bid: parseFloat(data.bestBid || data.bid),
                ask: parseFloat(data.bestAsk || data.ask),
                bidSize: parseFloat(data.bestBidSize) || 0,
                askSize: parseFloat(data.bestAskSize) || 0,
                timestamp: new Date()
            };
        }, 'getTicker');
    }

    async getOrderBook(symbol, marketType = 'spot', limit = 100) {
        return await this.executeWithRetry(async () => {
            let response;
            let baseUrl = this.endpoints.base;
            let path = `/api/v1/market/orderbook/level2_${limit}`;

            if (marketType === 'futures') {
                baseUrl = this.endpoints.future;
                path = '/api/v1/level2/snapshot';
            }

            const params = { symbol: this.formatSymbol(symbol, marketType) };

            response = await this.axiosInstance.get(
                `${baseUrl}${path}`,
                { params }
            );

            if (response.data.code !== '200000') {
                throw new Error(response.data.msg || 'فشل جلب سجل الطلبات');
            }

            const data = response.data.data;
            return {
                symbol: symbol,
                marketType: marketType,
                bids: (data.bids || []).map(bid => [parseFloat(bid[0]), parseFloat(bid[1])]),
                asks: (data.asks || []).map(ask => [parseFloat(ask[0]), parseFloat(ask[1])]),
                timestamp: new Date(data.time || Date.now()),
                sequence: data.sequence
            };
        }, 'getOrderBook');
    }

    async getCandles(symbol, marketType = 'spot', interval = '15min', limit = 100) {
        return await this.executeWithRetry(async () => {
            let response;
            let baseUrl = this.endpoints.base;
            let path = this.endpoints.methods.candles.path;

            if (marketType === 'futures') {
                baseUrl = this.endpoints.future;
                path = '/api/v1/kline/query';
            }

            const params = {
                symbol: this.formatSymbol(symbol, marketType),
                type: interval,
                limit: limit
            };

            response = await this.axiosInstance.get(
                `${baseUrl}${path}`,
                { params }
            );

            if (response.data.code !== '200000') {
                throw new Error(response.data.msg || 'فشل جلب بيانات الشموع');
            }

            return response.data.data.map(candle => ({
                timestamp: new Date(parseInt(candle[0]) * 1000),
                open: parseFloat(candle[1]),
                high: parseFloat(candle[2]),
                low: parseFloat(candle[3]),
                close: parseFloat(candle[4]),
                volume: parseFloat(candle[5]),
                amount: parseFloat(candle[6])
            }));
        }, 'getCandles');
    }

    // === دوال المساعدة ===
    createKucoinSignature(timestamp, method, path, queryString = '', apiType = 'spot') {
        let strToSign = '';

        if (apiType === 'future') {
            strToSign = timestamp + method + path + queryString;
        } else {
            strToSign = timestamp + method + path + queryString;
        }

        return crypto
            .createHmac('sha256', this.credentials.secret)
            .update(strToSign)
            .digest('base64');
    }

    getAuthHeaders(timestamp, signature, method, path, queryString = '', apiType = 'spot') {
        const passphrase = crypto
            .createHmac('sha256', this.credentials.secret)
            .update(this.credentials.passphrase)
            .digest('base64');

        const headers = {
            'KC-API-KEY': this.credentials.apiKey,
            'KC-API-SIGN': signature,
            'KC-API-TIMESTAMP': timestamp,
            'KC-API-PASSPHRASE': passphrase,
            'KC-API-KEY-VERSION': '2'
        };

        if (method === 'POST' || method === 'PUT') {
            headers['Content-Type'] = 'application/json';
        }

        return headers;
    }

    formatOrderResponse(order, accountType, orderData = {}, clientOid = '') {
        const baseOrder = {
            orderId: order.orderId || order.id,
            clientOrderId: order.clientOid || clientOid,
            symbol: order.symbol || orderData.symbol,
            accountType: accountType,
            side: order.side || orderData.side,
            type: order.type || orderData.type,
            quantity: parseFloat(order.size || order.quantity || orderData.quantity),
            executed: parseFloat(order.filledSize || order.filledQty || 0),
            price: parseFloat(order.price || orderData.price || 0),
            avgPrice: parseFloat(order.avgPrice || 0),
            status: this.mapOrderStatus(order.status || order.state),
            timeInForce: order.timeInForce || 'GTC',
            createdTime: new Date(order.createdAt || order.orderTime || Date.now()),
            updatedTime: new Date(order.updatedAt || order.orderTime || Date.now())
        };

        // إضافة حقول إضافية بناءً على نوع الحساب
        if (accountType === 'futures') {
            baseOrder.leverage = parseFloat(order.leverage || 1);
            baseOrder.reduceOnly = order.reduceOnly || false;
            baseOrder.closeOrder = order.closeOrder || false;
            baseOrder.forceHold = order.forceHold || false;
            baseOrder.stopTriggered = order.stopTriggered || false;
            baseOrder.stopPrice = parseFloat(order.stopPrice || 0);
        } else if (accountType === 'margin') {
            baseOrder.marginMode = order.marginMode || 'cross';
            baseOrder.autoBorrow = order.autoBorrow || false;
        } else {
            baseOrder.postOnly = order.postOnly || false;
            baseOrder.hidden = order.hidden || false;
            baseOrder.iceberg = order.iceberg || false;
            baseOrder.visibleSize = parseFloat(order.visibleSize || 0);
            baseOrder.cancelAfter = order.cancelAfter || 0;
            baseOrder.channel = order.channel || 'API';
        }

        return baseOrder;
    }

    mapOrderStatus(status) {
        const statusMap = {
            'open': 'open',
            'active': 'open',
            'done': 'filled',
            'filled': 'filled',
            'canceled': 'cancelled',
            'cancelled': 'cancelled',
            'partial': 'partial',
            'match': 'partial',
            'new': 'open',
            'pending': 'open'
        };
        return statusMap[status] || status;
    }

    getPrecision(value) {
        if (!value) return 8;
        const decimal = value.toString().split('.')[1];
        return decimal ? decimal.length : 0;
    }

    formatSymbol(symbol, marketType) {
        if (marketType === 'futures') {
            return symbol.replace('/', '').toUpperCase();
        }
        return symbol.replace('/', '-').toUpperCase();
    }

    parseSymbol(symbol) {
        return symbol.replace('-', '/');
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

module.exports = KucoinService;