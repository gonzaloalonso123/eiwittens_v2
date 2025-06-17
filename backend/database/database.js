const { db } = require("./firebase");
const { FieldValue } = require("firebase-admin/firestore");

const Products = db.collection("products");

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
      console.log(querySnapshot);
      querySnapshot.forEach((doc) => {
        rogiersFavorites.push(doc.id);
      });
    });

  return rogiersFavorites;
};

module.exports = {
  getProducts,
  updateProduct,
  addTimeInTopTenToProduct,
  addClickedTimeToProduct,
  getRogiersFavorites,
};
