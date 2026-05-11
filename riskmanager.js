// riskmanager.js - Risk management and self-improvement system

const fs = require("fs");
const path = require("path");
const config = require("./config");

class RiskManager {
    constructor() {
        this.tradeLog = [];
        this.equityCurve = [100]; // Start with 100 units
        this.currentDrawdown = 0;
        this.isPaused = false;
        this.logFile = path.join(__dirname, "trade_log.json");
        this.loadTradeLog();
    }
    
    // =================================
    // POSITION SIZING
    // =================================
    
    calculatePositionSize(accountBalance, riskPercentage = 2) {
        return accountBalance * (riskPercentage / 100);
    }
    
    calculateTakeProfit(entryPrice, signal, atr) {
        const multiple = config.riskRewardRatio;
        if (signal === "BUY") {
            return entryPrice + (atr * multiple);
        } else {
            return entryPrice - (atr * multiple);
        }
    }
    
    calculateStopLoss(entryPrice, signal, atr) {
        if (signal === "BUY") {
            return entryPrice - atr;
        } else {
            return entryPrice + atr;
        }
    }
    
    // =================================
    // DRAWDOWN MONITORING
    // =================================
    
    updateEquity(pnl) {
        const lastEquity = this.equityCurve[this.equityCurve.length - 1];
        const newEquity = lastEquity + pnl;
        this.equityCurve.push(newEquity);
        
        // Calculate max drawdown
        const peak = Math.max(...this.equityCurve);
        const drawdown = ((peak - newEquity) / peak) * 100;
        
        this.currentDrawdown = drawdown;
        
        if (drawdown > config.maxDrawdown) {
            this.isPaused = true;
            console.log(`⚠️  TRADING PAUSED - Drawdown: ${drawdown.toFixed(2)}%`);
            return false;
        }
        
        return true;
    }
    
    canTrade() {
        return !this.isPaused;
    }
    
    resetRisk() {
        this.isPaused = false;
        this.equityCurve = [100];
        console.log("✅ Risk management reset");
    }
    
    // =================================
    // TRADE LOGGING
    // =================================
    
    recordTrade(trade) {
        const tradeRecord = {
            timestamp: Date.now(),
            signal: trade.signal,
            entryPrice: trade.entryPrice,
            exitPrice: trade.exitPrice,
            takeProfit: trade.takeProfit,
            stopLoss: trade.stopLoss,
            pnl: trade.pnl,
            pnlPercent: trade.pnlPercent,
            duration: trade.duration,
            timeframe: trade.timeframe,
            pattern: trade.pattern
        };
        
        this.tradeLog.push(tradeRecord);
        this.updateEquity(trade.pnl);
        this.saveTradeLog();
    }
    
    loadTradeLog() {
        try {
            if (fs.existsSync(this.logFile)) {
                const data = JSON.parse(fs.readFileSync(this.logFile, 'utf8'));
                this.tradeLog = data.trades || [];
                this.equityCurve = data.equityCurve || [100];
            }
        } catch (err) {
            console.log("Starting fresh trade log");
        }
    }
    
    saveTradeLog() {
        try {
            fs.writeFileSync(this.logFile, JSON.stringify({
                trades: this.tradeLog.slice(-500),
                equityCurve: this.equityCurve.slice(-500)
            }, null, 2));
        } catch (err) {
            console.error("Failed to save trade log:", err.message);
        }
    }
    
    // =================================
    // ANALYTICS
    // =================================
    
    getStats() {
        const wins = this.tradeLog.filter(t => t.pnl > 0).length;
        const losses = this.tradeLog.filter(t => t.pnl < 0).length;
        const total = this.tradeLog.length;
        
        const avgWin = wins > 0 
            ? this.tradeLog.filter(t => t.pnl > 0).reduce((a, t) => a + t.pnl, 0) / wins
            : 0;
        
        const avgLoss = losses > 0
            ? Math.abs(this.tradeLog.filter(t => t.pnl < 0).reduce((a, t) => a + t.pnl, 0) / losses)
            : 0;
        
        const winRate = total > 0 ? ((wins / total) * 100).toFixed(2) : 0;
        const profitFactor = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : 0;
        
        const currentEquity = this.equityCurve[this.equityCurve.length - 1];
        const totalReturn = ((currentEquity - 100) / 100 * 100).toFixed(2);
        
        return {
            total,
            wins,
            losses,
            winRate: `${winRate}%`,
            avgWin: avgWin.toFixed(4),
            avgLoss: avgLoss.toFixed(4),
            profitFactor,
            currentEquity: currentEquity.toFixed(2),
            totalReturn: `${totalReturn}%`,
            maxDrawdown: this.currentDrawdown.toFixed(2),
            isPaused: this.isPaused
        };
    }
}

module.exports = RiskManager;
