// advancedlogic.js - Advanced pattern recognition and machine learning

const config = require("./config");
const fs = require("fs");
const path = require("path");

// =================================
// LEARNING MEMORY
// =================================

class LearningEngine {
    constructor() {
        this.patterns = {};
        this.scoreAdjustments = {};
        this.tradeMemory = [];
        this.dataFile = path.join(__dirname, "bot_memory.json");
        this.loadMemory();
    }
    
    loadMemory() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
                this.patterns = data.patterns || {};
                this.scoreAdjustments = data.scoreAdjustments || {};
                this.tradeMemory = data.tradeMemory || [];
            }
        } catch (err) {
            console.log("Starting fresh learning memory");
        }
    }
    
    saveMemory() {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify({
                patterns: this.patterns,
                scoreAdjustments: this.scoreAdjustments,
                tradeMemory: this.tradeMemory.slice(-1000)
            }, null, 2));
        } catch (err) {
            console.error("Failed to save memory:", err.message);
        }
    }
    
    recordTrade(signal, result, metrics) {
        const trade = {
            timestamp: Date.now(),
            signal,
            result,
            metrics
        };
        this.tradeMemory.push(trade);
        
        // Update pattern success rates
        if (metrics.pattern) {
            if (!this.patterns[metrics.pattern]) {
                this.patterns[metrics.pattern] = { wins: 0, losses: 0 };
            }
            if (result === "WIN") {
                this.patterns[metrics.pattern].wins++;
            } else {
                this.patterns[metrics.pattern].losses++;
            }
        }
        
        this.saveMemory();
    }
    
    getPatternReliability(patternName) {
        if (!this.patterns[patternName]) return 0;
        const p = this.patterns[patternName];
        const total = p.wins + p.losses;
        return total > 0 ? (p.wins / total) * 100 : 0;
    }
    
    adaptScoring(baseScore, pattern, signal) {
        if (!config.adaptiveScoring) return baseScore;
        
        const reliability = this.getPatternReliability(pattern);
        const adjustment = (reliability - 50) * config.learningRate;
        
        return baseScore + adjustment;
    }
}

const learner = new LearningEngine();

// =================================
// ADVANCED CANDLE PATTERNS
// =================================

function detectEngulfing(candles) {
    if (candles.length < 2) return null;
    
    const prev = candles[candles.length - 2];
    const curr = candles[candles.length - 1];
    
    const prevBody = Math.abs(prev.close - prev.open);
    const currBody = Math.abs(curr.close - curr.open);
    
    // Bullish engulfing
    if (curr.open < prev.close && curr.close > prev.open && currBody > prevBody * 1.1) {
        return { pattern: "ENGULFING_UP", strength: currBody / prevBody };
    }
    
    // Bearish engulfing
    if (curr.open > prev.close && curr.close < prev.open && currBody > prevBody * 1.1) {
        return { pattern: "ENGULFING_DOWN", strength: currBody / prevBody };
    }
    
    return null;
}

function detectHammers(candle) {
    const body = Math.abs(candle.close - candle.open);
    const totalRange = candle.high - candle.low;
    const lowerWick = Math.min(candle.open, candle.close) - candle.low;
    const upperWick = candle.high - Math.max(candle.open, candle.close);
    
    // Hammer (bullish)
    if (lowerWick > body * 2 && upperWick < body * 0.5 && body / totalRange > 0.3) {
        return { pattern: "HAMMER", strength: lowerWick / body };
    }
    
    // Shooting star (bearish)
    if (upperWick > body * 2 && lowerWick < body * 0.5 && body / totalRange > 0.3) {
        return { pattern: "SHOOTING_STAR", strength: upperWick / body };
    }
    
    return null;
}

function detectHarami(candles) {
    if (candles.length < 2) return null;
    
    const prev = candles[candles.length - 2];
    const curr = candles[candles.length - 1];
    
    // Bullish harami
    if (prev.close < prev.open && 
        curr.open > prev.close && 
        curr.close > prev.close &&
        curr.high < prev.open &&
        curr.low > prev.low) {
        return { pattern: "HARAMI_UP", strength: 1 };
    }
    
    return null;
}

