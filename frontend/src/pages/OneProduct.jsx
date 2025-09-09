import React, { useEffect, useState } from "react";
import { Button, Checkbox, Form, Spin, Tabs } from "antd";
import { Actions } from "../components/ScraperMaker";
import { FaRegEdit } from "react-icons/fa";
import { FaSave } from "react-icons/fa";
import { discountTypes, productSubtypes, productTypes } from "../assets/content/content";
import { CategorySection, FormMultiSelectInput, FormSelectInput, FormTextInput } from "../components/Form";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { createProduct, getProductById, updateProduct } from "../client/database";
import { LoadingOutlined } from "@ant-design/icons";
import { LineChart } from "../components/LineChart";
import { Stats } from "../components/Stats";
import { formatDate, makeCalculations } from "../helpers/helpers";
import { useToast } from "../providers/Toast";
import { MdError } from "react-icons/md";
import { IoDuplicate } from "react-icons/io5";

const formSettings = {
  name: "product",
  labelCol: {
    span: 6,
  },
  wrapperCol: {
    span: 18,
  },
  style: {
    maxWidth: 600,
  },
  autoComplete: "off",
  className: "ml-10",
};

export const OneProduct = () => {
  const { id } = useParams();
  const [initialValues, setInitialValues] = useState(defaultProduct);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const toast = useToast();
  const location = useLocation();
  const startingProduct = location.state?.startingProduct;

  useEffect(() => {
    if (id) {
      setLoading(true);
      getProductById(id).then((product) => {
        setLoading(false);
        setInitialValues(product);
      });
    } else if (startingProduct) {
      const { id, ...rest } = startingProduct;
      setInitialValues(rest);
    }
  }, [id]);

  const submit = (values) => {
    if (id) {
      updateProduct(id, values);
    } else {
      createProduct(values);
    }
    toast.success("Product saved");
  };

  if (loading)
    return (
      <div>
        <Spin indicator={<LoadingOutlined spin />} size="large" />
      </div>
    );

  const onTabChange = (key) => {
    setActiveTab(key);
  };

  return (
    <div className="py-4">
      {id && <Tabs defaultActiveKey={activeTab} style={{ marginBottom: 32 }} items={tabItems} onChange={onTabChange} />}
      {activeTab === "info" && <ProductForm initialValues={initialValues} submit={submit} />}
      {activeTab === "stats" && <ProductStats product={initialValues} />}
    </div>
  );
};

const ProductFormHeader = ({ title, disabled, setDisabled, warning, currentProduct }) => {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl flex justify-between items-center px-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        {title}
        {warning && (
          <div className="bg-red-500 rounded-full h-6 w-6 flex items-center justify-center">
            <MdError className="text-white" />
          </div>
        )}
      </h1>
      {currentProduct.id && (
        <div className="flex items-center">
          <Button onClick={() => setDisabled(!disabled)} className="ml-10" type="primary" icon={<FaRegEdit />}>
            {disabled ? "Edit" : "Cancel"}
          </Button>
          <Button
            className="ml-10"
            type="secondary"
            icon={<IoDuplicate />}
            onClick={() =>
              navigate("/products/create", {
                state: {
                  startingProduct: {
                    ...currentProduct,
                    name: `${currentProduct.name} [DUPLICATE]`,
                  },
                },
              })
            }
          >
            Duplicate
          </Button>
        </div>
      )}
    </div>
  );
};

