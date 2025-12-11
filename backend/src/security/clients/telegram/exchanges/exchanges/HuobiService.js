// backend/clients/exchanges/exchanges/HuobiService.js - النسخة المتقدمة والمحسنة
const BaseExchangeService = require('../BaseExchangeService');
const crypto = require('crypto');
const querystring = require('querystring');
const { v4: uuidv4 } = require('uuid');

class HuobiService extends BaseExchangeService {
    constructor(credentials, options = {}) {
        super(credentials, {
            baseUrl: 'https://api.huobi.pro',
            apiVersion: 'v1',
            rateLimit: 10,
            precision: 8,
            supportedFeatures: ['spot', 'margin', 'futures', 'options', 'staking', 'mining'],
            ...options
        });
        
        this.name = 'Huobi Global';
        this.requiresSignatures = true;
        this.requiresPassphrase = false;
        this.supportedMarkets = new Map();
        this.accountTypes = new Set(['spot', 'margin', 'otc', 'point', 'super-margin', 'investment', 'borrow']);
        this.currentAccountType = 'spot';
        
        this.initializeEndpoints();
        this.initializeMarketInfo();
    }

    // === تهيئة النقاط النهائية وإعدادات المنصة ===
    initializeEndpoints() {
        this.endpoints = {
            base: 'https://api.huobi.pro',
            future: 'https://api.hbdm.com',
            swap: 'https://api.hbdm.com',
            options: 'https://api.hbdm.com',
            methods: {
                // النقاط النهائية العامة
                time: { method: 'GET', path: '/v1/common/timestamp', auth: false },
                symbols: { method: 'GET', path: '/v1/common/symbols', auth: false },
                currencies: { method: 'GET', path: '/v1/common/currencies', auth: false },
                marketStatus: { method: 'GET', path: '/v2/market-status', auth: false },
                tickers: { method: 'GET', path: '/market/tickers', auth: false },
                depth: { method: 'GET', path: '/market/depth', auth: false },
                merged: { method: 'GET', path: '/market/detail/merged', auth: false },
                history: { method: 'GET', path: '/market/history/kline', auth: false },
                trade: { method: 'GET', path: '/market/history/trade', auth: false },
                
                // النقاط النهائية الخاصة - Spot
                accounts: { method: 'GET', path: '/v1/account/accounts', auth: true },
                accountBalance: { method: 'GET', path: '/v1/account/accounts/{account-id}/balance', auth: true },
                orderPlace: { method: 'POST', path: '/v1/order/orders/place', auth: true },
                orderCancel: { method: 'POST', path: '/v1/order/orders/{order-id}/submitcancel', auth: true },
                orderDetail: { method: 'GET', path: '/v1/order/orders/{order-id}', auth: true },
                openOrders: { method: 'GET', path: '/v1/order/openOrders', auth: true },
                orderHistory: { method: 'GET', path: '/v1/order/history', auth: true },
                matchResults: { method: 'GET', path: '/v1/order/orders/{order-id}/matchresults', auth: true },
                
                // النقاط النهائية الخاصة - Margin
                marginBalance: { method: 'GET', path: '/v1/margin/accounts/balance', auth: true },
                marginLoan: { method: 'POST', path: '/v1/margin/orders', auth: true },
                marginRepay: { method: 'POST', path: '/v1/margin/orders/{order-id}/repay', auth: true },
                marginLoanOrders: { method: 'GET', path: '/v1/margin/loan-orders', auth: true },
                
                // النقاط النهائية الخاصة - Futures
                futureBalance: { method: 'GET', path: '/api/v1/contract_balance_valuation', auth: true },
                futurePositions: { method: 'GET', path: '/api/v1/contract_position_info', auth: true },
                futureOrder: { method: 'POST', path: '/api/v1/contract_order', auth: true },
                futureOrderCancel: { method: 'POST', path: '/api/v1/contract_cancel', auth: true }
            }
        };
    }

