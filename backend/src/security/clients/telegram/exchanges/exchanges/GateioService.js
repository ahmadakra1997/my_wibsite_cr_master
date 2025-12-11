// backend/clients/exchanges/exchanges/GateioService.js - النسخة المتقدمة والمحسنة
const BaseExchangeService = require('../BaseExchangeService');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class GateioService extends BaseExchangeService {
    constructor(credentials, options = {}) {
        super(credentials, {
            baseUrl: 'https://api.gateio.ws',
            apiVersion: 'v4',
            rateLimit: 10,
            precision: 8,
            supportedFeatures: ['spot', 'margin', 'futures', 'options', 'earn', 'loan'],
            ...options
        });
        
        this.name = 'Gate.io';
        this.requiresSignatures = true;
        this.requiresPassphrase = false;
        this.supportedMarkets = new Map();
        this.accountTypes = new Set(['spot', 'margin', 'futures', 'delivery', 'options']);
        this.currentAccount = 'spot';
        
        this.initializeEndpoints();
        this.initializeMarketInfo();
    }

    // === تهيئة النقاط النهائية وإعدادات المنصة ===
    initializeEndpoints() {
        this.endpoints = {
            base: 'https://api.gateio.ws',
            methods: {
                // النقاط النهائية العامة
                time: { method: 'GET', path: '/api/v4/spot/time', auth: false },
                currencies: { method: 'GET', path: '/api/v4/spot/currencies', auth: false },
                currencyPairs: { method: 'GET', path: '/api/v4/spot/currency_pairs', auth: false },
                tickers: { method: 'GET', path: '/api/v4/spot/tickers', auth: false },
                orderbook: { method: 'GET', path: '/api/v4/spot/order_book', auth: false },
                candles: { method: 'GET', path: '/api/v4/spot/candlesticks', auth: false },
                
                // النقاط النهائية الخاصة
                spotAccounts: { method: 'GET', path: '/api/v4/spot/accounts', auth: true },
                marginAccounts: { method: 'GET', path: '/api/v4/margin/accounts', auth: true },
                futuresAccounts: { method: 'GET', path: '/api/v4/futures/accounts', auth: true },
                spotOrders: { method: 'POST', path: '/api/v4/spot/orders', auth: true },
                marginOrders: { method: 'POST', path: '/api/v4/margin/orders', auth: true },
                futuresOrders: { method: 'POST', path: '/api/v4/futures/orders', auth: true },
                orderCancel: { method: 'DELETE', path: '/api/v4/spot/orders', auth: true },
                orderDetail: { method: 'GET', path: '/api/v4/spot/orders', auth: true },
                openOrders: { method: 'GET', path: '/api/v4/spot/open_orders', auth: true },
                marginOpenOrders: { method: 'GET', path: '/api/v4/margin/open_orders', auth: true },
                futuresPositions: { method: 'GET', path: '/api/v4/futures/positions', auth: true },
                loanRecords: { method: 'GET', path: '/api/v4/margin/loan_records', auth: true }
            }
        };
    }

    initializeMarketInfo() {
        this.marketConfigs = {
            'spot': {
                name: 'التداول الفوري',
                orderTypes: ['limit', 'market'],
                timeInForce: ['gtc', 'ioc', 'poc'],
                settlement: 'instant'
            },
            'margin': {
                name: 'الهامش',
                orderTypes: ['limit', 'market'],
                timeInForce: ['gtc', 'ioc', 'poc'],
                settlement: 'instant',
                modes: ['cross', 'isolated']
            },
            'futures': {
                name: 'العقود الآجلة',
                orderTypes: ['limit', 'market'],
                timeInForce: ['gtc', 'ioc', 'poc'],
                settlement: 'daily',
                types: ['usdt', 'btc', 'usd']
            },
            'options': {
                name: 'الخيارات',
                orderTypes: ['limit', 'market'],
                timeInForce: ['gtc'],
                settlement: 'expiry'
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
            
            if (!response.data || !response.data.server_time) {
                throw new Error('فشل اختبار الاتصال');
            }
            
            return response.data;
        }, 'testConnection');
    }

    async loadAccountInfo() {
        try {
            // اختبار الحسابات المتاحة
            const accountTests = [
                this.getBalance('spot').then(() => 'spot').catch(() => null),
                this.getBalance('margin').then(() => 'margin').catch(() => null),
                this.getBalance('futures').then(() => 'futures').catch(() => null)
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
            const marketTypes = ['spot', 'margin', 'futures_usdt', 'futures_btc', 'options'];
            
            for (const marketType of marketTypes) {
                try {
                    let response;
                    let path;

                    switch (marketType) {
                        case 'spot':
                            path = this.endpoints.methods.currencyPairs.path;
                            response = await this.axiosInstance.get(
                                `${this.endpoints.base}${path}`
                            );
                            break;
                        case 'margin':
                            path = '/api/v4/margin/currency_pairs';
                            response = await this.axiosInstance.get(
                                `${this.endpoints.base}${path}`
                            );
                            break;
                        case 'futures_usdt':
                            path = '/api/v4/futures/usdt/contracts';
                            response = await this.axiosInstance.get(
                                `${this.endpoints.base}${path}`
                            );
                            break;
                        default:
                            continue;
                    }

                    if (response.data && Array.isArray(response.data)) {
                        response.data.forEach(pair => {
                            const marketKey = `${marketType}:${pair.id}`;
                            
                            this.supportedMarkets.set(marketKey, {
                                id: pair.id,
                                type: marketType,
                                base: pair.base,
                                quote: pair.quote,
                                status: this.mapMarketStatus(pair.trade_status || pair.enabled),
                                precision: {
                                    price: parseInt(pair.precision || pair.order_price_round) || 8,
                                    quantity: parseInt(pair.amount_precision || pair.order_size_round) || 8
                                },
                                limits: {
                                    minAmount: parseFloat(pair.min_base_amount || pair.min_order_amount) || 0,
                                    maxAmount: parseFloat(pair.max_base_amount || pair.max_order_amount) || 0,
                                    minPrice: parseFloat(pair.min_quote_amount) || 0,
                                    minChange: parseFloat(pair.min_change) || 0
                                },
                                leverage: pair.leverage ? {
                                    min: parseFloat(pair.leverage_min) || 1,
                                    max: parseFloat(pair.leverage_max) || 100,
                                    step: parseFloat(pair.leverage_step) || 1
                                } : null,
                                fee: {
                                    maker: parseFloat(pair.maker_fee_rate) || 0.002,
                                    taker: parseFloat(pair.taker_fee_rate) || 0.002
                                }
                            });
                        });
                    }
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
    async getBalance(accountType = 'spot', currency = null) {
        return await this.executeWithRetry(async () => {
            const timestamp = Math.floor(Date.now() / 1000).toString();
            let path, method = 'GET';

            switch (accountType) {
                case 'spot':
                    path = this.endpoints.methods.spotAccounts.path;
                    break;
                case 'margin':
                    path = this.endpoints.methods.marginAccounts.path;
                    break;
                case 'futures':
                    path = this.endpoints.methods.futuresAccounts.path;
                    break;
                default:
                    throw new Error(`نوع الحساب غير مدعوم: ${accountType}`);
            }

            const queryString = currency ? `currency=${currency}` : '';
            const signature = this.createGateioSignature(method, path, queryString, '', timestamp);

            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature),
                    params: currency ? { currency } : {}
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

        if (Array.isArray(data)) {
            data.forEach(account => {
                const currency = account.currency || account.asset;
                const available = parseFloat(account.available || account.free || 0);
                const locked = parseFloat(account.locked || account.locked_balance || 0);
                const total = available + locked;
                
                if (total > 0 || locked > 0) {
                    balances[currency] = { 
                        free: available,
                        locked: locked,
                        total: total,
                        accountType: accountType
                    };

                    // إضافة حقول إضافية بناءً على نوع الحساب
                    if (accountType === 'margin') {
                        balances[currency].borrowed = parseFloat(account.borrowed || 0);
                        balances[currency].interest = parseFloat(account.interest || 0);
                    } else if (accountType === 'futures') {
                        balances[currency].positionMargin = parseFloat(account.position_margin || 0);
                        balances[currency].orderMargin = parseFloat(account.order_margin || 0);
                        balances[currency].unrealizedPnl = parseFloat(account.unrealised_pnl || 0);
                    }

                    this.updateBalance(currency, total);
                }
            });
        }

        return balances;
    }

    // === إدارة الطلبات ===
    async createOrder(orderData) {
        this.validateOrderData(orderData);

        return await this.executeWithRetry(async () => {
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const method = 'POST';
            let path, body;

            // تحديد المسار والبيانات بناءً على نوع الحساب
            switch (orderData.accountType || 'spot') {
                case 'spot':
                    path = this.endpoints.methods.spotOrders.path;
                    body = {
                        currency_pair: this.formatSymbol(orderData.symbol, 'spot'),
                        side: orderData.side.toLowerCase(),
                        type: orderData.type.toLowerCase(),
                        amount: orderData.quantity.toString(),
                        text: `t-${uuidv4().split('-')[0]}`,
                        time_in_force: orderData.timeInForce || 'gtc'
                    };
                    break;
                case 'margin':
                    path = this.endpoints.methods.marginOrders.path;
                    body = {
                        currency_pair: this.formatSymbol(orderData.symbol, 'margin'),
                        side: orderData.side.toLowerCase(),
                        type: orderData.type.toLowerCase(),
                        amount: orderData.quantity.toString(),
                        text: `t-${uuidv4().split('-')[0]}`,
                        time_in_force: orderData.timeInForce || 'gtc'
                    };
                    break;
                case 'futures':
                    path = this.endpoints.methods.futuresOrders.path;
                    body = {
                        contract: this.formatSymbol(orderData.symbol, 'futures'),
                        size: orderData.quantity,
                        price: orderData.price?.toString(),
                        text: `t-${uuidv4().split('-')[0]}`
                    };
                    break;
                default:
                    throw new Error(`نوع الحساب غير مدعوم: ${orderData.accountType}`);
            }

            // إضافة معاملات إضافية بناءً على نوع الطلب
            if (orderData.type === 'limit') {
                body.price = orderData.price.toString();
            }

            if (orderData.stopPrice) {
                body.stop_price = orderData.stopPrice.toString();
            }

            if (orderData.iceberg) {
                body.iceberg = orderData.iceberg.toString();
            }

            if (orderData.autoBorrow) {
                body.auto_borrow = orderData.autoBorrow;
            }

            if (orderData.reduceOnly !== undefined) {
                body.reduce_only = orderData.reduceOnly;
            }

            if (orderData.closePosition !== undefined) {
                body.close = orderData.closePosition;
            }

            const bodyString = JSON.stringify(body);
            const signature = this.createGateioSignature(method, path, '', bodyString, timestamp);

            const response = await this.axiosInstance.post(
                `${this.endpoints.base}${path}`,
                body,
                {
                    headers: this.getAuthHeaders(timestamp, signature, 'application/json')
                }
            );

            const orderResult = this.formatOrderResponse(response.data, orderData.accountType || 'spot');
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
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const method = 'DELETE';
            const path = this.endpoints.methods.orderCancel.path;
            
            const queryString = `currency_pair=${this.formatSymbol(orderData.symbol, orderData.accountType || 'spot')}&order_id=${orderData.orderId}`;
            const signature = this.createGateioSignature(method, path, queryString, '', timestamp);

            const response = await this.axiosInstance.delete(
                `${this.endpoints.base}${path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature),
                    params: {
                        currency_pair: this.formatSymbol(orderData.symbol, orderData.accountType || 'spot'),
                        order_id: orderData.orderId
                    }
                }
            );

            const cancelledOrder = this.formatOrderResponse(response.data, orderData.accountType || 'spot');

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
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const method = 'GET';
            const path = this.endpoints.methods.orderDetail.path;
            
            const queryString = `currency_pair=${this.formatSymbol(orderData.symbol, orderData.accountType || 'spot')}&order_id=${orderData.orderId}`;
            const signature = this.createGateioSignature(method, path, queryString, '', timestamp);

            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature),
                    params: {
                        currency_pair: this.formatSymbol(orderData.symbol, orderData.accountType || 'spot'),
                        order_id: orderData.orderId
                    }
                }
            );

            return this.formatOrderResponse(response.data, orderData.accountType || 'spot');
        }, 'getOrder');
    }

    async getOpenOrders(accountType = 'spot', symbol = null) {
        return await this.executeWithRetry(async () => {
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const method = 'GET';
            let path;

            switch (accountType) {
                case 'spot':
                    path = this.endpoints.methods.openOrders.path;
                    break;
                case 'margin':
                    path = this.endpoints.methods.marginOpenOrders.path;
                    break;
                default:
                    throw new Error(`نوع الحساب غير مدعوم: ${accountType}`);
            }

            const queryString = symbol ? `currency_pair=${this.formatSymbol(symbol, accountType)}` : '';
            const signature = this.createGateioSignature(method, path, queryString, '', timestamp);

            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature),
                    params: symbol ? { currency_pair: this.formatSymbol(symbol, accountType) } : {}
                }
            );

            return Array.isArray(response.data) 
                ? response.data.map(order => this.formatOrderResponse(order, accountType))
                : [this.formatOrderResponse(response.data, accountType)];
        }, 'getOpenOrders');
    }

    // === إدارة المراكز (للعقود الآجلة) ===
    async getPositions(settle = 'usdt') {
        return await this.executeWithRetry(async () => {
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const method = 'GET';
            const path = this.endpoints.methods.futuresPositions.path;
            
            const queryString = `settle=${settle}`;
            const signature = this.createGateioSignature(method, path, queryString, '', timestamp);

            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature),
                    params: { settle }
                }
            );

            return response.data.map(position => ({
                contract: position.contract,
                size: parseFloat(position.size),
                leverage: parseFloat(position.leverage),
                entryPrice: parseFloat(position.entry_price),
                markPrice: parseFloat(position.mark_price),
                liquidationPrice: parseFloat(position.liq_price),
                margin: parseFloat(position.margin),
                unrealizedPnl: parseFloat(position.unrealised_pnl),
                realizedPnl: parseFloat(position.realised_pnl),
                historyPnl: parseFloat(position.history_pnl),
                lastClosePnl: parseFloat(position.last_close_pnl),
                adlRanking: position.adl_ranking,
                pendingOrders: parseInt(position.pending_orders),
                openOrderMargin: parseFloat(position.open_order_margin),
                mode: position.mode,
                crossLeverageLimit: parseFloat(position.cross_leverage_limit)
            }));
        }, 'getPositions');
    }

    // === إدارة القروض (للهامش) ===
    async getLoanRecords(currencyPair, status = 'open') {
        return await this.executeWithRetry(async () => {
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const method = 'GET';
            const path = this.endpoints.methods.loanRecords.path;
            
            const queryString = `currency_pair=${this.formatSymbol(currencyPair, 'margin')}&status=${status}`;
            const signature = this.createGateioSignature(method, path, queryString, '', timestamp);

            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature),
                    params: {
                        currency_pair: this.formatSymbol(currencyPair, 'margin'),
                        status
                    }
                }
            );

            return response.data.map(loan => ({
                id: loan.id,
                currency: loan.currency,
                rate: parseFloat(loan.rate),
                amount: parseFloat(loan.amount),
                days: parseInt(loan.days),
                autoRenew: loan.auto_renew,
                borrowTime: new Date(parseInt(loan.create_time) * 1000),
                status: loan.status,
                repaid: parseFloat(loan.repaid),
                principalRepaid: parseFloat(loan.principal_repaid),
                interestRepaid: parseFloat(loan.interest_repaid)
            }));
        }, 'getLoanRecords');
    }

    // === بيانات السوق ===
    async getMarkets(marketType = null) {
        if (marketType) {
            const markets = {};
            for (const [key, market] of this.supportedMarkets) {
                if (key.startsWith(marketType)) {
                    markets[market.id] = market;
                }
            }
            return markets;
        }
        
        return Object.fromEntries(this.supportedMarkets);
    }

    async getTicker(symbol, marketType = 'spot') {
        return await this.executeWithRetry(async () => {
            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${this.endpoints.methods.tickers.path}`,
                {
                    params: { 
                        currency_pair: this.formatSymbol(symbol, marketType)
                    }
                }
            );

            const data = response.data[0];
            return {
                symbol: symbol,
                marketType: marketType,
                lastPrice: parseFloat(data.last),
                change: parseFloat(data.change_percentage),
                changePercent: parseFloat(data.change_percentage),
                baseVolume: parseFloat(data.base_volume),
                quoteVolume: parseFloat(data.quote_volume),
                high24h: parseFloat(data.high_24h),
                low24h: parseFloat(data.low_24h),
                bid: parseFloat(data.highest_bid),
                ask: parseFloat(data.lowest_ask),
                spread: parseFloat(data.lowest_ask) - parseFloat(data.highest_bid),
                timestamp: new Date()
            };
        }, 'getTicker');
    }

    async getOrderBook(symbol, marketType = 'spot', limit = 100) {
        return await this.executeWithRetry(async () => {
            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${this.endpoints.methods.orderbook.path}`,
                {
                    params: { 
                        currency_pair: this.formatSymbol(symbol, marketType),
                        limit: limit
                    }
                }
            );

            return {
                symbol: symbol,
                marketType: marketType,
                bids: response.data.bids.map(bid => [parseFloat(bid[0]), parseFloat(bid[1])]),
                asks: response.data.asks.map(ask => [parseFloat(ask[0]), parseFloat(ask[1])]),
                timestamp: new Date(parseInt(response.data.update) * 1000),
                sequence: response.data.id
            };
        }, 'getOrderBook');
    }

    async getCandles(symbol, marketType = 'spot', interval = '1m', limit = 100) {
        return await this.executeWithRetry(async () => {
            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${this.endpoints.methods.candles.path}`,
                {
                    params: { 
                        currency_pair: this.formatSymbol(symbol, marketType),
                        interval: interval,
                        limit: limit
                    }
                }
            );

            return response.data.map(candle => ({
                timestamp: new Date(parseInt(candle[0]) * 1000),
                volume: parseFloat(candle[1]),
                close: parseFloat(candle[2]),
                high: parseFloat(candle[3]),
                low: parseFloat(candle[4]),
                open: parseFloat(candle[5]),
                amount: parseFloat(candle[6])
            }));
        }, 'getCandles');
    }

    // === دوال المساعدة ===
    createGateioSignature(method, path, queryString, body, timestamp) {
        const hashedBody = crypto.createHash('sha512').update(body).digest('hex');
        const payload = [method, path, queryString, hashedBody, timestamp].join('\n');
        
        return crypto
            .createHmac('sha512', this.credentials.secret)
            .update(payload)
            .digest('hex');
    }

    getAuthHeaders(timestamp, signature, contentType = '') {
        const headers = {
            'KEY': this.credentials.apiKey,
            'Timestamp': timestamp,
            'SIGN': signature
        };

        if (contentType) {
            headers['Content-Type'] = contentType;
        }

        return headers;
    }

    formatOrderResponse(order, accountType) {
        const baseOrder = {
            orderId: order.id,
            clientOrderId: order.text,
            symbol: order.currency_pair || order.contract,
            accountType: accountType,
            side: order.side,
            type: order.type,
            quantity: parseFloat(order.amount || order.size),
            executed: parseFloat(order.filled_total || order.fill_price || 0),
            price: parseFloat(order.price || 0),
            avgPrice: parseFloat(order.avg_deal_price || 0),
            status: this.mapOrderStatus(order.status),
            timeInForce: order.time_in_force,
            createdTime: new Date(parseInt(order.create_time || order.create_time_ms)),
            updatedTime: new Date(parseInt(order.update_time || order.update_time_ms)),
            fee: parseFloat(order.fee || 0),
            feeCurrency: order.fee_currency
        };

        // إضافة حقول إضافية بناءً على نوع الحساب
        if (accountType === 'margin') {
            baseOrder.autoBorrow = order.auto_borrow || false;
            baseOrder.left = parseFloat(order.left || 0);
        } else if (accountType === 'futures') {
            baseOrder.contract = order.contract;
            baseOrder.size = parseFloat(order.size);
            baseOrder.iceberg = parseFloat(order.iceberg || 0);
            baseOrder.tif = order.tif;
            baseOrder.isClose = order.is_close || false;
            baseOrder.isReduceOnly = order.is_reduce_only || false;
            baseOrder.isLiq = order.is_liq || false;
        }

        return baseOrder;
    }

    mapOrderStatus(status) {
        const statusMap = {
            'open': 'open',
            'closed': 'filled',
            'cancelled': 'cancelled',
            'finished': 'filled',
            'partially_filled': 'partial',
            'pending': 'open',
            'filled': 'filled'
        };
        return statusMap[status] || status;
    }

    mapMarketStatus(status) {
        const statusMap = {
            'tradable': 'active',
            'untradable': 'inactive',
            'enabled': 'active',
            'disabled': 'inactive',
            true: 'active',
            false: 'inactive'
        };
        return statusMap[status] || status;
    }

    formatSymbol(symbol, marketType) {
        return symbol.replace('/', '_').toUpperCase();
    }

    parseSymbol(symbol) {
        return symbol.replace('_', '/');
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
        // Gate.io توفر نقاط نهاية للسيولة والعروض
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

module.exports = GateioService;