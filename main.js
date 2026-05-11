// main.js - Enhanced Trading Bot Entry Point

require("dotenv").config();

const streamEnhanced = require("./stream-enhanced");
const RiskManager = require("./riskmanager");
const advancedlogic = require("./advancedlogic");

// =================================
// INITIALIZE SYSTEMS
// =================================

const riskManager = new RiskManager();

console.log("\n╔════════════════════════════════════════════════════════════════╗");
console.log("║                   🤖 ENHANCED TRADER BOT v2.0                   ║");
console.log("║          Multi-Timeframe • Advanced Patterns • Self-Learning      ║");
console.log("╚════════════════════════════════════════════════════════════════╝\n");

// =================================
// DISPLAY STARTUP INFO
// =================================

function displayStartupInfo() {
    console.log("📊 BOT CONFIGURATION:");
    console.log("────────────────────────────────────────────────────────────");
    console.log(`  Instrument:           ${require("./config").instrument}`);
    console.log(`  Environment:          ${require("./config").environment}`);
    console.log(`  Multi-Timeframe:      1M, 5M, 15M`);
    console.log(`  Pattern Recognition:  ${require("./config").enableAdvancedPatterns}`);
    console.log(`  Self-Improvement:     ${require("./config").enableSelfImprovement}`);
    console.log(`  Risk Management:      ${require("./config").enableRiskManagement}`);
    console.log(`  Max Drawdown:         ${require("./config").maxDrawdown}%`);
    console.log("────────────────────────────────────────────────────────────\n");
    
    console.log("📈 PATTERN WEIGHTS:");
    console.log("────────────────────────────────────────────────────────────");
    const patterns = require("./config").patterns;
    for (const [key, value] of Object.entries(patterns)) {
        console.log(`  ${key.padEnd(20)}: ${value.weight} (${value.enabled ? "✓" : "✗"})`);
    }
    console.log("────────────────────────────────────────────────────────────\n");
    
    console.log("🎯 TIMEFRAME SETTINGS:");
    console.log("────────────────────────────────────────────────────────────");
    const tfs = require("./config").timeframes;
    for (const [tf, settings] of Object.entries(tfs)) {
        console.log(`  ${tf.padEnd(5)}: Min Score ${settings.minScore}, Weight ${settings.weight}`);
    }
    console.log("────────────────────────────────────────────────────────────\n");
}

displayStartupInfo();

// =================================
// LOAD TRADING HISTORY
// =================================

function displayLoadedStats() {
    const stats = riskManager.getStats();
    
    if (stats.total > 0) {
        console.log("📊 LOADED TRADING STATS:");
        console.log("────────────────────────────────────────────────────────────");
        console.log(`  Total Trades:         ${stats.total}`);
        console.log(`  Wins:                 ${stats.wins} (${stats.winRate})`);
        console.log(`  Losses:               ${stats.losses}`);
        console.log(`  Avg Win:              ${stats.avgWin}`);
        console.log(`  Avg Loss:             ${stats.avgLoss}`);
        console.log(`  Profit Factor:        ${stats.profitFactor}`);
        console.log(`  Current Equity:       ${stats.currentEquity}`);
        console.log(`  Total Return:         ${stats.totalReturn}`);
        console.log(`  Max Drawdown:         ${stats.maxDrawdown}%`);
        console.log(`  Status:               ${stats.isPaused ? "⚠️  PAUSED" : "✓ ACTIVE"}`);
        console.log("────────────────────────────────────────────────────────────\n");
    } else {
        console.log("📊 NO PREVIOUS TRADING DATA - Starting fresh!\n");
    }
}

displayLoadedStats();

// =================================
// LOAD LEARNING MEMORY
// =================================

