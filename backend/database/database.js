const { db } = require("./firebase");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

const Products = db.collection("products");

const getProducts = async () => {
  const querySnapshot = await Products.get();
  const data = [];
  querySnapshot.forEach((doc) => {
    data.push({ ...doc.data(), id: doc.id });
  });
  return data;
};

const updateProduct = async (id, data) => {
  console.log(id, data.type, data.price);
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

module.exports = {
  getProducts,
  updateProduct,
  addTimeInTopTenToProduct,
  addClickedTimeToProduct,
};
