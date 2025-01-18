const fs = require("fs");
const path = require("path");
const { getProducts } = require("./database/database");

const createBackupFile = async () => {
  const products = await getProducts();
  const backupFilePath = path.join(__dirname, "backup", `products_backup_${Date.now()}.json`);
  const backupData = JSON.stringify(products, null, 2);

  fs.mkdirSync(path.dirname(backupFilePath), { recursive: true });

  fs.writeFileSync(backupFilePath, backupData, "utf8");
  console.log(`Backup created at ${backupFilePath}`);
};

module.exports = {
  createBackupFile,
};
