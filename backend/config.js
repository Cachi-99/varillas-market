const path = require("node:path")
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true })

module.exports = {
  port: Number(process.env.PORT || 3000),
  database: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "varillas_market_db",
    connectTimeout: 5000,
  },
}