    initializeMarketInfo() {
        this.marketConfigs = {
            'spot': {
                name: 'التداول الفوري',
                orderTypes: ['buy-market', 'sell-market', 'buy-limit', 'sell-limit', 'buy-ioc', 'sell-ioc'],
                timeInForce: ['gtc', 'boc', 'ioc', 'fok'],
                accountTypes: ['spot', 'margin', 'super-margin']
            },
            'margin': {
                name: 'الهامش',
                orderTypes: ['buy-market', 'sell-market', 'buy-limit', 'sell-limit'],
                timeInForce: ['gtc'],
                accountTypes: ['margin']
            },
            'futures': {
                name: 'العقود الآجلة',
                orderTypes: ['open', 'close'],
                timeInForce: ['gtc', 'ioc', 'boc', 'fok'],
                accountTypes: ['futures']
            },
            'swap': {
                name: 'العقود الدائمة',
                orderTypes: ['open', 'close'],
                timeInForce: ['gtc', 'ioc', 'boc', 'fok'],
                accountTypes: ['swap']
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
            
            if (response.data.status !== 'ok') {
                throw new Error(response.data['err-msg'] || 'فشل اختبار الاتصال');
            }
            
            return response.data;
        }, 'testConnection');
    }

    async loadAccountInfo() {
        try {
            const accounts = await this.getAccounts();
            const accountTypes = new Set();
            
            accounts.forEach(account => {
                if (account.state === 'working') {
                    accountTypes.add(account.type);
                }
            });
            
            this.accountTypes = accountTypes;
            
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
            const marketTypes = ['spot', 'futures', 'swap'];
            
            for (const marketType of marketTypes) {
                try {
                    let response;
                    let symbols = [];

                    if (marketType === 'spot') {
                        response = await this.axiosInstance.get(
                            `${this.endpoints.base}${this.endpoints.methods.symbols.path}`
                        );
                        symbols = response.data.data || [];
                    } else {
                        // بالنسبة للعقود الآجلة والدائمة، نستخدم API مختلف
                        const contractType = marketType === 'futures' ? 'futures' : 'swap';
                        response = await this.axiosInstance.get(
                            `${this.endpoints.future}/api/v1/contract_contract_info`,
                            { params: { contract_type: contractType } }
                        );
                        symbols = response.data.data || [];
                    }

                    symbols.forEach(symbol => {
                        const marketKey = `${marketType}:${symbol.symbol}`;
                        
                        this.supportedMarkets.set(marketKey, {
                            symbol: symbol.symbol,
                            type: marketType,
                            base: symbol['base-currency'] || symbol.base_asset,
                            quote: symbol['quote-currency'] || symbol.quote_asset,
                            status: symbol.state === 'online' ? 'active' : 'inactive',
                            precision: {
                                price: symbol['price-precision'] || symbol.price_tick,
                                quantity: symbol['amount-precision'] || symbol.volume_precision
                            },
                            limits: {
                                minAmount: parseFloat(symbol['min-order-amt'] || symbol.min_volume) || 0,
                                maxAmount: parseFloat(symbol['max-order-amt'] || symbol.max_volume) || 0,
                                minValue: parseFloat(symbol['min-order-value'] || symbol.min_value) || 0,
                                minPrice: parseFloat(symbol['min-price']) || 0,
                                maxPrice: parseFloat(symbol['max-price']) || 0
                            },
                            leverage: symbol.leverage_rate ? {
                                min: parseFloat(symbol.leverage_rate.min) || 1,
                                max: parseFloat(symbol.leverage_rate.max) || 100
                            } : null,
                            fee: {
                                maker: parseFloat(symbol.maker_fee_rate) || 0.002,
                                taker: parseFloat(symbol.taker_fee_rate) || 0.002
                            },
                            delivery: symbol.delivery_date ? new Date(symbol.delivery_date) : null,
                            settlement: symbol.settlement_date ? new Date(symbol.settlement_date) : null
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

    // === إدارة الحسابات ===
    async getAccounts() {
        return await this.executeWithRetry(async () => {
            const timestamp = new Date().toISOString().split('.')[0] + 'Z';
            const method = 'GET';
            const path = this.endpoints.methods.accounts.path;
            
            const signature = this.createHuobiSignature(method, this.endpoints.base, path, {}, timestamp);

            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature),
                    params: {}
                }
            );

            if (response.data.status !== 'ok') {
                throw new Error(response.data['err-msg'] || 'فشل جلب الحسابات');
            }

            return response.data.data;
        }, 'getAccounts');
    }

    async getBalance(accountType = 'spot', accountId = null) {
        return await this.executeWithRetry(async () => {
            const timestamp = new Date().toISOString().split('.')[0] + 'Z';
            let path, method = 'GET';

            if (accountType === 'spot') {
                if (!accountId) {
                    const accounts = await this.getAccounts();
                    const spotAccount = accounts.find(acc => acc.type === 'spot' && acc.state === 'working');
                    if (!spotAccount) throw new Error('لم يتم العثور على حساب سبوت نشط');
                    accountId = spotAccount.id;
                }
                path = this.endpoints.methods.accountBalance.path.replace('{account-id}', accountId);
            } else if (accountType === 'margin') {
                path = this.endpoints.methods.marginBalance.path;
            } else if (accountType === 'futures') {
                path = this.endpoints.methods.futureBalance.path;
                return await this.getFutureBalance(); // معالجة منفصلة للعقود الآجلة
            } else {
                throw new Error(`نوع الحساب غير مدعوم: ${accountType}`);
            }

            const signature = this.createHuobiSignature(method, this.endpoints.base, path, {}, timestamp);

            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature),
                    params: {}
                }
            );

            if (response.data.status !== 'ok') {
                throw new Error(response.data['err-msg'] || 'فشل جلب الرصيد');
            }

            const balances = this.formatBalanceResponse(response.data.data, accountType);
            
            this.emit('balance_loaded', {
                exchange: this.name,
                accountType,
                accountId,
                balances,
                timestamp: new Date()
            });

            return balances;
        }, `getBalance_${accountType}`);
    }

    async getFutureBalance() {
        const timestamp = new Date().toISOString().split('.')[0] + 'Z';
        const method = 'GET';
        const path = this.endpoints.methods.futureBalance.path;
        
        const signature = this.createHuobiSignature(method, this.endpoints.future, path, {}, timestamp, 'future');

        const response = await this.axiosInstance.get(
            `${this.endpoints.future}${path}`,
            {
                headers: this.getAuthHeaders(timestamp, signature, 'future'),
                params: { valuation_asset: 'USDT' }
            }
        );

        if (response.data.status !== 'ok') {
            throw new Error(response.data['err-msg'] || 'فشل جلب رصيد العقود الآجلة');
        }

        return this.formatFutureBalanceResponse(response.data.data);
    }

    formatBalanceResponse(data, accountType) {
        const balances = {};

        if (accountType === 'spot' && data.list) {
            data.list.forEach(balance => {
                const currency = balance.currency;
                const type = balance.type;
                const amount = parseFloat(balance.balance);

                if (amount > 0) {
                    if (!balances[currency]) {
                        balances[currency] = { 
                            free: 0, 
                            locked: 0, 
                            total: 0,
                            accountType 
                        };
                    }

                    if (type === 'trade') {
                        balances[currency].free += amount;
                    } else if (type === 'frozen') {
                        balances[currency].locked += amount;
                    }

                    balances[currency].total = balances[currency].free + balances[currency].locked;
                    this.updateBalance(currency, balances[currency].free);
                }
            });
        } else if (accountType === 'margin' && data.list) {
            data.list.forEach(account => {
                const currency = account.currency;
                const total = parseFloat(account.balance);
                const available = parseFloat(account.available);
                const frozen = parseFloat(account.frozen);
                const loan = parseFloat(account.loan);
                const interest = parseFloat(account.interest);

                if (total > 0 || loan > 0) {
                    balances[currency] = {
                        free: available,
                        locked: frozen,
                        total: total,
                        loan: loan,
                        interest: interest,
                        net: total - loan,
                        accountType: 'margin'
                    };
                    this.updateBalance(currency, available);
                }
            });
        }

        return balances;
    }

    formatFutureBalanceResponse(data) {
        const balances = {};
        
        if (data && data.length > 0) {
            data.forEach(item => {
                balances[item.valuation_asset] = {
                    free: parseFloat(item.balance),
                    locked: 0,
                    total: parseFloat(item.balance),
                    profitUnreal: parseFloat(item.profit_unreal),
                    profitReal: parseFloat(item.profit_real),
                    riskRate: parseFloat(item.risk_rate),
                    liquidationPrice: parseFloat(item.liquidation_price),
                    adjustFactor: parseFloat(item.adjust_factor),
                    marginStatic: parseFloat(item.margin_static),
                    marginFrozen: parseFloat(item.margin_frozen),
                    marginBalance: parseFloat(item.margin_balance),
                    accountType: 'futures'
                };
                this.updateBalance(item.valuation_asset, parseFloat(item.balance));
            });
        }

        return balances;
    }

    // === إدارة الطلبات ===
    async createOrder(orderData) {
        this.validateOrderData(orderData);

        return await this.executeWithRetry(async () => {
            const timestamp = new Date().toISOString().split('.')[0] + 'Z';
            const method = 'POST';
            let path, params, baseUrl = this.endpoints.base;

            // تحديد نوع الحساب والمسار
            if (orderData.accountType === 'futures' || orderData.accountType === 'swap') {
                baseUrl = this.endpoints.future;
                path = this.endpoints.methods.futureOrder.path;
                
                params = {
                    contract_code: this.formatSymbol(orderData.symbol, orderData.accountType),
                    direction: orderData.side === 'buy' ? 'buy' : 'sell',
                    offset: orderData.offset || 'open',
                    lever_rate: orderData.leverage || 10,
                    order_price_type: orderData.type === 'market' ? 'optimal_5' : 'limit',
                    volume: orderData.quantity
                };

                if (orderData.type === 'limit') {
                    params.price = orderData.price;
                }

                if (orderData.clientOrderId) {
                    params.client_order_id = orderData.clientOrderId;
                }
            } else {
                // Spot أو Margin
                const accounts = await this.getAccounts();
                const targetAccount = accounts.find(acc => 
                    acc.type === (orderData.accountType || 'spot') && acc.state === 'working'
                );
                
                if (!targetAccount) {
                    throw new Error(`لم يتم العثور على حساب ${orderData.accountType || 'spot'} نشط`);
                }

                path = this.endpoints.methods.orderPlace.path;
                params = {
                    'account-id': targetAccount.id,
                    symbol: this.formatSymbol(orderData.symbol, 'spot'),
                    type: `${orderData.side}-${orderData.type}`,
                    amount: orderData.quantity.toString()
                };

                if (orderData.type === 'limit') {
                    params.price = orderData.price.toString();
                }

                if (orderData.clientOrderId) {
                    params['client-order-id'] = orderData.clientOrderId;
                }

                if (orderData.stopPrice) {
                    params['stop-price'] = orderData.stopPrice.toString();
                }

                if (orderData.operator) {
                    params.operator = orderData.operator;
                }
            }

            const signature = this.createHuobiSignature(
                method, 
                baseUrl, 
                path, 
                params, 
                timestamp,
                orderData.accountType === 'futures' ? 'future' : 'spot'
            );

            const response = await this.axiosInstance.post(
                `${baseUrl}${path}`,
                querystring.stringify(params),
                {
                    headers: this.getAuthHeaders(timestamp, signature, orderData.accountType === 'futures' ? 'future' : 'spot')
                }
            );

            if (response.data.status !== 'ok') {
                throw new Error(response.data['err-msg'] || 'فشل إنشاء الطلب');
            }

            const orderResult = this.formatOrderResponse(
                response.data.data, 
                orderData.accountType || 'spot',
                orderData
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
            const timestamp = new Date().toISOString().split('.')[0] + 'Z';
            const method = 'POST';
            let path, baseUrl = this.endpoints.base;

            if (orderData.accountType === 'futures' || orderData.accountType === 'swap') {
                baseUrl = this.endpoints.future;
                path = this.endpoints.methods.futureOrderCancel.path;
                
                const params = {
                    order_id: orderData.orderId,
                    contract_code: this.formatSymbol(orderData.symbol, orderData.accountType)
                };

                const signature = this.createHuobiSignature(method, baseUrl, path, params, timestamp, 'future');

                const response = await this.axiosInstance.post(
                    `${baseUrl}${path}`,
                    querystring.stringify(params),
                    {
                        headers: this.getAuthHeaders(timestamp, signature, 'future')
                    }
                );

                if (response.data.status !== 'ok') {
                    throw new Error(response.data['err-msg'] || 'فشل إلغاء الطلب');
                }

                return response.data.data;
            } else {
                path = this.endpoints.methods.orderCancel.path.replace('{order-id}', orderData.orderId);
                
                const signature = this.createHuobiSignature(method, baseUrl, path, {}, timestamp);

                const response = await this.axiosInstance.post(
                    `${baseUrl}${path}`,
                    {},
                    {
                        headers: this.getAuthHeaders(timestamp, signature)
                    }
                );

                if (response.data.status !== 'ok') {
                    throw new Error(response.data['err-msg'] || 'فشل إلغاء الطلب');
                }

                const cancelledOrder = this.formatOrderResponse(response.data.data, orderData.accountType || 'spot');

                this.emit('order_cancelled', {
                    exchange: this.name,
                    orderId: orderData.orderId,
                    symbol: orderData.symbol,
                    accountType: orderData.accountType || 'spot',
                    timestamp: new Date()
                });

                return cancelledOrder;
            }
        }, 'cancelOrder');
    }

    async getOrder(orderData) {
        return await this.executeWithRetry(async () => {
            const timestamp = new Date().toISOString().split('.')[0] + 'Z';
            const method = 'GET';
            let path, baseUrl = this.endpoints.base;

            if (orderData.accountType === 'futures' || orderData.accountType === 'swap') {
                // Huobi Futures يحتاج إلى نقطة نهائية مختلفة
                throw new Error('جلب تفاصيل طلب العقود الآجلة غير مدعوم حالياً');
            } else {
                path = this.endpoints.methods.orderDetail.path.replace('{order-id}', orderData.orderId);
                
                const signature = this.createHuobiSignature(method, baseUrl, path, {}, timestamp);

                const response = await this.axiosInstance.get(
                    `${baseUrl}${path}`,
                    {
                        headers: this.getAuthHeaders(timestamp, signature)
                    }
                );

                if (response.data.status !== 'ok') {
                    throw new Error(response.data['err-msg'] || 'فشل جلب الطلب');
                }

                return this.formatOrderResponse(response.data.data, orderData.accountType || 'spot');
            }
        }, 'getOrder');
    }

    async getOpenOrders(accountType = 'spot', symbol = null) {
        return await this.executeWithRetry(async () => {
            const timestamp = new Date().toISOString().split('.')[0] + 'Z';
            const method = 'GET';
            const path = this.endpoints.methods.openOrders.path;
            
            const accounts = await this.getAccounts();
            const targetAccount = accounts.find(acc => 
                acc.type === accountType && acc.state === 'working'
            );
            
            if (!targetAccount) {
                throw new Error(`لم يتم العثور على حساب ${accountType} نشط`);
            }

            const params = {
                'account-id': targetAccount.id
            };

            if (symbol) {
                params.symbol = this.formatSymbol(symbol, 'spot');
            }

            const signature = this.createHuobiSignature(method, this.endpoints.base, path, params, timestamp);

            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature),
                    params
                }
            );

            if (response.data.status !== 'ok') {
                throw new Error(response.data['err-msg'] || 'فشل جلب الطلبات المفتوحة');
            }

            return Array.isArray(response.data.data) 
                ? response.data.data.map(order => this.formatOrderResponse(order, accountType))
                : [this.formatOrderResponse(response.data.data, accountType)];
        }, 'getOpenOrders');
    }

