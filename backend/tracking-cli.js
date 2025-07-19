const { productTracker } = require("./tracking-logger")

const args = process.argv.slice(2)
const command = args[0]

async function main() {
    switch (command) {
        case "add":
            if (args[1]) {
                productTracker.addToTracking(args[1])
                console.log(`Added product ${args[1]} to tracking`)
            } else {
                console.log("Usage: node tracking-cli.js add <product-id>")
            }
            break

        case "remove":
            if (args[1]) {
                productTracker.removeFromTracking(args[1])
                console.log(`Removed product ${args[1]} from tracking`)
            } else {
                console.log("Usage: node tracking-cli.js remove <product-id>")
            }
            break

        case "list":
            const summary = productTracker.getTrackingSummary()
            console.log("Currently tracked products:")
            console.log(JSON.stringify(summary, null, 2))
            break

        case "logs":
            if (args[1]) {
                const logs = productTracker.getLogs(args[1])
                console.log(`Logs for product ${args[1]}:`)
                console.log(JSON.stringify(logs, null, 2))
            } else {
                console.log("Usage: node tracking-cli.js logs <product-id>")
            }
            break

        case "write":
            await productTracker.writeAllLogsToFiles()
            console.log("All tracking logs written to files")
            break

        case "clear":
            if (args[1]) {
                productTracker.clearLogs(args[1])
                console.log(`Cleared logs for product ${args[1]}`)
            } else {
                console.log("Usage: node tracking-cli.js clear <product-id>")
            }
            break

        default:
            console.log(`
Product Tracking CLI

Commands:
  add <product-id>     - Add a product to tracking
  remove <product-id>  - Remove a product from tracking
  list                 - List all tracked products
  logs <product-id>    - Show logs for a specific product
  write                - Write all logs to files
  clear <product-id>   - Clear logs for a product (keep tracking)

Examples:
  node tracking-cli.js add 123
  node tracking-cli.js list
  node tracking-cli.js logs 123
  node tracking-cli.js write
      `)
    }
}

main().catch(console.error)
