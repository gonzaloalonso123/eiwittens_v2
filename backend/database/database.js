const { FieldValue } = require("firebase-admin/firestore");
const fs = require("fs/promises");
const path = require("path");
const { db } = require("./firebase");

const Products = db.collection("products");

let migrationRunning = false;

const migrate = async () => {
  if (migrationRunning) {
    console.log("Migration is already running. Please wait until it completes.");
    return;
  }
  migrationRunning = true;
  console.log("Executing migration...");
  let products = await getProducts();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.resolve(`./product-backup-${timestamp}.json`);
  try {
    await fs.writeFile(backupPath, JSON.stringify(products, null, 2));
    console.log(`✅ Backup created at ${backupPath}`);
  } catch (err) {
    console.error("❌ Failed to create backup", err);
    return;
  }
  products.forEach(changeTypeOfPreworkout)
  for (const product of products) {
    await updateProduct(product.id, product);
    console.log(`Updated product ${product.id}`);
  }
  console.log("✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅")
  console.log("Migration completed successfully.");
  console.log("✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅")
  migrationRunning = false;
};

const subtypes = ["beta_alanine", "l_citrulline", "tyrosine", "taurine", "caffeine_tablets"];
const changeTypeOfPreworkout = async (product) => {
  if (product.type === "preworkout" && product.subtypes && product.subtypes.some(subtype => subtypes.includes(subtype))) {
    product.type = "preworkout_ingredient";
  }
}


const getProducts = async () => {
  const data = [];

  try {
    const querySnapshot = await Products.get();
    querySnapshot.forEach((doc) => {
      data.push({ ...doc.data(), id: doc.id });
    });
  } catch (e) {
    console.log(e);
  }
  return data;
};

const updateProduct = async (id, data) => {
  if (!id) return;
  const docRef = Products.doc(id);
  await docRef.update(data);
  const updatedDoc = await docRef.get();
  return updatedDoc.data();
};

const addTimeInTopTenToProduct = async (id) => {
  const docRef = Products.doc(id);
  docRef.update({
    count_top10: FieldValue.arrayUnion(new Date().toISOString()),
  });
};

const addClickedTimeToProduct = async (id, extra) => {
  const docRef = Products.doc(id);
  const newClick = {
    date: new Date().toISOString(),
  };
  if (extra) {
    newClick[extra] = true;
  }
  docRef.update({
    count_clicked: FieldValue.arrayUnion(newClick),
  });
};

const getRogiersFavorites = async () => {
  const rogiersFavorites = [];
  await db
    .collection("rogiers_favorites")
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        rogiersFavorites.push(doc.id);
      });
    });

  return rogiersFavorites;
};

const createCreapurePayment = async (payment) => {
  Object.keys(payment).forEach((key) => {
    if (payment[key] === undefined) {
      delete payment[key];
    }
  });

  const referralCode = payment.referralCode || "";
  if (referralCode) {
    const user = await getUserByReferralCode(referralCode);
    if (user) {
      payment.referralUserId = user.userId;
    } else {
      payment.referralUserId = null;
    }
  }

  payment.createdAt = FieldValue.serverTimestamp();
  db.collection("creapure-payments").doc(payment.paymentId).set({
    ...payment,
  });
  return payment.paymentId;
};


const getReferralCounts = async () => {
  const referralCounts = {};

  const users = [];
  // First, get all users with nicknames and give them 1 participation ticket
  const usersQuerySnapshot = await db.collection("creapure-users").where("nickname", "!=", "").get();
  usersQuerySnapshot.forEach((doc) => {
    const userData = doc.data();
    if (userData.nickname) {
      referralCounts[userData.nickname] = 0;
    }
    users.push({ id: doc.id, ...userData });
  });

  // Then, add additional tickets from referrals
  const paymentsQuerySnapshot = await db.collection("creapure-payments").get();
  paymentsQuerySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.referralCode) {
      if (!referralCounts[data.referralCode]) {
        referralCounts[data.referralCode] = 1;
      } else {
        referralCounts[data.referralCode] += data.amount_kilograms;
      }
    }
    const user = users.find(user => user.id === data.userId);
    if (user && user.nickname) {
      if (referralCounts[user.nickname]) {
        referralCounts[user.nickname] += data.amount_kilograms;
      }
      else {
        referralCounts[user.nickname] = data.amount_kilograms || 0;
      }
    }
  });

  randomUserNames.forEach(name => {
    if (!referralCounts[name]) {
      referralCounts[name] = 0;
    }
  });

  return referralCounts;
}

