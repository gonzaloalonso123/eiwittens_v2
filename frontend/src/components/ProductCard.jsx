import React from "react";
import { FaExclamation } from "react-icons/fa";
import { Link } from "react-router-dom";

export const ProductCard = ({ product }) => {
  return (
    <Link
      className="flex py-3 hover:bg-eiwit-blue hover:text-white font-bold w-full cursor-pointer px-4 rounded-md justify-between transition-all duration-75"
      to={`/products/${product.id}`}
    >
      <div className="flex items-center gap-2">
        <StoreDisplay store={product.store} enabled={product.enabled} />
        <h1 className={product.enabled ? "text-black" : "text-gray-400"}>
          {product.name}
        </h1>
      </div>
      {product.warning && <Warning />}
    </Link>
  );
};

const StoreDisplay = ({ store, enabled }) => (
  <h1
    className={`rounded-md font-bold text-white px-4 ${
      !enabled ? "bg-gray-400" : "bg-eiwit-orange"
    }`}
  >
    {store}
  </h1>
);

const Warning = () => {
  return (
    <div className="bg-black rounded-full h-6 w-6 flex items-center justify-center">
      <FaExclamation className="text-white" />
    </div>
  );
};
