const {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
  increment,
  FieldValue,
} = require("firebase/firestore");

const { db } = require("./firebase");

const getProducts = async () => {
  const productsRef = collection(db, "products");
  const querySnapshot = await getDocs(productsRef);
  const products = [];
  querySnapshot.forEach((doc) => {
    products.push({ ...doc.data(), id: doc.id });
  });
  return products;
};

const createProduct = async (product) => {
  const productsRef = collection(db, "products");
  await addDoc(productsRef, product);
};

const deleteProduct = async (id) => {
  await deleteDoc(doc(db, "products", id));
};

const updateProduct = async (id, product) => {
  const productRef = doc(db, "products", id);
  await updateDoc(productRef, product).catch((error) => {
    console.error("Error updating document: ", error);
  });
};

const addTimeInTopTenToProduct = async (id) => {
  const productRef = doc(db, "products", id);
  await updateDoc(productRef, {
    count_top10: increment(1),
  }).catch((error) => {
    console.error("Error updating document: ", error);
  });
};

const addClickedTimeToProduct = async (id) => {
  const productRef = doc(db, "products", id);
  await updateDoc(productRef, {
    count_clicked: increment(1),
  }).catch((error) => {
    console.error("Error updating document: ", error);
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
