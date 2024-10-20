import React, { useEffect, useState } from "react";
import { Button, Checkbox, Form, Input, Select, Spin, Tabs } from "antd";
import { Actions } from "../components/ScraperMaker";
import { FaRegEdit } from "react-icons/fa";
import { FaSave } from "react-icons/fa";
import {
	defaultProduct,
	discountTypes,
	productSubtypes,
	productTypes,
} from "../assets/content/content";
import {
	CategorySection,
	FormSelectInput,
	FormTextInput,
} from "../components/Form";
import { useParams } from "react-router-dom";
import {
	createProduct,
	getProductById,
	updateProduct,
} from "../client/database";
import { LoadingOutlined } from "@ant-design/icons";
import { LineChart } from "../components/LineChart";
import { Stats } from "../components/Stats";
import { formatDate } from "../helpers/helpers";
import { useToast } from "../providers/Toast";
import { MdError } from "react-icons/md";

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

	useEffect(() => {
		if (id) {
			setLoading(true);
			getProductById(id).then((product) => {
				setLoading(false);
				setInitialValues(product);
			});
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
			{id && (
				<Tabs
					defaultActiveKey={activeTab}
					style={{ marginBottom: 32 }}
					items={tabItems}
					onChange={onTabChange}
				/>
			)}
			{activeTab === "info" && (
				<ProductForm initialValues={initialValues} submit={submit} />
			)}
			{activeTab === "stats" && <ProductStats product={initialValues} />}
		</div>
	);
};

const ProductFormHeader = ({ title, disabled, setDisabled, warning }) => {
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
			{title != "New Product" && (
				<Button
					onClick={() => setDisabled(!disabled)}
					className="ml-10"
					type="primary"
					icon={<FaRegEdit />}
				>
					{disabled ? "Edit" : "Cancel"}
				</Button>
			)}
		</div>
	);
};

const ProductForm = ({ initialValues, submit }) => {
	const [disabled, setDisabled] = useState(initialValues.id !== undefined);
	const [form] = Form.useForm();
	const url = Form.useWatch("url", form);
	const selectedType = Form.useWatch("type", form);
	const submitAndDisable = (values) => {
		submit(values);
		setDisabled(true);
	};
	return (
		<>
			<ProductFormHeader
				disabled={disabled}
				setDisabled={setDisabled}
				title={initialValues.name || "New Product"}
				warning={initialValues.warning || false}
			/>
			<Form
				{...formSettings}
				initialValues={initialValues}
				disabled={disabled}
				form={form}
				onFinish={submitAndDisable}
			>
				<CategorySection title="General">
					<FormTextInput label="Product Name" name="name" />
					<FormTextInput label="Store" name="store" />
					<FormTextInput label="URL" name="url" />
					<FormTextInput label="Ammount" name="ammount" />
					<FormTextInput label="Protein per 100g" name="protein_per_100g" />
					<FormTextInput label="Image name" name="image" />
					<FormTextInput label="Trust Pilot URL" name="trustpilot_url" />
					<FormSelectInput
						options={productTypes}
						name="type"
						label="Product type"
					/>
					<FormSelectInput
						options={productSubtypes[selectedType] ?? []}
						name="subtype"
						label="Subtype"
					/>
					<FormTextInput label="Price" name="price" />
				</CategorySection>
				<CategorySection title="Discounts">
					<FormSelectInput
						options={discountTypes}
						name="discount_type"
						label="Discount type"
					/>
					<FormTextInput label="Discount code" name="discount_code" />
					<FormTextInput label="Discount value" name="discount_value" />
				</CategorySection>
				<CategorySection title="Enable/Disable">
					<Form.Item name="enabled" valuePropName="checked" label="Enabled">
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
						<Button
							type="primary"
							htmlType="submit"
							size="large"
							className="mt-10"
							icon={<FaSave />}
						>
							Submit
						</Button>
					</Form.Item>
				)}
			</Form>
		</>
	);
};

const ProductStats = ({ product }) => {
	const preparedData = product.price_history.map((history) => ({
		x: formatDate(history.date),
		y: history.scrapedData,
	}));

	return (
		<div>
			<Stats
				count_top10={product.count_top10}
				count_clicked={product.count_clicked}
			/>
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
