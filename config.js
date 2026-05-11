// config.js

require("dotenv").config();

module.exports = {

    apiKey:
        process.env.OANDA_API_KEY,

    accountId:
        process.env.OANDA_ACCOUNT_ID,

    instrument:
        "EUR_USD",

    environment:
        "practice",

    // =========================
    // SIGNAL SETTINGS (1M)
    // =========================

    minScore: 40,

    struggleLimit: 20,

    pauseLimit: 35,

    pushThreshold: 0.00012,

    rejectThreshold: 0.00018,

    pullbackThreshold: 0.00008,

    // =========================
    // MULTI-TIMEFRAME CONFIG
    // =========================

    timeframes: {
        "1m": {
            minScore: 40,
            enabled: true,
            weight: 1.0
        },
        "5m": {
            minScore: 45,
            enabled: true,
            weight: 1.5
        },
        "15m": {
            minScore: 50,
            enabled: true,
            weight: 1.8
        }
    },

    // =========================
    // ADVANCED SETTINGS
    // =========================

    enableAdvancedPatterns: true,
    enableSelfImprovement: true,
    enableRiskManagement: true,
    enableVolumeAnalysis: true,

    // Risk parameters
    maxDrawdown: 5,
    minWinRateThreshold: 45,
    riskRewardRatio: 1.5,

    // Learning parameters
    learningRate: 0.01,
    adaptiveScoring: true,
    memorySize: 500,

    // =========================
    // PATTERN SENSITIVITY
    // =========================

    patterns: {
        engulfing: { weight: 20, enabled: true },
        hammers: { weight: 18, enabled: true },
        harami: { weight: 15, enabled: true },
        morningstar: { weight: 25, enabled: true },
        eveningstar: { weight: 25, enabled: true },
        innerbar: { weight: 12, enabled: true },
        volumeBreakout: { weight: 16, enabled: true },
        trendConfluence: { weight: 22, enabled: true }
    }
};
