import { Button, Form, Select, Tabs } from 'antd'
import React, { useEffect, useState } from 'react'
import { FormSelectInput, FormTextInput } from '../components/Form'
import { applyDiscountToAllProductsOfStore, getBrandDiscounts, getProducts, removeDiscountFromAllProductsOfStore } from '../client/database'
import { discountTypes } from '../assets/content/content'
import { FaSave } from 'react-icons/fa'
import { useToast } from '../providers/Toast'
import { MdDelete } from 'react-icons/md'

const formSettings = {
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
}


export const BrandDiscounts = () => {
	const [activeTab, setActiveTab] = useState("active");

	const onTabChange = (key) => {
		setActiveTab(key);
	}

	return (
		<div className="py-4">
			<Tabs
				defaultActiveKey={activeTab}
				style={{ marginBottom: 32 }}
				items={tabItems}
				onChange={onTabChange}
			/>
			{activeTab === "active" && (
				<BrandDiscountList />
			)}
			{activeTab === "new" && <AddDiscount />}
		</div>
	)
}

const BrandDiscountList = () => {
	const [discounts, setDiscounts] = useState([])
	const toast = useToast();

	useEffect(() => {
		refresh();
	}, [])

	const refresh = () => {
		getBrandDiscounts().then((discounts) => {
			setDiscounts(discounts);
		})
	}

	return (
		<div>
			{discounts.length === 0 && <h1 className="text-xl font-semibold flex items-center gap-2 px-6 mb-10">No active discounts</h1>}
			{discounts.map((discount, key) => (
				<OneDiscount discount={discount} key={key} toast={toast} refresh={refresh} />
			))}
		</div>
	)
}

const OneDiscount = ({ discount, toast, refresh }) =>
	<div className="flex items-center justify-between px-6 py-4 border-t">
		<div>
			<h1 className='font-bold'>{discount.id}</h1>
			<p>{discount.discount_type}</p>
			<p>{discount.discount_code}</p>
			<p>{discount.discount_value}</p>
		</div>
		<div>
			<Button
				type="primary"
				icon={<MdDelete />}
				onClick={() => removeDiscountFromAllProductsOfStore(discount.id)
					.then(() => {
						refresh();
						toast.success("Discount removed");
					})
				} />
		</div>
	</div>


const AddDiscount = () => {
	const [brands, setBrands] = useState([])
	const toast = useToast();

	useEffect(() => {
		getProducts().then((products) => {
			const brands = products.map((product) => product.store);
			setBrands([...new Set(brands)]);
		});
	}, [])

	const submit = (values) => {
		applyDiscountToAllProductsOfStore(values.brand, values.discount_type, values.discount_value, values.discount_code).then(() => {
			toast.success("Product saved");
		})
	}


	return (
		<div className='py-4'>
			<h1 className="text-2xl font-bold flex items-center gap-2 px-6 mb-10">Brand discount</h1>
			<Form
				{...formSettings}
				onFinish={submit}
			>
				<FormSelectInput
					options={discountTypes}
					name="discount_type"
					label="Discount type"
				/>
				<FormTextInput label="Discount code" name="discount_code" />
				<FormTextInput label="Discount value" name="discount_value" />
				<Form.Item name="brand" label="Brand">
					<Select>
						{brands.map((brand, key) => (
							<Select.Option value={brand} key={key}>
								{brand}
							</Select.Option>
						))}
					</Select>
				</Form.Item>
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
						Apply
					</Button>
				</Form.Item>
			</Form>
		</div>
	)
}


const tabItems = [
	{
		label: "Active discounts",
		key: "active",
	},
	{
		label: "New",
		key: "new",
	},
];
