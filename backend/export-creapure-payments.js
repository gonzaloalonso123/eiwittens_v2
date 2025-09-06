require('dotenv').config();
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { db } = require('./database/firebase');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function formatTimestamp(ts) {
  if (!ts) return '';
  try {
    if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
    const d = new Date(ts);
    return isNaN(d.getTime()) ? '' : d.toISOString();
  } catch (e) {
    return '';
  }
}

async function fetchUsersMap() {
  const snap = await db.collection('creapure-users').get();
  const map = {};
  snap.forEach(doc => { map[doc.id] = doc.data(); });
  return map;
}

async function fetchPayments() {
  // Using orderBy on single field generally requires no extra composite index
  const snap = await db.collection('creapure-payments').orderBy('createdAt', 'desc').get();
  const items = [];
  snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
  return items;
}

async function toRows(payments, usersMap) {
  return payments.map(p => {
    const user = usersMap[p.userId] || {};
    const refUser = p.referralUserId ? (usersMap[p.referralUserId] || {}) : {};
    const fullStreetAndNumber = p.address?.streetAndNumber
      || `${p.street || ''} ${p.houseNumber || ''}${p.addition ? ` ${p.addition}` : ''}`.trim();

    return {
      'Payment ID': p.paymentId || p.id || '',
      'Created At': formatTimestamp(p.createdAt),
      'Amount EUR': p.amount_money ?? '',
      'Amount KG': p.amount_kilograms ?? '',
      'User ID': p.userId || '',
      'User Nickname': user.nickname || '',
      'First Name': p.firstName || user.firstName || '',
      'Last Name': p.lastName || user.lastName || '',
      'Email': p.email || user.email || '',
      'Phone': p.phone || user.phone || '',
      'Street': p.street || '',
      'House Number': p.houseNumber || '',
      'Addition': p.addition || '',
      'City': p.city || '',
      'Postal': p.postal || '',
      'Country': p.country || '',
      'Full Address': fullStreetAndNumber,
      'Offers': typeof p.offers === 'boolean' ? p.offers : '',
      'Referral Code': p.referralCode || '',
      'Referral User ID': p.referralUserId || '',
      'Referral Nickname': refUser.nickname || ''
    };
  });
}

async function main() {
  try {
    console.log('Exporting Creapure payments to Excel...');
    const [usersMap, payments] = await Promise.all([
      fetchUsersMap(),
      fetchPayments(),
    ]);

    const rows = await toRows(payments, usersMap);

    const headers = [
      'Payment ID',
      'Created At',
      'Amount EUR',
      'Amount KG',
      'User ID',
      'User Nickname',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Street',
      'House Number',
      'Addition',
      'City',
      'Postal',
      'Country',
      'Full Address',
      'Offers',
      'Referral Code',
      'Referral User ID',
      'Referral Nickname',
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers]);
    if (rows.length) {
      XLSX.utils.sheet_add_json(ws, rows, { header: headers, skipHeader: true, origin: 'A2' });
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Creapure Payments');

    const outDir = path.resolve(__dirname, 'exports');
    ensureDir(outDir);
    const fname = `creapure-payments-${new Date().toISOString().split('T')[0]}-${Date.now()}.xlsx`;
    const outPath = path.join(outDir, fname);

    XLSX.writeFile(wb, outPath);

    // Simple totals to stdout
    const totalEUR = payments.reduce((sum, p) => sum + (Number(p.amount_money) || 0), 0);
    const totalKG = payments.reduce((sum, p) => sum + (Number(p.amount_kilograms) || 0), 0);

    console.log(`✅ Exported ${rows.length} payments to: ${outPath}`);
    console.log(`ℹ️ Totals — EUR: €${totalEUR.toFixed(2)}, KG: ${totalKG}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to export payments:', err);
    process.exit(1);
  }
}

main();
