// stream-enhanced.js - Enhanced streaming with multi-timeframe signals

require("dotenv").config();

const https          = require("https");
const multitracker   = require("./multitracker");
const advancedlogic  = require("./advancedlogic");
const config         = require("./config");

const API_KEY    = process.env.OANDA_API_KEY;
const ACCOUNT_ID = process.env.OANDA_ACCOUNT_ID;
const DOMAIN     = "stream-fxpractice.oanda.com";
const INSTRUMENTS = config.instrument;
const PATH       = `/v3/accounts/${ACCOUNT_ID}/pricing/stream?instruments=${INSTRUMENTS}`;

const options = {
    hostname: DOMAIN,
    path: PATH,
    method: "GET",
    headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
    }
};

// =================================
// SIGNAL HISTORY
// =================================

const signalHistory = [];
const multiframeSignals = {
    "1m": { signal: "WAIT", score: { buy: 0, sell: 0 }, wr: 0 },
    "5m": { signal: "WAIT", score: { buy: 0, sell: 0 }, wr: 0 },
    "15m": { signal: "WAIT", score: { buy: 0, sell: 0 }, wr: 0 }
};

let currentPrice = 0;
let streamBuffer = "";

// =================================
// ENHANCED DISPLAY
// =================================

function renderEnhancedLive(price, allTFs) {
    process.stdout.write("\x1Bc");
    
    console.log(`\n${"=".repeat(80)}`);
    console.log(`PRICE: ${price.toFixed(5)} | TIME: ${new Date().toLocaleTimeString()}`);
    console.log(`${"=".repeat(80)}\n`);
    
    // Primary signal (1M)
    const primary = multiframeSignals["1m"];
    const primaryColor = 
        primary.signal === "BUY" ? "\x1b[32m" :
        primary.signal === "SELL" ? "\x1b[31m" : "\x1b[33m";
    
    console.log(`📊 PRIMARY SIGNAL (1M):  ${primaryColor}${primary.signal}\x1b[0m`);
    console.log(`   Buy Score: ${primary.score.buy} | Sell Score: ${primary.score.sell}`);
    console.log(`   Win Rate: ${primary.wr}%\n`);
    
    // Secondary signals
    console.log(`📈 5M SIGNAL: ${multiframeSignals["5m"].signal} (Buy: ${multiframeSignals["5m"].score.buy}, Sell: ${multiframeSignals["5m"].score.sell})`);
    console.log(`📊 15M SIGNAL: ${multiframeSignals["15m"].signal} (Buy: ${multiframeSignals["15m"].score.buy}, Sell: ${multiframeSignals["15m"].score.sell})\n`);
    
    // Timeframe confluence
    const confluence = calculateConfluence();
    console.log(`🔄 TIMEFRAME CONFLUENCE: ${confluence}%\n`);
    
    // Display candle info for each timeframe
    for (const tf of ["1m", "5m", "15m"]) {
        const state = multitracker.getState(tf);
        if (!state || !state.currentCandle) continue;
        
        const c = state.currentCandle;
        console.log(`[${tf}] Ticks: ${c.ticks} | Range: ${(c.high - c.low).toFixed(5)} | Vol: ${c.volume}`);
    }
    
    console.log("\n" + "=".repeat(80));
    console.log("SIGNAL HISTORY (Last 5):");
    console.log("=".repeat(80));
    
    signalHistory.slice(0, 5).forEach((s, i) => {
        const col =
            s.signal === "BUY" ? "\x1b[32m" :
            s.signal === "SELL" ? "\x1b[31m" : "\x1b[33m";
        
        console.log(`${i + 1}. [${s.timeframe}] ${s.time}  ${col}${s.signal}\x1b[0m  Pattern: ${s.pattern || "N/A"}`);
    });
}

// =================================
// CONFLUENCE CALCULATION
// =================================