function displayLearningStats() {
    const learner = advancedlogic.learner;
    const patterns = Object.keys(learner.patterns);
    
    if (patterns.length > 0) {
        console.log("🧠 LEARNED PATTERNS:");
        console.log("────────────────────────────────────────────────────────────");
        
        patterns.forEach(pattern => {
            const p = learner.patterns[pattern];
            const total = p.wins + p.losses;
            const reliability = total > 0 ? ((p.wins / total) * 100).toFixed(1) : 0;
            
            console.log(`  ${pattern.padEnd(25)}: ${p.wins}W/${p.losses}L (${reliability}%)`);
        });
        
        console.log("────────────────────────────────────────────────────────────\n");
    } else {
        console.log("🧠 NO LEARNED PATTERNS YET - Will learn from trades!\n");
    }
}

displayLearningStats();

// =================================
// VALIDATE CONFIGURATION
// =================================

function validateConfig() {
    const config = require("./config");
    
    console.log("✓ VALIDATING CONFIGURATION...\n");
    
    let errors = [];
    
    if (!process.env.OANDA_API_KEY) {
        errors.push("❌ OANDA_API_KEY not set in .env");
    }
    
    if (!process.env.OANDA_ACCOUNT_ID) {
        errors.push("❌ OANDA_ACCOUNT_ID not set in .env");
    }
    
    if (!config.instrument) {
        errors.push("❌ Instrument not configured");
    }
    
    if (config.minScore < 20 || config.minScore > 100) {
        errors.push("⚠️  minScore seems unusual (should be 30-50)");
    }
    
    if (errors.length > 0) {
        console.log("Configuration Issues:");
        errors.forEach(err => console.log(`  ${err}`));
        console.log();
    } else {
        console.log("✓ All configurations validated!\n");
    }
    
    return errors.length === 0;
}

if (!validateConfig()) {
    console.log("⚠️  Some configuration issues found. Proceeding anyway...\n");
}

// =================================
// GRACEFUL SHUTDOWN
// =================================

process.on("SIGINT", () => {
    console.log("\n\n╔═════════════════════════════════════════════��══════════════════╗");
    console.log("║                    📊 FINAL STATISTICS                          ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");
    
    const stats = riskManager.getStats();
    
    console.log("📈 SESSION SUMMARY:");
    console.log("────────────────────────────────────────────────────────────");
    console.log(`  Total Trades:         ${stats.total}`);
    console.log(`  Win Rate:             ${stats.winRate}`);
    console.log(`  Profit Factor:        ${stats.profitFactor}`);
    console.log(`  Current Equity:       ${stats.currentEquity}`);
    console.log(`  Total Return:         ${stats.totalReturn}`);
    console.log("────────────────────────────────────────────────────────────\n");
    
    console.log("💾 Data saved to:");
    console.log("   • trade_log.json (all trades)");
    console.log("   • bot_memory.json (learned patterns)\n");
    
    console.log("👋 Bot stopped gracefully.\n");
    
    process.exit(0);
});

// =================================
// START TRADING
// =================================

console.log("🚀 STARTING MARKET STREAM...\n");
console.log("═".repeat(64));
console.log("Commands:");
console.log("  • Press CTRL+C to stop and view final statistics");
console.log("═".repeat(64) + "\n");

// Start the enhanced stream
streamEnhanced.start();

// =================================
// PERIODIC STATUS UPDATES (every 5 minutes)
// =================================

setInterval(() => {
    const stats = riskManager.getStats();
    
    if (stats.total % 5 === 0 && stats.total > 0) {
        console.log("\n📊 STATUS UPDATE (UTC " + new Date().toLocaleTimeString() + ")");
        console.log("   Trades: " + stats.total + " | WR: " + stats.winRate + " | Equity: " + stats.currentEquity);
        console.log("   Return: " + stats.totalReturn + " | Drawdown: " + stats.maxDrawdown + "%\n");
    }
}, 300000);

// =================================
// EXPORT FOR TESTING
// =================================

module.exports = {
    riskManager,
    advancedlogic,
    streamEnhanced
};