const ProductForm = ({ initialValues, submit }) => {
  const [disabled, setDisabled] = useState(true);
  const [form] = Form.useForm();
  const url = Form.useWatch("url", form);
  const selectedType = Form.useWatch("type", form);
  const selectedSubtypes = Form.useWatch("subtypes", form);
  const selectedPrice = Form.useWatch("price", form);

  const submitAndDisable = (values) => {
    submit(values);
    setDisabled(true);
  };
  useEffect(() => {
    if (!initialValues.id) {
      setDisabled(false);
    }
  }, [initialValues]);

  useEffect(() => {
    const tempProduct = form.getFieldsValue();
    makeCalculations(tempProduct);
    form.setFieldsValue(tempProduct);
  }, [selectedPrice]);

  console.log(selectedType);

  return (
    <>
      <ProductFormHeader
        disabled={disabled}
        setDisabled={setDisabled}
        title={initialValues.name || "New Product"}
        warning={initialValues.warning || false}
        currentProduct={initialValues}
      />
      <Form {...formSettings} initialValues={initialValues} disabled={disabled} form={form} onFinish={submitAndDisable}>
        <CategorySection title="General">
          <FormTextInput label="Product Name" name="name" />
          <FormTextInput label="Store" name="store" />
          <FormTextInput label="URL" name="url" />
          <FormTextInput label="Ammount" name="ammount" />
          {selectedType == "proteine" || selectedType == "weight_gainer" ? (
            <FormTextInput label="Protein per 100g" name="protein_per_100g" />
          ) : selectedType == "creatine" ? (
            <FormTextInput label="Creatine per 100g" name="creatine_per_100g" />
          ) : null}
          <FormTextInput label="Image name" name="image" />
          <FormTextInput label="Trust Pilot URL" name="trustpilot_url" />
          <FormSelectInput options={productTypes} name="type" label="Product type" />
          <FormMultiSelectInput options={productSubtypes[selectedType] ?? []} name="subtypes" label="Subtypes" />
          {selectedType === "weight_gainer" && <FormTextInput label="Sugar per 100g" name="sugar_per_100g" />}
          {selectedType === "weight_gainer" && <FormTextInput label="Calories per 100g" name="calories_per_100g" />}
          {selectedType === "preworkout" && <FormTextInput label="Caffeine per 100g" name="caffeine_per_100g" />}
          {selectedType === "preworkout" && (
            <FormTextInput label="Beta alanine per 100g" name="beta_alanine_per_100g" />
          )}
          {selectedType === "preworkout" && <FormTextInput label="Citrulline per 100g" name="citrulline_per_100g" />}
          {selectedType === "preworkout" && <FormTextInput label="Tyrosine per 100g" name="tyrosine_per_100g" />}
          <FormTextInput label="Price" name="price" />
          <AutofieldsDetails form={form} selectedType={selectedType} />
        </CategorySection>
        <CategorySection title="Discounts">
          <FormSelectInput options={discountTypes} name="discount_type" label="Discount type" />
          <FormTextInput label="Discount code" name="discount_code" />
          <FormTextInput label="Discount value" name="discount_value" />
        </CategorySection>
        <CategorySection title="Enable/Disable">
          <Form.Item name="enabled" valuePropName="checked" label="Enabled">
            <Checkbox />
          </Form.Item>
          <Form.Item name="enabled_top10" valuePropName="checked" label="Enabled top 10">
            <Checkbox />
          </Form.Item>
          <Form.Item name="scrape_enabled" valuePropName="checked" label="Scraping enabled">
            <Checkbox />
          </Form.Item>
        </CategorySection>
        <CategorySection title="Scraper actions" name="scraper">
          <Actions url={url} />
        </CategorySection>
        <hr />
        {!disabled && (
          <Form.Item
            wrapperCol={{
              offset: 10,
              span: 4,
            }}
          >
            <Button type="primary" htmlType="submit" size="large" className="mt-10" icon={<FaSave />}>
              Submit
            </Button>
          </Form.Item>
        )}
      </Form>
    </>
  );
};

const ProductStats = ({ product }) => {
  const preparedData = product.price_history
    .filter((p) => p.scrapedData != 0)
    .map((history) => ({
      x: formatDate(history.date),
      y: history.scrapedData,
    }));

  console.log(preparedData);

  return (
    <div>
      <Stats count_top10={product.count_top10} count_clicked={product.count_clicked} />
      <LineChart data={preparedData} width={"100%"} height={400} />
    </div>
  );
};

const tabItems = [
  {
    label: "Information",
    key: "info",
  },
  {
    label: "Stats",
    key: "stats",
  },
];

const AutofieldsDetails = ({ form, selectedType }) => {
  return (
    <div className="border border-eiwit-blue p-4 rounded-md">
      {selectedType == "proteine" || selectedType == "weight_gainer" ? (
        <div className="flex items-center gap-2 justify-between">
          <p className="font-bold">Price 100g protein</p>
          <p>{form.getFieldValue("price_for_element_gram")}</p>
        </div>
      ) : null}
      {selectedType == "weight_gainer" ? (
        <div className="flex items-center gap-2 justify-between">
          <p className="font-bold">Price 100g calories:</p>
          <p>{form.getFieldValue("price_per_100_calories")}</p>
        </div>
      ) : null}
      {selectedType == "creatine" ? (
        <div className="flex items-center gap-2 justify-between">
          <p className="font-bold">Price 100g creatine:</p>
          <p>{form.getFieldValue("price_for_element_gram")}</p>
        </div>
      ) : null}
    </div>
  );
};