function detectMorningStar(candles) {
    if (candles.length < 3) return null;
    
    const c1 = candles[candles.length - 3];
    const c2 = candles[candles.length - 2];
    const c3 = candles[candles.length - 1];
    
    // Morning star: down + small body + up
    if (c1.close < c1.open && 
        Math.abs(c2.close - c2.open) < Math.abs(c1.close - c1.open) * 0.5 &&
        c3.close > c3.open &&
        c3.close > c1.close) {
        return { pattern: "MORNING_STAR", strength: 1.5 };
    }
    
    return null;
}

function detectEveningStar(candles) {
    if (candles.length < 3) return null;
    
    const c1 = candles[candles.length - 3];
    const c2 = candles[candles.length - 2];
    const c3 = candles[candles.length - 1];
    
    // Evening star: up + small body + down
    if (c1.close > c1.open && 
        Math.abs(c2.close - c2.open) < Math.abs(c1.close - c1.open) * 0.5 &&
        c3.close < c3.open &&
        c3.close < c1.close) {
        return { pattern: "EVENING_STAR", strength: 1.5 };
    }
    
    return null;
}

function detectInnerBar(candles) {
    if (candles.length < 2) return null;
    
    const prev = candles[candles.length - 2];
    const curr = candles[candles.length - 1];
    
    // Current bar is inside previous bar
    if (curr.high < prev.high && curr.low > prev.low) {
        return { pattern: "INNER_BAR", strength: 1 };
    }
    
    return null;
}

function detectVolumeBreakout(candle, memory) {
    if (memory.length < 20) return null;
    
    const avgVolume = memory.slice(-20).reduce((a, c) => a + c.volume, 0) / 20;
    
    if (candle.volume > avgVolume * 1.5) {
        const bodySize = Math.abs(candle.close - candle.open);
        if (bodySize > 0.00010) {
            return { pattern: "VOLUME_BREAKOUT", strength: candle.volume / avgVolume };
        }
    }
    
    return null;
}

// =================================
// MARKET STRUCTURE ANALYSIS
// =================================

function analyzeMarketStructure(memory) {
    if (memory.length < 20) {
        return { trend: "SIDE", strength: 0, confluence: 0 };
    }
    
    const recent = memory.slice(-20);
    let hlCount = 0, llCount = 0, hhCount = 0, lhCount = 0;
    
    for (let i = 1; i < recent.length; i++) {
        const prev = recent[i - 1];
        const curr = recent[i];
        
        if (curr.high > prev.high) hhCount++;
        if (curr.low > prev.low) hlCount++;
        if (curr.high < prev.high) lhCount++;
        if (curr.low < prev.low) llCount++;
    }
    
    let trend = "SIDE";
    let strength = 0;
    
    if (hhCount >= 5 && hlCount >= 5) {
        trend = "UP";
        strength = (hhCount + hlCount) / 38;
    } else if (lhCount >= 5 && llCount >= 5) {
        trend = "DOWN";
        strength = (lhCount + llCount) / 38;
    }
    
    return { trend, strength, confluence: (hhCount + hlCount + lhCount + llCount) / 38 };
}

// =================================
// LIQUIDITY ANALYSIS
// =================================

function analyzeLiquidity(memory) {
    if (memory.length < 50) return null;
    
    const recent = memory.slice(-50);
    const highs = recent.map(c => c.high).sort((a, b) => a - b);
    const lows = recent.map(c => c.low).sort((a, b) => a - b);
    
    // Find clustering
    const liquidityZones = [];
    
    // Resistance zones
    for (let i = highs.length - 1; i > highs.length - 5; i--) {
        liquidityZones.push({ level: highs[i], type: "RESISTANCE" });
    }
    
    // Support zones
    for (let i = 0; i < 5 && i < lows.length; i++) {
        liquidityZones.push({ level: lows[i], type: "SUPPORT" });
    }
    
    return liquidityZones;
}

// =================================
// MAIN ANALYSIS
// =================================

