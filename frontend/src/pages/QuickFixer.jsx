import React, { useEffect, useState } from "react";
import { getProducts, updateProduct } from "../client/database";
import { FaCopy } from "react-icons/fa";
import { Button, Form } from "antd";
import { Actions } from "../components/ScraperMaker";
import { BsHandThumbsUpFill } from "react-icons/bs";
import { FaExternalLinkSquareAlt } from "react-icons/fa";
import { useToast } from "../providers/Toast";
import { FaSave } from "react-icons/fa";
import { MdNavigateNext } from "react-icons/md";

export const QuickFixer = () => {
  const [products, setProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [storedActions, setStoredActions] = useState([]);
  const toast = useToast();

  const setStoredByIndex = (index, actions) => {
    setStoredActions((prev) => {
      const newActions = [...prev];
      newActions[index] = actions;
      return newActions;
    });
  };

  useEffect(() => {
    getProducts().then((products) => {
      const toFixProducts = products.filter(
        (product) => product.enabled && product.warning
      );
      toFixProducts.forEach((_) => {
        storedActions.push([]);
      });
      setProducts(toFixProducts);
    });
  }, []);

  const save = () => {
    const allProducts = products.map(async (product, index) => {
      if (storedActions[index].length === 0) return;
      await updateProduct(product.id, {
        scraper: storedActions[index],
        warning: false,
      });
    });
    Promise.all(allProducts).then(() => {
      toast.success("Products fixed");
      setProducts(products.filter((product) => product.warning));
      setCurrentIndex(0);
      setStoredActions([]);
    });
  };

  if (products.length === 0) return <NothingToFix />;

  return (
    <div>
      <Counter currentIndex={currentIndex + 1} total={products.length} />
      <FixCard
        product={products[currentIndex]}
        setStoredActions={(actions) => setStoredByIndex(currentIndex, actions)}
        storedActions={storedActions[currentIndex]}
        index={currentIndex}
      />
      <NavigateButtons
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
        total={products.length}
        save={save}
      />
    </div>
  );
};

const NavigateButtons = ({ currentIndex, setCurrentIndex, total, save }) => {
  const previous = () => {
    if (currentIndex === 0) return;
    setCurrentIndex(currentIndex - 1);
  };
  const next = () => {
    if (currentIndex === total - 1) return;
    setCurrentIndex(currentIndex + 1);
  };

  return (
    <div className="flex gap-4 py-4 justify-between">
      <Button onClick={previous}>Previous</Button>
      <Button
        onClick={currentIndex == total - 1 ? save : next}
        icon={currentIndex === total - 1 ? <FaSave /> : <MdNavigateNext />}
      >
        {currentIndex === total - 1 ? "Save" : "Next"}
      </Button>
    </div>
  );
};

const Counter = ({ currentIndex, total }) => {
  return (
    <h1 className="bg-eiwit-orange font-bold text-white w-fit rounded-md p-2">
      {currentIndex} / {total}
    </h1>
  );
};

const NothingToFix = () => {
  return (
    <h1 className="flex items-center gap-2 text-2xl">
      <BsHandThumbsUpFill />
      No products to fix
    </h1>
  );
};

const FixCard = ({ product, setStoredActions, storedActions, index }) => {
  return (
    <div className="p-4" key={index}>
      <div className="flex gap-4 justify-between my-10">
        <h1 className="text-xl font-bold">{product.name}</h1>
        <div className="flex gap-2 items-center">
          <FlyTo url={product.url} />
          <CopyUrl url={product.url} />
        </div>
      </div>
      <Form
        initialValues={{
          scraper: storedActions,
        }}
        onValuesChange={(_, allValues) => {
          setStoredActions(allValues.scraper);
        }}
      >
        <Actions url={product.url} />
      </Form>
    </div>
  );
};

const CopyUrl = ({ url }) => {
  return (
    <div className="max-w-1/3">
      <Button
        onClick={() => navigator.clipboard.writeText(url)}
        icon={<FaCopy />}
      >
        <span>{url.slice(0, 30)}...</span>
      </Button>
    </div>
  );
};

const FlyTo = ({ url }) => (
  <Button href={url} target="_blank" icon={<FaExternalLinkSquareAlt />} />
);
