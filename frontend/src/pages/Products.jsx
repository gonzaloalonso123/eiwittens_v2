import React, { useEffect, useState } from "react";
import { getProducts } from "../client/database";
import { ProductCard } from "../components/ProductCard";
import { Input, Select } from "antd";
import { productSubtypes, productTypes } from "../assets/content/content";

export const Products = () => {
	const [products, setProducts] = useState([]);
	const [filteredProducts, setFilteredProducts] = useState([]);

	useEffect(() => {
		getProducts().then((products) => {
			setProducts(products);
			setFilteredProducts(products);
		});
	}, []);

	return (
		<div>
			<Filters
				products={products}
				setFilteredProducts={setFilteredProducts}
				filteredProducts={filteredProducts}
			/>
			{filteredProducts.map((product, key) => (
				<ProductCard product={product} key={key} />
			))}
		</div>
	);
};

const Filters = ({ products, filteredProducts, setFilteredProducts }) => {
	const [search, setSearch] = useState("");
	const [type, setType] = useState("");
	const [subtype, setSubtype] = useState("");
	const [warning, setWarning] = useState(false);
	const [enabled, setEnabled] = useState("all");
	const [store, setStore] = useState("");

	useEffect(() => {
		const storedFilters = JSON.parse(localStorage.getItem('filters'));
		if (storedFilters) {
			setSearch(storedFilters.search);
			setType(storedFilters.type);
			setSubtype(storedFilters.subtype);
			setWarning(storedFilters.warning);
			setEnabled(storedFilters.enabled);
			setStore(storedFilters.store);
		}
	}, [])

	useEffect(() => {
		let filtered = products.filter((product) => {
			if (
				search &&
				!product.name.toLowerCase().includes(search.toLowerCase())
			) {
				return false;
			}
			if (store && !product.store.toLowerCase().includes(store.toLowerCase())) {
				return false;
			}
			if (enabled === "enabled" && !product.enabled) {
				return false;
			}
			if (enabled === "disabled" && product.enabled) {
				return false;
			}
			if (type && product.type !== type) {
				return false;
			}
			if (subtype && product.subtypes.includes(subtype)) {
				return false;
			}
			if (warning && !product.warning) {
				return false;
			}
			return true;
		});

		setFilteredProducts(filtered);
		localStorage.setItem('filters', JSON.stringify({ search, type, subtype, warning, enabled, store }));
	}, [search, type, subtype, warning, enabled, store, products]);

	return (
		<div className="flex gap-4 mt-4 mb-10 px-6">
			<Input
				className="border border-gray-300 p-2 rounded-md"
				placeholder="Search name"
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>
			<Input
				className="border border-gray-300 p-2 rounded-md"
				placeholder="Search Store"
				value={store}
				onChange={(e) => setStore(e.target.value)}
			/>
			<Select value={type} onChange={setType} className="w-96 h-10">
				<Select.Option>Type</Select.Option>
				{productTypes.map((type) => (
					<Select.Option value={type.value} key={type.value}>
						{type.name}
					</Select.Option>
				))}
			</Select>
			<Select value={subtype} onChange={setSubtype} className="w-96 h-10">
				<Select.Option>Subtype</Select.Option>
				{(productSubtypes[type] ?? []).map((subtype) => (
					<Select.Option value={subtype.value} key={subtype.value}>
						{subtype.name}
					</Select.Option>
				))}
			</Select>
			<Select value={warning} onChange={setWarning} className="w-96 h-10">
				<Select.Option value={false}>All</Select.Option>
				<Select.Option value={true}>Warning</Select.Option>
			</Select>
			<Select value={enabled} onChange={setEnabled} className="w-96 h-10">
				<Select.Option value="all">All</Select.Option>
				<Select.Option value="enabled">Enabled</Select.Option>
				<Select.Option value="disabled">Disabled</Select.Option>
			</Select>

			<div className="flex items-center gap-1">
				<label>{filteredProducts.length}</label> /
				<label>{products.length}</label>
			</div>
		</div>
	);
};