function analyze(closedCandle, memory, timeframe = "1m") {
    const structure = analyzeMarketStructure(memory);
    const engulfing = detectEngulfing(memory);
    const hammers = detectHammers(closedCandle);
    const harami = detectHarami(memory);
    const morningstar = detectMorningStar(memory);
    const eveningstar = detectEveningStar(memory);
    const innerbar = detectInnerBar(memory);
    const volumeBreakout = detectVolumeBreakout(closedCandle, memory);
    const liquidity = analyzeLiquidity(memory);
    
    let buyScore = 0;
    let sellScore = 0;
    let detectedPattern = null;
    
    // Structure
    if (structure.trend === "UP") buyScore += 20 * structure.strength;
    if (structure.trend === "DOWN") sellScore += 20 * structure.strength;
    
    // Engulfing
    if (engulfing) {
        detectedPattern = engulfing.pattern;
        if (engulfing.pattern === "ENGULFING_UP") {
            buyScore += config.patterns.engulfing.weight * engulfing.strength;
        } else {
            sellScore += config.patterns.engulfing.weight * engulfing.strength;
        }
    }
    
    // Hammers
    if (hammers) {
        detectedPattern = hammers.pattern;
        if (hammers.pattern === "HAMMER") {
            buyScore += config.patterns.hammers.weight * hammers.strength;
        } else {
            sellScore += config.patterns.hammers.weight * hammers.strength;
        }
    }
    
    // Harami
    if (harami) {
        detectedPattern = harami.pattern;
        buyScore += config.patterns.harami.weight;
    }
    
    // Morning star
    if (morningstar) {
        detectedPattern = morningstar.pattern;
        buyScore += config.patterns.morningstar.weight * morningstar.strength;
    }
    
    // Evening star
    if (eveningstar) {
        detectedPattern = eveningstar.pattern;
        sellScore += config.patterns.eveningstar.weight * eveningstar.strength;
    }
    
    // Inner bar
    if (innerbar) {
        buyScore -= 5; sellScore -= 5; // Consolidation = reduce confidence
    }
    
    // Volume breakout
    if (volumeBreakout) {
        detectedPattern = volumeBreakout.pattern;
        if (closedCandle.close > closedCandle.open) {
            buyScore += config.patterns.volumeBreakout.weight * volumeBreakout.strength;
        } else {
            sellScore += config.patterns.volumeBreakout.weight * volumeBreakout.strength;
        }
    }
    
    // Volatility
    if (closedCandle.volatilityScore > 60) {
        buyScore += 10;
        sellScore += 10;
    }
    
    // Order flow
    if (closedCandle.orderFlowDelta > closedCandle.bullishTicks * 0.4) {
        buyScore += 12;
    } else if (closedCandle.orderFlowDelta < closedCandle.bearishTicks * -0.4) {
        sellScore += 12;
    }
    
    // Apply learning adjustments
    if (detectedPattern && config.enableSelfImprovement) {
        buyScore = learner.adaptScoring(buyScore, detectedPattern, "BUY");
        sellScore = learner.adaptScoring(sellScore, detectedPattern, "SELL");
    }
    
    // Rejection signals
    if (closedCandle.rejectionLow > closedCandle.rejectionHigh) buyScore += 15;
    if (closedCandle.rejectionHigh > closedCandle.rejectionLow) sellScore += 15;
    
    // Final signal
    const gap = Math.abs(buyScore - sellScore);
    let signal = "WAIT";
    
    const minScore = config.timeframes[timeframe]?.minScore || config.minScore;
    
    if (buyScore >= minScore && buyScore > sellScore && gap >= 10) {
        signal = "BUY";
    } else if (sellScore >= minScore && sellScore > buyScore && gap >= 10) {
        signal = "SELL";
    }
    
    return {
        signal,
        buyScore,
        sellScore,
        trend: structure.trend,
        trendStrength: structure.strength,
        pattern: detectedPattern,
        volatility: closedCandle.volatilityScore,
        orderFlow: closedCandle.orderFlowDelta,
        liquidity,
        timeframe
    };
}

module.exports = {
    analyze,
    learner,
    detectEngulfing,
    detectHammers,
    detectHarami,
    detectMorningStar,
    detectEveningStar,
    analyzeMarketStructure,
    analyzeLiquidity
};