function calculateConfluence() {
    let agreement = 0;
    const signals = Object.values(multiframeSignals);
    
    const buyCount = signals.filter(s => s.signal === "BUY").length;
    const sellCount = signals.filter(s => s.signal === "SELL").length;
    
    if (buyCount === 3) agreement = 100;
    else if (buyCount === 2) agreement = 66;
    else if (sellCount === 3) agreement = 100;
    else if (sellCount === 2) agreement = 66;
    
    return agreement;
}

// =================================
// PROCESS CANDLE CLOSED
// =================================

function handleClosedCandle(timeframe, closed) {
    const state = multitracker.getState(timeframe);
    
    const analysis = advancedlogic.analyze(
        closed,
        state.candleMemory,
        timeframe
    );
    
    // Update signal
    multiframeSignals[timeframe] = {
        signal: analysis.signal,
        score: { buy: analysis.buyScore, sell: analysis.sellScore },
        wr: calculateWinRate(timeframe)
    };
    
    // Record trade
    if (analysis.signal !== "WAIT") {
        const time = new Date().toLocaleTimeString("en-BD", {
            timeZone: "Asia/Dhaka",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });
        
        signalHistory.unshift({
            time,
            timeframe,
            signal: analysis.signal,
            pattern: analysis.pattern,
            buyScore: analysis.buyScore,
            sellScore: analysis.sellScore,
            volatility: analysis.volatility,
            trendStrength: analysis.trendStrength
        });
        
        if (signalHistory.length > 20) signalHistory.pop();
    }
}

// =================================
// WIN RATE CALCULATION
// =================================

function calculateWinRate(timeframe) {
    const state = multitracker.getState(timeframe);
    if (state.stats.total === 0) return 0;
    return ((state.stats.win / state.stats.total) * 100).toFixed(1);
}

// =================================
// PROCESS CHUNK
// =================================

function processChunk(chunk) {
    streamBuffer += chunk.toString();
    const lines = streamBuffer.split("\n");
    streamBuffer = lines.pop();
    
    lines.forEach(line => {
        line = line.trim();
        if (!line) return;
        
        try {
            const data = JSON.parse(line);
            
            if (data.type === "HEARTBEAT") return;
            
            if (data.type === "PRICE") {
                if (!data.bids || !data.bids[0] || !data.asks || !data.asks[0]) return;
                
                const bid = parseFloat(data.bids[0].price);
                const ask = parseFloat(data.asks[0].price);
                const price = (bid + ask) / 2;
                
                currentPrice = price;
                
                // Update all timeframes
                const results = multitracker.updatePrice(price);
                
                // Check for closed candles
                for (const tf of Object.keys(results)) {
                    if (results[tf].newCandle && results[tf].closed) {
                        handleClosedCandle(tf, results[tf].closed);
                    }
                }
                
                // Render display
                renderEnhancedLive(price, multitracker.getAllTimeframes());
            }
        } catch (err) {
            // Partial chunk
        }
    });
}

// =================================
// CONNECT STREAM
// =================================

function connectStream() {
    console.log("\n🔗 CONNECTING TO OANDA...\n");
    
    const request = https.request(options, (response) => {
        console.log("STATUS:", response.statusCode);
        
        if (response.statusCode !== 200) {
            console.error("\n❌ AUTH FAILED — check .env credentials");
            response.resume();
            return;
        }
        
        streamBuffer = "";
        response.on("data", processChunk);
        
        response.on("end", () => {
            console.log("\n⚠️  STREAM ENDED — reconnecting in 5s...");
            setTimeout(connectStream, 5000);
        });
        
        response.on("error", (err) => {
            console.error("\n❌ STREAM ERROR:", err.message);
            setTimeout(connectStream, 5000);
        });
    });
    
    request.on("error", (err) => {
        console.error("\n❌ REQUEST ERROR:", err.message);
        setTimeout(connectStream, 5000);
    });
    
    request.end();
}

module.exports = {
    start: connectStream
};