const randomUserNames = [
  "krachtpatser",
  "spierbundel",
  "creatinewinnar",
  "fitness8fanaat",
  "gymheld",
  "krachtkoning",
  "GANDALF",
  "Huuuuuuuuu",
  "TheRock",
  "KROKSONSTEROIDS",
  "MUSCLEMASTER",
  "BicepsBeast",
  "DeadliftDynamo",
  "DAANKP",
  "Tomas97",
  "GaryTheCat",
  "GOO77",
]

const getUserByReferralCode = async (referralCode) => {
  const querySnapshot = await db.collection("creapure-users").where("nickname", "==", referralCode).get();
  if (querySnapshot.empty) {
    return null;
  }
  const userDoc = querySnapshot.docs[0];
  return {
    userId: userDoc.id,
    ...userDoc.data(),
  };
}

const createCreapureUser = async (userId, userData) => {
  const userRef = db.collection("creapure-users").doc(userId);
  await userRef.set({
    ...userData,
    createdAt: FieldValue.serverTimestamp(),
  });
  return userId;
};

const amounts = {
  1: 28.00,
  2: 50.00,
  3: 70.00,
  4: 88.00,
  5: 110.00
}


const addAmountToGoal = async (amount) => {
  const docRef = db.collection("creapure-amount").doc("1");
  await docRef.update({
    amount_money: FieldValue.increment(amounts[amount] || 0),
    amount_kilograms: FieldValue.increment(amount || 0)
  });
}


const addNicknameToUser = async (userId, nickname) => {
  const docRef = db.collection("creapure-users").doc(userId);
  await docRef.update({
    nickname: nickname || '',
    affiliate_url: nickname ? `https://gieriggroeien.nl/creapure-crowdfund-actie/?ref=${nickname}` : ''
  });
  return nickname || '';
};

const getCreapureUser = async (userId) => {
  const docRef = db.collection("creapure-users").doc(userId);
  const doc = await docRef.get();
  if (!doc.exists) {
    return null;
  }
  return doc.data();
}

const checkIfNicknameExists = async (nickname) => {
  const querySnapshot = await db.collection("creapure-users").where("nickname", "==", nickname).get();
  return !querySnapshot.empty;
};

const getAmountGoal = async () => {
  const docRef = db.collection("creapure-amount").doc("1");
  const doc = await docRef.get();
  if (!doc.exists) {
    return 0;
  }
  const data = doc.data();
  const totalAmount = (data.amount_kilograms || 0) + (data.extra_amount || 0);
  return {
    totalAmount: totalAmount,
    totalKilograms: totalAmount,
  };
};

const createCreapureAffiliate = async ({ userCode, userName }) => {
  db.collection("creapure-affiliates").doc(userCode).set({
    userName,
    tickets: 0,
    createdAt: FieldValue.serverTimestamp(),
  });
  return userCode;
};

const addTicketToAffiliate = async (userCode) => {
  const docRef = db.collection("creapure-affiliates").doc(userCode);
  await docRef.update({
    tickets: FieldValue.increment(1),
  });
};

module.exports = {
  getProducts,
  createCreapureUser,
  updateProduct,
  getCreapureUser,
  addAmountToGoal,
  getAmountGoal,
  addTimeInTopTenToProduct,
  addClickedTimeToProduct,
  getRogiersFavorites,
  createCreapurePayment,
  addNicknameToUser,
  checkIfNicknameExists,
  getReferralCounts,
  migrate,
};

