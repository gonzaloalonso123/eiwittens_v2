import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

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

const getProductById = async (id) => {
  const productRef = doc(db, "products", id);
  const docSnap = await getDoc(productRef);
  if (docSnap.exists()) {
    return { ...docSnap.data(), id: docSnap.id };
  }
  return null;
};

const migrate = async () => {
  console.log("migrating");
  const products = await getProducts();
  const newProducts = products.map((product) => ({
    ...product,
    subtypes: product.subtypes.map((subtype) => {
      if (subtype == "whey") {
        return "whey_protein";
      }
      if (subtype == "isolate") {
        return "whey_isolate";
      }
      if (subtype == "vegan") {
        return "vegan_protein";
      }
	  else return subtype;
    }),
  }));
  newProducts.forEach(async (product) => {
    await updateProduct(product.id, product);
  });
  console.log(JSON.stringify(newProducts));
};

const deleteAllProducts = async () => {
  const products = await getProducts();
  products.forEach(async (product) => {
    await deleteProduct(product.id);
  });
};

export {
  getProducts,
  createProduct,
  deleteProduct,
  updateProduct,
  getProductById,
  migrate,
};
