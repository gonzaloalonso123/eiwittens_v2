const { db } = require("./firebase");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

const Products = db.collection("products");

const getProducts = async () => {
  const querySnapshot = await Products.get();
  const data = [];
  querySnapshot.forEach((doc) => {
    data.push(doc.data());
  });
  return data;
};

const updateProduct = async (id, data) => {
  console.log(id);
  if(!id) return;
  const docRef = Products.doc(id);
  await docRef.update(data);
  const updatedDoc = await docRef.get();
  return updatedDoc.data();
};

const addTimeInTopTenToProduct = async (id) => {
  //   const docRef = Products.doc(id);
  //   docRef.update({
  //     count_top10: admin.firestore.FieldValue.increment(1),
  //   });
};

const addClickedTimeToProduct = async (id) => {
  const docRef = Products.doc(id);
  docRef.get().then((doc) => {
    console.log("Someone clicked on", doc.data().name);
  });
  docRef.update({
    count_clicked: FieldValue.arrayUnion(new Date().toISOString()),
  });
};

module.exports = {
  getProducts,
  updateProduct,
  addTimeInTopTenToProduct,
  addClickedTimeToProduct,
};
