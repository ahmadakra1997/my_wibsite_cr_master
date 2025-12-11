// backend/clients/exchanges/exchanges/OKXService.js - النسخة المتقدمة والمحسنة
const BaseExchangeService = require('../BaseExchangeService');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class OKXService extends BaseExchangeService {
    constructor(credentials, options = {}) {
        super(credentials, {
            baseUrl: 'https://www.okx.com',
            apiVersion: 'v5',
            rateLimit: 12,
            precision: 8,
            supportedFeatures: ['spot', 'margin', 'future', 'option', 'swap', 'trading_bot', 'earn', 'defi'],
            ...options
        });
        
        this.name = 'OKX';
        this.requiresSignatures = true;
        this.requiresPassphrase = true;
        this.supportedMarkets = new Map();
        this.accountTypes = new Set(['spot', 'margin', 'futures', 'option', 'swap', 'funding']);
        this.currentAccountType = 'spot';
        
        this.initializeEndpoints();
        this.initializeMarketInfo();
    }

    // === تهيئة النقاط النهائية وإعدادات المنصة ===
    initializeEndpoints() {
        this.endpoints = {
            base: 'https://www.okx.com',
            methods: {
                // النقاط النهائية العامة
                time: { method: 'GET', path: '/api/v5/public/time', auth: false },
                instruments: { method: 'GET', path: '/api/v5/public/instruments', auth: false },
                tickers: { method: 'GET', path: '/api/v5/market/tickers', auth: false },
                orderbook: { method: 'GET', path: '/api/v5/market/books', auth: false },
                candles: { method: 'GET', path: '/api/v5/market/candles', auth: false },
                funding: { method: 'GET', path: '/api/v5/public/funding-rate', auth: false },
                openInterest: { method: 'GET', path: '/api/v5/public/open-interest', auth: false },
                
                // النقاط النهائية الخاصة - الحساب
                balance: { method: 'GET', path: '/api/v5/account/balance', auth: true },
                positions: { method: 'GET', path: '/api/v5/account/positions', auth: true },
                bills: { method: 'GET', path: '/api/v5/account/bills', auth: true },
                config: { method: 'GET', path: '/api/v5/account/config', auth: true },
                leverage: { method: 'GET', path: '/api/v5/account/leverage-info', auth: true },
                
                // النقاط النهائية الخاصة - التداول
                order: { method: 'POST', path: '/api/v5/trade/order', auth: true },
                batchOrders: { method: 'POST', path: '/api/v5/trade/batch-orders', auth: true },
                cancelOrder: { method: 'POST', path: '/api/v5/trade/cancel-order', auth: true },
                cancelBatchOrders: { method: 'POST', path: '/api/v5/trade/cancel-batch-orders', auth: true },
                orderDetail: { method: 'GET', path: '/api/v5/trade/order', auth: true },
                openOrders: { method: 'GET', path: '/api/v5/trade/orders-pending', auth: true },
                orderHistory: { method: 'GET', path: '/api/v5/trade/orders-history', auth: true },
                fills: { method: 'GET', path: '/api/v5/trade/fills', auth: true },
                
                // النقاط النهائية الخاصة - التمويل
                depositAddress: { method: 'GET', path: '/api/v5/asset/deposit-address', auth: true },
                withdrawal: { method: 'POST', path: '/api/v5/asset/withdrawal', auth: true },
                transfer: { method: 'POST', path: '/api/v5/asset/transfer', auth: true },
                
                // النقاط النهائية الخاصة - التداول الآلي
                gridOrder: { method: 'POST', path: '/api/v5/tradingBot/grid/order-algo', auth: true },
                gridAdjust: { method: 'POST', path: '/api/v5/tradingBot/grid/adjust-order-algo', auth: true },
                gridStop: { method: 'POST', path: '/api/v5/tradingBot/grid/stop-order-algo', auth: true },
                gridOrders: { method: 'GET', path: '/api/v5/tradingBot/grid/orders-algo-pending', auth: true }
            }
        };
    }

    initializeMarketInfo() {
        this.marketConfigs = {
            'spot': {
                name: 'التداول الفوري',
                orderTypes: ['limit', 'market', 'post_only', 'fok', 'ioc'],
                timeInForce: ['GTC', 'IOC', 'FOK'],
                accountTypes: ['spot'],
                settlement: 'instant'
            },
            'margin': {
                name: 'الهامش',
                orderTypes: ['limit', 'market', 'post_only', 'fok', 'ioc'],
                timeInForce: ['GTC', 'IOC', 'FOK'],
                accountTypes: ['margin'],
                modes: ['cross', 'isolated']
            },
            'future': {
                name: 'العقود الآجلة',
                orderTypes: ['limit', 'market', 'post_only', 'fok', 'ioc'],
                timeInForce: ['GTC', 'IOC', 'FOK'],
                accountTypes: ['futures'],
                settlement: ['USDT', 'USD'],
                types: ['linear', 'inverse']
            },
            'swap': {
                name: 'المقايضات',
                orderTypes: ['limit', 'market', 'post_only', 'fok', 'ioc'],
                timeInForce: ['GTC', 'IOC', 'FOK'],
                accountTypes: ['swap'],
                settlement: 'perpetual'
            },
            'option': {
                name: 'الخيارات',
                orderTypes: ['limit', 'market', 'post_only', 'fok', 'ioc'],
                timeInForce: ['GTC', 'IOC', 'FOK'],
                accountTypes: ['option'],
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
            
            if (response.data.code !== '0') {
                throw new Error(response.data.msg || 'فشل اختبار الاتصال');
            }
            
            return response.data;
        }, 'testConnection');
    }

    async loadAccountInfo() {
        try {
            // اختبار الحسابات المتاحة
            const accountTests = [
                this.getBalance().then(() => 'spot').catch(() => null),
                this.getPositions().then(() => 'futures').catch(() => null)
            ];

            const results = await Promise.allSettled(accountTests);
            const availableAccounts = results
                .filter(result => result.status === 'fulfilled' && result.value)
                .map(result => result.value);

            this.accountTypes = new Set(['spot', 'funding', ...availableAccounts]);
            
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
            const instrumentTypes = ['SPOT', 'MARGIN', 'FUTURES', 'SWAP', 'OPTION'];
            
            for (const instType of instrumentTypes) {
                try {
                    const response = await this.axiosInstance.get(
                        `${this.endpoints.base}${this.endpoints.methods.instruments.path}`,
                        { params: { instType } }
                    );

                    if (response.data.code === '0' && response.data.data) {
                        response.data.data.forEach(instrument => {
                            const marketKey = `${instType.toLowerCase()}:${instrument.instId}`;
                            
                            this.supportedMarkets.set(marketKey, {
                                instId: instrument.instId,
                                type: instType.toLowerCase(),
                                base: instrument.baseCcy,
                                quote: instrument.quoteCcy,
                                settle: instrument.settleCcy,
                                status: instrument.state === 'live' ? 'active' : 'inactive',
                                listing: instrument.listTime ? new Date(parseInt(instrument.listTime)) : null,
                                expiration: instrument.expTime ? new Date(parseInt(instrument.expTime)) : null,
                                precision: {
                                    price: this.getPrecision(instrument.tickSz),
                                    quantity: this.getPrecision(instrument.lotSz),
                                    base: this.getPrecision(instrument.minSz)
                                },
                                limits: {
                                    minSize: parseFloat(instrument.minSz),
                                    maxSize: parseFloat(instrument.maxSz),
                                    minNotional: parseFloat(instrument.minNotional) || 0
                                },
                                contract: instrument.ctVal ? {
                                    value: parseFloat(instrument.ctVal),
                                    multiplier: parseFloat(instrument.ctMult) || 1,
                                    currency: instrument.ctValCcy
                                } : null,
                                category: instrument.category,
                                option: instrument.optType ? {
                                    type: instrument.optType,
                                    strike: parseFloat(instrument.stk)
                                } : null
                            });
                        });
                    }
                } catch (error) {
                    console.warn(`⚠️ فشل تحميل معلومات السوق للنوع ${instType}:`, error.message);
                }
            }

            this.emit('markets_loaded', {
                exchange: this.name,
                count: this.supportedMarkets.size,
                types: instrumentTypes.map(t => t.toLowerCase()).filter(type => 
                    Array.from(this.supportedMarkets.keys()).some(key => key.startsWith(type))
                ),
                timestamp: new Date()
            });

        } catch (error) {
            this.handleError('MARKET_INFO_LOAD_FAILED', error);
        }
    }

    // === إدارة الرصيد ===
    async getBalance(ccy = null) {
        return await this.executeWithRetry(async () => {
            const timestamp = this.getISOTimestamp();
            const method = 'GET';
            const path = this.endpoints.methods.balance.path;
            
            const params = {};
            if (ccy) {
                params.ccy = ccy;
            }

            const signature = this.createOKXSignature(timestamp, method, path, params);

            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature),
                    params
                }
            );

            if (response.data.code !== '0') {
                throw new Error(response.data.msg || 'فشل جلب الرصيد');
            }

            const balances = this.formatBalanceResponse(response.data.data);
            
            this.emit('balance_loaded', {
                exchange: this.name,
                balances,
                timestamp: new Date()
            });

            return balances;
        }, 'getBalance');
    }

    formatBalanceResponse(data) {
        const balances = {};

        if (data && data.length > 0) {
            data.forEach(account => {
                if (account.details) {
                    account.details.forEach(detail => {
                        const total = parseFloat(detail.eq) || 0;
                        const available = parseFloat(detail.availBal) || 0;
                        const frozen = parseFloat(detail.frozenBal) || 0;
                        
                        if (total > 0 || frozen > 0) {
                            balances[detail.ccy] = { 
                                free: available,
                                locked: frozen,
                                total: total,
                                availableEq: parseFloat(detail.availEq) || 0,
                                isoEq: parseFloat(detail.isoEq) || 0,
                                adjEq: parseFloat(detail.adjEq) || 0,
                                ordFrozen: parseFloat(detail.ordFrozen) || 0,
                                liab: parseFloat(detail.liab) || 0,
                                upl: parseFloat(detail.upl) || 0,
                                crossLiab: parseFloat(detail.crossLiab) || 0,
                                isoLiab: parseFloat(detail.isoLiab) || 0,
                                mgnRatio: parseFloat(detail.mgnRatio) || 0,
                                interest: parseFloat(detail.interest) || 0,
                                twap: parseFloat(detail.twap) || 0,
                                notionalLever: parseFloat(detail.notionalLever) || 0
                            };
                            this.updateBalance(detail.ccy, available);
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
            const timestamp = this.getISOTimestamp();
            const method = 'POST';
            const path = this.endpoints.methods.order.path;
            
            const params = {
                instId: this.formatSymbol(orderData.symbol, orderData.instType),
                tdMode: orderData.tdMode || 'cash',
                side: orderData.side.toLowerCase(),
                ordType: orderData.ordType || 'limit',
                sz: orderData.quantity.toString(),
                clOrdId: orderData.clientOrderId || `x-${uuidv4().split('-')[0]}`
            };

            // تحديد نوع الأداة بناءً على الرمز
            if (!orderData.instType) {
                const instType = this.detectInstrumentType(orderData.symbol);
                if (instType) {
                    params.instId = this.formatSymbol(orderData.symbol, instType);
                }
            }

            // إضافة معاملات إضافية بناءً على نوع الطلب
            if (orderData.ordType === 'limit') {
                params.px = orderData.price.toString();
            }

            if (orderData.reduceOnly !== undefined) {
                params.reduceOnly = orderData.reduceOnly;
            }

            if (orderData.tpTriggerPx) {
                params.tpTriggerPx = orderData.tpTriggerPx.toString();
                params.tpOrdPx = orderData.tpOrdPx.toString();
            }

            if (orderData.slTriggerPx) {
                params.slTriggerPx = orderData.slTriggerPx.toString();
                params.slOrdPx = orderData.slOrdPx.toString();
            }

            if (orderData.tpTriggerPxType) {
                params.tpTriggerPxType = orderData.tpTriggerPxType;
            }

            if (orderData.slTriggerPxType) {
                params.slTriggerPxType = orderData.slTriggerPxType;
            }

            // معاملات إضافية للعقود
            if (orderData.instType === 'FUTURES' || orderData.instType === 'SWAP') {
                if (orderData.posSide) {
                    params.posSide = orderData.posSide;
                }
            }

            // معاملات إضافية للخيارات
            if (orderData.instType === 'OPTION') {
                if (orderData.optType) {
                    // OKX يتطلب optType للخيارات
                }
            }

            const signature = this.createOKXSignature(timestamp, method, path, params);

            const response = await this.axiosInstance.post(
                `${this.endpoints.base}${path}`,
                params,
                {
                    headers: this.getAuthHeaders(timestamp, signature, 'application/json')
                }
            );

            if (response.data.code !== '0') {
                throw new Error(response.data.msg || 'فشل إنشاء الطلب');
            }

            const orderResult = this.formatOrderResponse(response.data.data[0], orderData);
            this.updateOrder(orderResult);

            this.emit('order_created', {
                exchange: this.name,
                orderId: orderResult.orderId,
                clientOrderId: orderResult.clientOrderId,
                symbol: orderData.symbol,
                side: orderData.side,
                type: orderData.ordType,
                instType: orderData.instType || 'SPOT',
                quantity: orderData.quantity,
                price: orderData.price,
                timestamp: new Date()
            });

            return orderResult;
        }, 'createOrder');
    }

    async cancelOrder(orderData) {
        return await this.executeWithRetry(async () => {
            const timestamp = this.getISOTimestamp();
            const method = 'POST';
            const path = this.endpoints.methods.cancelOrder.path;
            
            const params = {
                instId: this.formatSymbol(orderData.symbol, orderData.instType)
            };

            // إما ordId أو clOrdId
            if (orderData.orderId) {
                params.ordId = orderData.orderId;
            } else if (orderData.clientOrderId) {
                params.clOrdId = orderData.clientOrderId;
            } else {
                throw new Error('يجب توفير إما orderId أو clientOrderId');
            }

            const signature = this.createOKXSignature(timestamp, method, path, params);

            const response = await this.axiosInstance.post(
                `${this.endpoints.base}${path}`,
                params,
                {
                    headers: this.getAuthHeaders(timestamp, signature, 'application/json')
                }
            );

            if (response.data.code !== '0') {
                throw new Error(response.data.msg || 'فشل إلغاء الطلب');
            }

            const cancelledOrder = this.formatOrderResponse(response.data.data[0], orderData);

            this.emit('order_cancelled', {
                exchange: this.name,
                orderId: orderData.orderId,
                clientOrderId: orderData.clientOrderId,
                symbol: orderData.symbol,
                instType: orderData.instType || 'SPOT',
                timestamp: new Date()
            });

            return cancelledOrder;
        }, 'cancelOrder');
    }

    async getOrder(orderData) {
        return await this.executeWithRetry(async () => {
            const timestamp = this.getISOTimestamp();
            const method = 'GET';
            const path = this.endpoints.methods.orderDetail.path;
            
            const params = {
                instId: this.formatSymbol(orderData.symbol, orderData.instType)
            };

            if (orderData.orderId) {
                params.ordId = orderData.orderId;
            } else if (orderData.clientOrderId) {
                params.clOrdId = orderData.clientOrderId;
            } else {
                throw new Error('يجب توفير إما orderId أو clientOrderId');
            }

            const signature = this.createOKXSignature(timestamp, method, path, params);

            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature),
                    params
                }
            );

            if (response.data.code !== '0') {
                throw new Error(response.data.msg || 'فشل جلب الطلب');
            }

            return this.formatOrderResponse(response.data.data[0], orderData);
        }, 'getOrder');
    }

    async getOpenOrders(instType = 'SPOT', symbol = null) {
        return await this.executeWithRetry(async () => {
            const timestamp = this.getISOTimestamp();
            const method = 'GET';
            const path = this.endpoints.methods.openOrders.path;
            
            const params = {
                instType: instType
            };

            if (symbol) {
                params.instId = this.formatSymbol(symbol, instType);
            }

            const signature = this.createOKXSignature(timestamp, method, path, params);

            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature),
                    params
                }
            );

            if (response.data.code !== '0') {
                throw new Error(response.data.msg || 'فشل جلب الطلبات المفتوحة');
            }

            return response.data.data.map(order => 
                this.formatOrderResponse(order, { instType })
            );
        }, 'getOpenOrders');
    }

    // === إدارة المراكز ===
    async getPositions(instType = 'FUTURES', symbol = null) {
        return await this.executeWithRetry(async () => {
            const timestamp = this.getISOTimestamp();
            const method = 'GET';
            const path = this.endpoints.methods.positions.path;
            
            const params = {
                instType: instType
            };

            if (symbol) {
                params.instId = this.formatSymbol(symbol, instType);
            }

            const signature = this.createOKXSignature(timestamp, method, path, params);

            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature),
                    params
                }
            );

            if (response.data.code !== '0') {
                throw new Error(response.data.msg || 'فشل جلب المراكز');
            }

            return response.data.data.map(position => ({
                instId: position.instId,
                instType: position.instType,
                posSide: position.posSide,
                posId: position.posId,
                tradeId: position.tradeId,
                pos: parseFloat(position.pos),
                availPos: parseFloat(position.availPos),
                avgPx: parseFloat(position.avgPx),
                upl: parseFloat(position.upl),
                uplRatio: parseFloat(position.uplRatio),
                liqPx: parseFloat(position.liqPx),
                margin: parseFloat(position.margin),
                mgnRatio: parseFloat(position.mgnRatio),
                mgnMode: position.mgnMode,
                lever: parseFloat(position.lever),
                notionalUsd: parseFloat(position.notionalUsd),
                adl: parseFloat(position.adl),
                ccy: position.ccy,
                last: parseFloat(position.last),
                interest: parseFloat(position.interest),
                usdPx: parseFloat(position.usdPx),
                bePx: parseFloat(position.bePx),
                pTime: new Date(parseInt(position.pTime)),
                cTime: new Date(parseInt(position.cTime)),
                uTime: new Date(parseInt(position.uTime))
            }));
        }, 'getPositions');
    }

    // === إعدادات الحساب ===
    async getAccountConfig() {
        return await this.executeWithRetry(async () => {
            const timestamp = this.getISOTimestamp();
            const method = 'GET';
            const path = this.endpoints.methods.config.path;

            const signature = this.createOKXSignature(timestamp, method, path, {});

            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature)
                }
            );

            if (response.data.code !== '0') {
                throw new Error(response.data.msg || 'فشل جلب إعدادات الحساب');
            }

            return response.data.data[0];
        }, 'getAccountConfig');
    }

    async setLeverage(instId, lever, mgnMode, posSide = null) {
        return await this.executeWithRetry(async () => {
            const timestamp = this.getISOTimestamp();
            const method = 'POST';
            const path = '/api/v5/account/set-leverage';

            const params = {
                instId: instId,
                lever: lever.toString(),
                mgnMode: mgnMode
            };

            if (posSide) {
                params.posSide = posSide;
            }

            const signature = this.createOKXSignature(timestamp, method, path, params);

            const response = await this.axiosInstance.post(
                `${this.endpoints.base}${path}`,
                params,
                {
                    headers: this.getAuthHeaders(timestamp, signature, 'application/json')
                }
            );

            if (response.data.code !== '0') {
                throw new Error(response.data.msg || 'فشل تعيين الرافعة المالية');
            }

            this.emit('leverage_updated', {
                exchange: this.name,
                instId,
                lever,
                mgnMode,
                posSide,
                timestamp: new Date()
            });

            return response.data.data[0];
        }, 'setLeverage');
    }

    // === التداول الآلي (Grid Trading) ===
    async createGridOrder(gridData) {
        return await this.executeWithRetry(async () => {
            const timestamp = this.getISOTimestamp();
            const method = 'POST';
            const path = this.endpoints.methods.gridOrder.path;

            const params = {
                instId: gridData.instId,
                algoOrdType: 'grid',
                maxPx: gridData.maxPx.toString(),
                minPx: gridData.minPx.toString(),
                gridNum: gridData.gridNum.toString(),
                runType: gridData.runType || '1',
                tpTriggerPx: gridData.tpTriggerPx?.toString(),
                slTriggerPx: gridData.slTriggerPx?.toString(),
                tag: gridData.tag || 'QuantumAI'
            };

            if (gridData.quoteSz) {
                params.quoteSz = gridData.quoteSz.toString();
            } else if (gridData.baseSz) {
                params.baseSz = gridData.baseSz.toString();
            }

            const signature = this.createOKXSignature(timestamp, method, path, params);

            const response = await this.axiosInstance.post(
                `${this.endpoints.base}${path}`,
                params,
                {
                    headers: this.getAuthHeaders(timestamp, signature, 'application/json')
                }
            );

            if (response.data.code !== '0') {
                throw new Error(response.data.msg || 'فشل إنشاء أمر الشبكة');
            }

            this.emit('grid_order_created', {
                exchange: this.name,
                algoId: response.data.data[0].algoId,
                instId: gridData.instId,
                timestamp: new Date()
            });

            return response.data.data[0];
        }, 'createGridOrder');
    }

    // === بيانات السوق ===
    async getMarkets(instType = null) {
        if (instType) {
            const markets = {};
            for (const [key, market] of this.supportedMarkets) {
                if (key.startsWith(instType.toLowerCase())) {
                    markets[market.instId] = market;
                }
            }
            return markets;
        }
        
        return Object.fromEntries(this.supportedMarkets);
    }

    async getTicker(symbol, instType = 'SPOT') {
        return await this.executeWithRetry(async () => {
            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${this.endpoints.methods.tickers.path}`,
                {
                    params: { 
                        instId: this.formatSymbol(symbol, instType)
                    }
                }
            );

            if (response.data.code !== '0') {
                throw new Error(response.data.msg || 'فشل جلب بيانات التداول');
            }

            const data = response.data.data[0];
            return {
                instId: data.instId,
                instType: instType,
                last: parseFloat(data.last),
                lastSz: parseFloat(data.lastSz),
                askPx: parseFloat(data.askPx),
                askSz: parseFloat(data.askSz),
                bidPx: parseFloat(data.bidPx),
                bidSz: parseFloat(data.bidSz),
                open24h: parseFloat(data.open24h),
                high24h: parseFloat(data.high24h),
                low24h: parseFloat(data.low24h),
                vol24h: parseFloat(data.vol24h),
                volCcy24h: parseFloat(data.volCcy24h),
                sodUtc0: parseFloat(data.sodUtc0),
                sodUtc8: parseFloat(data.sodUtc8),
                ts: new Date(parseInt(data.ts))
            };
        }, 'getTicker');
    }

    async getOrderBook(symbol, instType = 'SPOT', sz = 400) {
        return await this.executeWithRetry(async () => {
            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${this.endpoints.methods.orderbook.path}`,
                {
                    params: { 
                        instId: this.formatSymbol(symbol, instType),
                        sz: sz
                    }
                }
            );

            if (response.data.code !== '0') {
                throw new Error(response.data.msg || 'فشل جلب سجل الطلبات');
            }

            const data = response.data.data[0];
            return {
                instId: data.instId,
                instType: instType,
                bids: data.bids.map(bid => [parseFloat(bid[0]), parseFloat(bid[1]), parseInt(bid[2])]),
                asks: data.asks.map(ask => [parseFloat(ask[0]), parseFloat(ask[1]), parseInt(ask[2])]),
                ts: new Date(parseInt(data.ts))
            };
        }, 'getOrderBook');
    }

    async getCandles(symbol, instType = 'SPOT', bar = '15m', limit = 100) {
        return await this.executeWithRetry(async () => {
            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${this.endpoints.methods.candles.path}`,
                {
                    params: { 
                        instId: this.formatSymbol(symbol, instType),
                        bar: bar,
                        limit: limit
                    }
                }
            );

            if (response.data.code !== '0') {
                throw new Error(response.data.msg || 'فشل جلب بيانات الشموع');
            }

            return response.data.data.map(candle => ({
                timestamp: new Date(parseInt(candle[0])),
                open: parseFloat(candle[1]),
                high: parseFloat(candle[2]),
                low: parseFloat(candle[3]),
                close: parseFloat(candle[4]),
                volume: parseFloat(candle[5]),
                volumeCcy: parseFloat(candle[6]),
                confirm: candle[7] === '1'
            }));
        }, 'getCandles');
    }

    async getFundingRate(instId) {
        return await this.executeWithRetry(async () => {
            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${this.endpoints.methods.funding.path}`,
                {
                    params: { 
                        instId: instId
                    }
                }
            );

            if (response.data.code !== '0') {
                throw new Error(response.data.msg || 'فشل جلب معدل التمويل');
            }

            const data = response.data.data[0];
            return {
                instId: data.instId,
                fundingRate: parseFloat(data.fundingRate),
                nextFundingRate: parseFloat(data.nextFundingRate),
                fundingTime: new Date(parseInt(data.fundingTime)),
                nextFundingTime: new Date(parseInt(data.nextFundingTime))
            };
        }, 'getFundingRate');
    }

    // === دوال المساعدة ===
    getISOTimestamp() {
        return new Date().toISOString();
    }

    createOKXSignature(timestamp, method, path, params = {}) {
        let message = '';

        if (method === 'GET') {
            const queryString = Object.keys(params)
                .sort()
                .map(key => `${key}=${params[key]}`)
                .join('&');
            message = timestamp + method + path + (queryString ? `?${queryString}` : '');
        } else {
            message = timestamp + method + path + JSON.stringify(params);
        }

        return crypto
            .createHmac('sha256', this.credentials.secret)
            .update(message)
            .digest('base64');
    }

    getAuthHeaders(timestamp, signature, contentType = '') {
        const headers = {
            'OK-ACCESS-KEY': this.credentials.apiKey,
            'OK-ACCESS-SIGN': signature,
            'OK-ACCESS-TIMESTAMP': timestamp,
            'OK-ACCESS-PASSPHRASE': this.credentials.passphrase
        };

        if (contentType) {
            headers['Content-Type'] = contentType;
        }

        return headers;
    }

    formatOrderResponse(order, orderData = {}) {
        const baseOrder = {
            orderId: order.ordId,
            clientOrderId: order.clOrdId,
            instId: order.instId,
            instType: order.instType || orderData.instType || 'SPOT',
            side: order.side,
            ordType: order.ordType,
            quantity: parseFloat(order.sz),
            executed: parseFloat(order.accFillSz),
            price: parseFloat(order.px || 0),
            avgPrice: parseFloat(order.avgPx || 0),
            status: this.mapOrderStatus(order.state),
            timeInForce: order.tgtCcy || 'GTC',
            createdTime: new Date(parseInt(order.cTime)),
            updatedTime: new Date(parseInt(order.uTime)),
            fee: parseFloat(order.fee || 0),
            feeCurrency: order.feeCcy
        };

        // إضافة حقول إضافية بناءً على نوع الأداة
        if (order.instType === 'FUTURES' || order.instType === 'SWAP') {
            baseOrder.posSide = order.posSide;
            baseOrder.reduceOnly = order.reduceOnly || false;
            baseOrder.lever = parseFloat(order.lever || 1);
        }

        if (order.instType === 'OPTION') {
            baseOrder.optType = order.optType;
        }

        return baseOrder;
    }

    mapOrderStatus(status) {
        const statusMap = {
            'live': 'open',
            'partially_filled': 'partial',
            'filled': 'filled',
            'canceled': 'cancelled',
            'mmp_canceled': 'cancelled'
        };
        return statusMap[status] || status;
    }

    detectInstrumentType(symbol) {
        const formatted = this.formatSymbol(symbol, 'SPOT');
        
        for (const [key, market] of this.supportedMarkets) {
            if (market.instId === formatted) {
                return market.type.toUpperCase();
            }
        }
        
        return 'SPOT';
    }

    formatSymbol(symbol, instType) {
        if (instType === 'SPOT' || instType === 'MARGIN') {
            return symbol.replace('/', '-').toUpperCase();
        } else if (instType === 'FUTURES' || instType === 'SWAP') {
            return symbol.replace('/', '-').toUpperCase() + '-SWAP';
        } else if (instType === 'OPTION') {
            // تنسيق خاص للخيارات
            return symbol.toUpperCase();
        }
        return symbol.replace('/', '-').toUpperCase();
    }

    parseSymbol(symbol) {
        return symbol.replace('-', '/');
    }

    getPrecision(value) {
        if (!value) return 8;
        const decimal = value.toString().split('.')[1];
        return decimal ? decimal.length : 0;
    }

    // === التحقق من الصحة ===
    validateOrderData(orderData) {
        const required = ['symbol', 'side', 'quantity'];
        const missing = required.filter(field => !orderData[field]);
        
        if (missing.length > 0) {
            throw new Error(`بيانات الطلب ناقصة: ${missing.join(', ')}`);
        }

        if (orderData.ordType === 'limit' && !orderData.price) {
            throw new Error('سعر الطلب مطلوب لأوامر الحد');
        }

        if (orderData.quantity <= 0) {
            throw new Error('الكمية يجب أن تكون أكبر من الصفر');
        }

        if (orderData.price && orderData.price <= 0) {
            throw new Error('السعر يجب أن يكون أكبر من الصفر');
        }

        // التحقق من الرموز المدعومة
        const instType = orderData.instType || this.detectInstrumentType(orderData.symbol);
        const formattedSymbol = this.formatSymbol(orderData.symbol, instType);
        const marketKey = `${instType.toLowerCase()}:${formattedSymbol}`;
        
        if (!this.supportedMarkets.has(marketKey)) {
            throw new Error(`الرمز ${orderData.symbol} غير مدعوم أو غير نشط في نوع الأداة ${instType}`);
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
    async getLiquidity(symbol, instType = 'SPOT') {
        try {
            const orderbook = await this.getOrderBook(symbol, instType, 50);
            
            const bidLiquidity = orderbook.bids.reduce((sum, bid) => sum + bid[0] * bid[1], 0);
            const askLiquidity = orderbook.asks.reduce((sum, ask) => sum + ask[0] * ask[1], 0);
            const spread = orderbook.asks[0][0] - orderbook.bids[0][0];
            const spreadPercent = (spread / orderbook.bids[0][0]) * 100;

            return {
                instId: orderbook.instId,
                instType: instType,
                bidLiquidity,
                askLiquidity,
                totalLiquidity: bidLiquidity + askLiquidity,
                spread,
                spreadPercent,
                bestBid: orderbook.bids[0][0],
                bestAsk: orderbook.asks[0][0],
                timestamp: orderbook.ts
            };
        } catch (error) {
            this.handleError('LIQUIDITY_CHECK_FAILED', error);
            throw error;
        }
    }
}

module.exports = OKXService;