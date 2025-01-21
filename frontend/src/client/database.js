import { addDoc, collection, deleteDoc, deleteField, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { collapseTextChangeRangesAcrossMultipleVersions } from "typescript";

const getProducts = async () => {
  const productsRef = collection(db, "products");
  const querySnapshot = await getDocs(productsRef);
  const products = [];
  querySnapshot.forEach((doc) => {
    products.push({ ...doc.data(), id: doc.id });
  });
  return products;
};

const getBrandDiscounts = async () => {
  const brandDiscounts = collection(db, "brand_discounts");
  const querySnapshot = await getDocs(brandDiscounts);
  const discounts = [];
  querySnapshot.forEach((doc) => {
    discounts.push({ ...doc.data(), id: doc.id });
  });
  return discounts;
};

const createProduct = async (product) => {
  const productsRef = collection(db, "products");
  await addDoc(productsRef, product);
};

const createBrandDiscount = async (discount, brand) => {
  await setDoc(doc(db, "brand_discounts", brand), {
    ...discount,
  });
};

const deleteProduct = async (id) => {
  await deleteDoc(doc(db, "products", id));
};

const deleteBrandDiscount = async (brand) => {
  await deleteDoc(doc(db, "brand_discounts", brand));
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

const applyDiscountToAllProductsOfStore = async (store, discount_type, discount_value, discount_code) => {
  const products = await getProducts();
  products.forEach(async (product) => {
    if (product.store === store) {
      await updateProduct(product.id, {
        discount_type,
        discount_value,
        discount_code,
      });
    }
  });
  createBrandDiscount({ discount_type, discount_value, discount_code }, store);
};

const removeDiscountFromAllProductsOfStore = async (store) => {
  const products = await getProducts();
  products.forEach(async (product) => {
    if (product.store === store) {
      await updateProduct(product.id, {
        discount_type: "",
        discount_value: "",
        discount_code: "",
      });
    }
  });
  deleteBrandDiscount(store);
};

// const deleteAllProducts = async () => {
//   const products = await getProducts();
//   products.forEach(async (product) => {
//     await deleteProduct(product.id);
//   });
// };

const migrate = async () => {
  console.log("migrating");
  doStuff();
};

const doStuff = async () => {
  const products = await getProducts();
  products.forEach(async (product) => {
    if (product.type == "weight-gainer") {
      await updateProduct(product.id, {
        type: "weight_gainer",
      });
    }
  });
};

export { getProducts, createProduct, deleteProduct, updateProduct, getProductById, applyDiscountToAllProductsOfStore, removeDiscountFromAllProductsOfStore, getBrandDiscounts, migrate };
