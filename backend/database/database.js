const {
  addDoc,
  collection,
  deleteDoc,
  doc,
} = require("firebase/firestore");
const { db } = require("./firebase");
const admin = require("firebase-admin");

const Products = db.collection("products");

const getProducts = async () => {
  const querySnapshot = await Products.get();
  const data = [];
  querySnapshot.forEach((doc) => {
    data.push(doc.data());
  });
  return data;
};

const createProduct = async (product) => {
  const productsRef = collection(db, "products");
  await addDoc(productsRef, product);
};

const deleteProduct = async (id) => {
  await deleteDoc(doc(db, "products", id));
};

const updateProduct = async (id, data) => {
  const docRef = Products.doc(id);
  await docRef.update(data);
  const updatedDoc = await docRef.get();
  return updatedDoc.data();
};

const addTimeInTopTenToProduct = async (id) => {
  const docRef = Products.doc(id);
  docRef.update({
    count_top10: admin.firestore.FieldValue.increment(1),
  });
};

const addClickedTimeToProduct = async (id) => {
  const docRef = Products.doc(id);

  docRef.update({
    count_clicked: admin.firestore.FieldValue.increment(1),
  });
};

module.exports = {
  getProducts,
  createProduct,
  deleteProduct,
  updateProduct,
  addTimeInTopTenToProduct,
  addClickedTimeToProduct,
};
