// multitracker.js - Enhanced tracker with multiple timeframes

const config = require("./config");

// =================================
// MULTI-TIMEFRAME STATE
// =================================

const timeframeStates = {
    "1m": initializeTimeframe(),
    "5m": initializeTimeframe(),
    "15m": initializeTimeframe()
};

let priceHistory = [];
let lastPrice = 0;

// =================================
// INITIALIZE TIMEFRAME
// =================================

function initializeTimeframe() {
    return {
        currentCandle: null,
        candleMemory: [],
        stats: { win: 0, loss: 0, total: 0, drawdown: 0 },
        atrValues: [],
        volumeProfile: {},
        volatilityIndex: 0,
        trend: "SIDE",
        lastUpdate: Date.now()
    };
}

// =================================
// RESET CANDLE
// =================================

function resetCandle(price = 0) {
    return {
        open: price,
        high: price,
        low: price,
        close: price,
        ticks: 0,
        bullishTicks: 0,
        bearishTicks: 0,
        pushes: 0,
        pullbacks: 0,
        rejectionHigh: 0,
        rejectionLow: 0,
        fastMoves: 0,
        slowMoves: 0,
        struggle: 0,
        pauseTicks: 0,
        volume: 0,
        vwap: price,
        lastPrice: price,
        lastDelta: 0,
        _prevDirection: null,
        startTime: Date.now(),
        // Advanced metrics
        intrabarRange: 0,
        volatilityScore: 0,
        microTrend: "SIDE",
        liquidityZones: [],
        orderFlowDelta: 0,
        absorptionLevels: []
    };
}

// =================================
// GET MINUTE FOR TIMEFRAME
// =================================

function getCandleTime(timeframe) {
    const now = new Date();
    const minutes = now.getUTCMinutes();
    
    switch(timeframe) {
        case "1m": return minutes;
        case "5m": return Math.floor(minutes / 5) * 5;
        case "15m": return Math.floor(minutes / 15) * 15;
        default: return minutes;
    }
}

// =================================
// UPDATE PRICE ACROSS TIMEFRAMES
// =================================

function updatePrice(price) {
    const results = {};
    
    for (const tf of Object.keys(timeframeStates)) {
        if (!config.timeframes[tf].enabled) continue;
        
        const state = timeframeStates[tf];
        const currentTime = getCandleTime(tf);
        const lastTime = state.lastTime;
        
        // Initialize
        if (state.lastTime === undefined) {
            state.lastTime = currentTime;
            state.currentCandle = resetCandle(price);
            results[tf] = { newCandle: false, closed: null };
            continue;
        }
        
        // New candle on this timeframe
        if (currentTime !== lastTime) {
            const closed = { ...state.currentCandle };
            state.candleMemory.push(closed);
            if (state.candleMemory.length > 100) state.candleMemory.shift();
            
            state.currentCandle = resetCandle(price);
            state.lastTime = currentTime;
            
            results[tf] = { newCandle: true, closed };
        } else {
            results[tf] = { newCandle: false, closed: null };
        }
        
        // Update live candle
        updateCandle(state.currentCandle, price, state.candleMemory);
    }
    
    priceHistory.push({ price, time: Date.now() });
    if (priceHistory.length > 5000) priceHistory.shift();
    lastPrice = price;
    
    return results;
}

// =================================
// UPDATE CANDLE METRICS
// =================================

function updateCandle(candle, price, memory) {
    candle.ticks++;
    candle.close = price;
    candle.volume++;
    
    const delta = price - candle.lastPrice;
    const absDelta = Math.abs(delta);
    
    // High/Low
    if (price > candle.high) candle.high = price;
    if (price < candle.low) candle.low = price;
    
    candle.intrabarRange = candle.high - candle.low;
    
    // Direction
    let direction = "SIDE";
    if (delta > 0) {
        candle.bullishTicks++;
        direction = "UP";
    } else if (delta < 0) {
        candle.bearishTicks++;
        direction = "DOWN";
    }
    
    // Push/Pause
    if (absDelta > config.pushThreshold) {
        candle.pushes++;
        candle.fastMoves++;
    } else if (absDelta < 0.00001 && candle.ticks > 3) {
        candle.pauseTicks++;
        candle.slowMoves++;
    }
    
    // Pullback
    if (candle._prevDirection && direction !== candle._prevDirection && direction !== "SIDE") {
        candle.pullbacks++;
    }
    
    // Rejection detection
    if (direction === "DOWN" && candle._prevDirection === "UP") {
        const wickFromTop = candle.high - candle.lastPrice;
        if (wickFromTop > config.rejectThreshold) {
            candle.rejectionHigh++;
        }
    }
    
    if (direction === "UP" && candle._prevDirection === "DOWN") {
        const wickFromBottom = candle.lastPrice - candle.low;
        if (wickFromBottom > config.rejectThreshold) {
            candle.rejectionLow++;
        }
    }
    
    // Struggle calculation
    const totalTicks = candle.bullishTicks + candle.bearishTicks;
    if (totalTicks > 10) {
        const ratio = candle.bullishTicks / (candle.bearishTicks || 1);
        candle.struggle = 1 - Math.abs(ratio - 1);
    }
    
    // Volatility score
    candle.volatilityScore = (candle.fastMoves / Math.max(candle.ticks, 1)) * 100;
    
    // Order flow delta
    candle.orderFlowDelta = candle.bullishTicks - candle.bearishTicks;
    
    // Micro trend
    if (candle.bullishTicks > candle.bearishTicks * 1.5) {
        candle.microTrend = "UP";
    } else if (candle.bearishTicks > candle.bullishTicks * 1.5) {
        candle.microTrend = "DOWN";
    } else {
        candle.microTrend = "SIDE";
    }
    
    candle.lastPrice = price;
    candle.lastDelta = delta;
    
    if (direction !== "SIDE") {
        candle._prevDirection = direction;
    }
}

// =================================
// GET STATE FOR TIMEFRAME
// =================================

function getState(timeframe = "1m") {
    return timeframeStates[timeframe];
}

// =================================
// GET ALL TIMEFRAMES STATE
// =================================

function getAllTimeframes() {
    const result = {};
    for (const tf of Object.keys(timeframeStates)) {
        result[tf] = {
            candle: timeframeStates[tf].currentCandle,
            memory: timeframeStates[tf].candleMemory,
            stats: timeframeStates[tf].stats
        };
    }
    return result;
}

module.exports = {
    updatePrice,
    getState,
    getAllTimeframes,
    priceHistory: () => priceHistory,
    lastPrice: () => lastPrice
};