    // === إدارة المراكز (للعقود الآجلة) ===
    async getPositions(contractType = 'futures', symbol = null) {
        return await this.executeWithRetry(async () => {
            const timestamp = new Date().toISOString().split('.')[0] + 'Z';
            const method = 'GET';
            const path = this.endpoints.methods.futurePositions.path;
            
            const params = {};
            if (symbol) {
                params.contract_code = this.formatSymbol(symbol, contractType);
            }

            const signature = this.createHuobiSignature(method, this.endpoints.future, path, params, timestamp, 'future');

            const response = await this.axiosInstance.get(
                `${this.endpoints.future}${path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature, 'future'),
                    params
                }
            );

            if (response.data.status !== 'ok') {
                throw new Error(response.data['err-msg'] || 'فشل جلب المراكز');
            }

            return response.data.data.map(position => ({
                symbol: position.contract_code,
                contractType: contractType,
                direction: position.direction,
                volume: parseFloat(position.volume),
                available: parseFloat(position.available),
                frozen: parseFloat(position.frozen),
                costOpen: parseFloat(position.cost_open),
                costHold: parseFloat(position.cost_hold),
                profitUnreal: parseFloat(position.profit_unreal),
                profitRate: parseFloat(position.profit_rate),
                profit: parseFloat(position.profit),
                positionMargin: parseFloat(position.position_margin),
                leverRate: parseFloat(position.lever_rate),
                marginMode: position.margin_mode,
                marginAccount: position.margin_account,
                tradePartition: position.trade_partition,
                liquidationPrice: parseFloat(position.liquidation_price),
                adlRiskPercent: parseFloat(position.adl_risk_percent)
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
            
            if (marketType === 'spot') {
                response = await this.axiosInstance.get(
                    `${this.endpoints.base}${this.endpoints.methods.merged.path}`,
                    {
                        params: { symbol: this.formatSymbol(symbol, marketType) }
                    }
                );
            } else {
                // للعقود الآجلة والدائمة
                const endpoint = marketType === 'futures' ? '/market/detail/merged' : '/swap-ex/market/detail/merged';
                response = await this.axiosInstance.get(
                    `${this.endpoints.future}${endpoint}`,
                    {
                        params: { contract_code: this.formatSymbol(symbol, marketType) }
                    }
                );
            }

            if (response.data.status !== 'ok') {
                throw new Error(response.data['err-msg'] || 'فشل جلب بيانات التداول');
            }

            const data = response.data.tick;
            return {
                symbol: symbol,
                marketType: marketType,
                lastPrice: parseFloat(data.close),
                open: parseFloat(data.open),
                high: parseFloat(data.high),
                low: parseFloat(data.low),
                volume: parseFloat(data.vol),
                amount: parseFloat(data.amount),
                count: data.count,
                bid: parseFloat(data.bid?.[0]) || parseFloat(data.bid_price),
                ask: parseFloat(data.ask?.[0]) || parseFloat(data.ask_price),
                bidSize: parseFloat(data.bid?.[1]) || parseFloat(data.bid_volume),
                askSize: parseFloat(data.ask?.[1]) || parseFloat(data.ask_volume),
                timestamp: new Date()
            };
        }, 'getTicker');
    }

    async getOrderBook(symbol, marketType = 'spot', depth = 'step0') {
        return await this.executeWithRetry(async () => {
            let response;
            
            if (marketType === 'spot') {
                response = await this.axiosInstance.get(
                    `${this.endpoints.base}${this.endpoints.methods.depth.path}`,
                    {
                        params: { 
                            symbol: this.formatSymbol(symbol, marketType),
                            type: depth
                        }
                    }
                );
            } else {
                // للعقود الآجلة والدائمة
                const endpoint = marketType === 'futures' ? '/market/depth' : '/swap-ex/market/depth';
                response = await this.axiosInstance.get(
                    `${this.endpoints.future}${endpoint}`,
                    {
                        params: { 
                            contract_code: this.formatSymbol(symbol, marketType),
                            type: depth
                        }
                    }
                );
            }

            if (response.data.status !== 'ok') {
                throw new Error(response.data['err-msg'] || 'فشل جلب سجل الطلبات');
            }

            const data = response.data.tick;
            return {
                symbol: symbol,
                marketType: marketType,
                bids: data.bids,
                asks: data.asks,
                timestamp: new Date(data.ts),
                version: data.version,
                ch: data.ch
            };
        }, 'getOrderBook');
    }

    async getKline(symbol, marketType = 'spot', period = '15min', size = 150) {
        return await this.executeWithRetry(async () => {
            let response;
            
            if (marketType === 'spot') {
                response = await this.axiosInstance.get(
                    `${this.endpoints.base}${this.endpoints.methods.history.path}`,
                    {
                        params: { 
                            symbol: this.formatSymbol(symbol, marketType),
                            period: period,
                            size: size
                        }
                    }
                );
            } else {
                // للعقود الآجلة والدائمة
                const endpoint = marketType === 'futures' ? '/market/history/kline' : '/swap-ex/market/history/kline';
                response = await this.axiosInstance.get(
                    `${this.endpoints.future}${endpoint}`,
                    {
                        params: { 
                            contract_code: this.formatSymbol(symbol, marketType),
                            period: period,
                            size: size
                        }
                    }
                );
            }

            if (response.data.status !== 'ok') {
                throw new Error(response.data['err-msg'] || 'فشل جلب بيانات الشموع');
            }

            return response.data.data.map(kline => ({
                timestamp: new Date(kline.id * 1000),
                open: parseFloat(kline.open),
                high: parseFloat(kline.high),
                low: parseFloat(kline.low),
                close: parseFloat(kline.close),
                volume: parseFloat(kline.vol),
                amount: parseFloat(kline.amount),
                count: kline.count
            }));
        }, 'getKline');
    }

    // === دوال المساعدة ===
    createHuobiSignature(method, baseUrl, path, params, timestamp, apiType = 'spot') {
        const host = baseUrl.replace('https://', '');
        const sortedParams = querystring.stringify(params);
        
        let payload;
        if (apiType === 'future') {
            // توقيع مختلف للعقود الآجلة
            payload = [
                method,
                host,
                path,
                timestamp,
                sortedParams
            ].join('\n');
        } else {
            payload = [
                method,
                host,
                path,
                sortedParams
            ].join('\n');
        }

        const hashedPayload = crypto.createHash('sha256').update(payload).digest('hex');
        const stringToSign = [
            method,
            host,
            path,
            timestamp,
            hashedPayload
        ].join('\n');

        return crypto
            .createHmac('sha256', this.credentials.secret)
            .update(stringToSign)
            .digest('base64');
    }

    getAuthHeaders(timestamp, signature, apiType = 'spot') {
        const headers = {
            'AccessKeyId': this.credentials.apiKey,
            'Signature': signature,
            'Timestamp': timestamp
        };

        if (apiType === 'future') {
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }

        return headers;
    }

    formatOrderResponse(order, accountType, orderData = {}) {
        const baseOrder = {
            orderId: order.toString(), // Huobi يرجع ID كسلسلة
            clientOrderId: orderData.clientOrderId,
            symbol: orderData.symbol,
            accountType: accountType,
            side: orderData.side,
            type: orderData.type,
            quantity: parseFloat(orderData.quantity),
            price: parseFloat(orderData.price || 0),
            status: 'submitted',
            createdTime: new Date(),
            updatedTime: new Date()
        };

        // إذا كان لدينا بيانات كاملة للطلب
        if (typeof order === 'object') {
            baseOrder.orderId = order.id.toString();
            baseOrder.clientOrderId = order['client-order-id'];
            baseOrder.symbol = order.symbol;
            baseOrder.side = order.type.split('-')[0];
            baseOrder.type = order.type.split('-')[1];
            baseOrder.quantity = parseFloat(order.amount);
            baseOrder.executed = parseFloat(order['field-amount']);
            baseOrder.price = parseFloat(order.price);
            baseOrder.avgPrice = parseFloat(order['field-cash-amount']) / parseFloat(order['field-amount']) || 0;
            baseOrder.status = this.mapOrderStatus(order.state);
            baseOrder.createdTime = new Date(order['created-at']);
            baseOrder.updatedTime = new Date(order['finished-at'] || order['canceled-at'] || order['created-at']);
            baseOrder.fee = parseFloat(order['field-fees']);
        }

        return baseOrder;
    }

    mapOrderStatus(status) {
        const statusMap = {
            'submitted': 'open',
            'partial-filled': 'partial',
            'filled': 'filled',
            'canceled': 'cancelled',
            'partial-canceled': 'partial-cancelled',
            'created': 'open',
            'rejected': 'rejected'
        };
        return statusMap[status] || status;
    }

    formatSymbol(symbol, marketType) {
        if (marketType === 'futures' || marketType === 'swap') {
            return symbol.replace('/', '').toUpperCase();
        }
        return symbol.replace('/', '').toLowerCase();
    }

    parseSymbol(symbol) {
        // تحويل الرموز مثل "btcusdt" إلى "BTC/USDT"
        const match = symbol.match(/([a-z]+)(usdt|husd|btc|eth)$/i);
        if (match) {
            return `${match[1].toUpperCase()}/${match[2].toUpperCase()}`;
        }
        return symbol.toUpperCase();
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

    // === إدارة الهامش ===
    async getMarginLoanOrders(currency, state = 'created') {
        return await this.executeWithRetry(async () => {
            const timestamp = new Date().toISOString().split('.')[0] + 'Z';
            const method = 'GET';
            const path = this.endpoints.methods.marginLoanOrders.path;
            
            const params = {
                currency: currency.toLowerCase(),
                state: state
            };

            const signature = this.createHuobiSignature(method, this.endpoints.base, path, params, timestamp);

            const response = await this.axiosInstance.get(
                `${this.endpoints.base}${path}`,
                {
                    headers: this.getAuthHeaders(timestamp, signature),
                    params
                }
            );

            if (response.data.status !== 'ok') {
                throw new Error(response.data['err-msg'] || 'فشل جلب سجل القروض');
            }

            return response.data.data.map(loan => ({
                id: loan.id,
                currency: loan.currency,
                amount: parseFloat(loan.amount),
                actualAmount: parseFloat(loan.actual-amount),
                state: loan.state,
                accruedAt: new Date(loan.accrued-at),
                createdAt: new Date(loan.created-at),
                paidPoint: parseFloat(loan.paid-point),
                paidCoin: parseFloat(loan.paid-coin),
                deductAmount: parseFloat(loan.deduct-amount),
                deductCurrency: loan.deduct-currency,
                deductRate: parseFloat(loan.deduct-rate)
            }));
        }, 'getMarginLoanOrders');
    }
}

module.exports = HuobiService;