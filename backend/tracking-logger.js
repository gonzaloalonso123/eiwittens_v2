const fs = require("fs").promises
const path = require("path")

class ProductTracker {
    constructor() {
        this.trackingProducts = new Set()
        this.logs = new Map()
        this.trackingDir = path.join(process.cwd(), "tracking")
    }

    addToTracking(productId) {
        this.trackingProducts.add(productId)
        if (!this.logs.has(productId)) {
            this.logs.set(productId, [])
        }
        this.log(productId, "TRACKING_STARTED", "Product added to tracking list", {})
    }

    removeFromTracking(productId) {
        this.trackingProducts.delete(productId)
        this.log(productId, "TRACKING_STOPPED", "Product removed from tracking list", {})
    }

    isTracking(productId) {
        return this.trackingProducts.has(productId)
    }

    log(productId, process, description, data = {}) {
        if (!this.isTracking(productId)) return

        const logEntry = {
            timestamp: new Date().toISOString(),
            productId,
            process,
            description,
            data: JSON.parse(JSON.stringify(data)),
        }

        if (!this.logs.has(productId)) {
            this.logs.set(productId, [])
        }

        this.logs.get(productId).push(logEntry)
    }
    logProcessStart(productId, processName, beforeState) {
        this.log(productId, `${processName}_START`, `Starting ${processName}`, {
            before: beforeState,
        })
    }
    logProcessEnd(productId, processName, beforeState, afterState) {
        const changes = this.detectChanges(beforeState, afterState)
        this.log(productId, `${processName}_END`, `Completed ${processName}`, {
            before: beforeState,
            after: afterState,
            changes,
        })
    }
    detectChanges(before, after) {
        const changes = {}
        const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})])

        for (const key of allKeys) {
            const beforeValue = before?.[key]
            const afterValue = after?.[key]

            if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
                changes[key] = {
                    from: beforeValue,
                    to: afterValue,
                }
            }
        }

        return changes
    }
    async ensureTrackingDir() {
        try {
            await fs.access(this.trackingDir)
        } catch {
            await fs.mkdir(this.trackingDir, { recursive: true })
        }
    }
    async writeLogsToFile(productId) {
        if (!this.logs.has(productId) || this.logs.get(productId).length === 0) {
            return
        }

        await this.ensureTrackingDir()

        const logs = this.logs.get(productId)
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
        const filename = `product-${productId}-${timestamp}.json`
        const filepath = path.join(this.trackingDir, filename)

        const logData = {
            productId,
            trackingStarted: logs[0]?.timestamp,
            trackingEnded: new Date().toISOString(),
            totalEvents: logs.length,
            logs,
        }

        await fs.writeFile(filepath, JSON.stringify(logData, null, 2))
        console.log(`Tracking log written to: ${filepath}`)
    }
    async writeAllLogsToFiles() {
        for (const productId of this.logs.keys()) {
            await this.writeLogsToFile(productId)
        }
    }
    getTrackingSummary() {
        const summary = {}
        for (const productId of this.trackingProducts) {
            const logs = this.logs.get(productId) || []
            summary[productId] = {
                totalEvents: logs.length,
                lastActivity: logs[logs.length - 1]?.timestamp || null,
                processes: [...new Set(logs.map((log) => log.process))],
            }
        }
        return summary
    }
    clearLogs(productId) {
        if (this.logs.has(productId)) {
            this.logs.set(productId, [])
        }
    }
    getLogs(productId) {
        return this.logs.get(productId) || []
    }
}
const productTracker = new ProductTracker()

module.exports = {
    productTracker,
    ProductTracker,
}
