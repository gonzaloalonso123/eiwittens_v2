import { useEffect, useState } from "react";
import { StackedChart } from "../components/StackedChart";
import { getProducts } from "../client/database";
import { ClickDistributionChart, PieChart } from "../components/PieChart";

const prepare = (products) => {
	let startDate = new Date("2024-10-24");
	let endDate = new Date();
	const data = []
	while (startDate <= endDate) {
		console.log(startDate.toISOString().split('T')[0]);
		const productClicks = {}
		products.forEach(product => {
			const clicks = product.count_clicked.filter(click => click.split('T')[0] === startDate.toISOString().split('T')[0]).length;
			productClicks[product.name] = clicks;
		})
		data.push({ name: startDate.toISOString().split('T')[0], ...productClicks });
		startDate.setDate(startDate.getDate() + 1);
	}
	return data;
}

const preparePieData = (products) => {
	const pieData = []
	products.
		filter(p => p.count_clicked?.length > 0)
		.sort((a, b) => b.count_clicked.length - a.count_clicked.length)
		.forEach((p, i) => {
			if (i < 5) {
				pieData.push({ name: `${p.store} - ${p.name}`, value: p.count_clicked.length });
			}
			else if (i === 5) {
				pieData.push({ name: "Other", value: 0 });
			}
			else {
				pieData[5].value += p.count_clicked.length;
			}
		})

	console.log(pieData);
	return pieData;
}


export const ProductsGeneralAnaltyics = () => {
	const [data, setData] = useState([])
	const [pieData, setPieData] = useState([])
	const [legend, setLegend] = useState([])

	useEffect(() => {
		getProducts().then((products) => {
			console.log(products);
			const d = prepare(products.filter(p => p.count_clicked?.length > 0));
			setData(d)
			setLegend(products
				.filter(p => p.count_clicked?.length > 0)
				.sort((a, b) => b.count_clicked.length - a.count_clicked.length)
				.map(p => ({ name: `${p.store} - ${p.name}`, key: p.name, clicks: p.count_clicked.length }))
			)
			const pieData = preparePieData(products)
			setPieData(pieData)
		});
	}, [])


	return (
		<div>
			<h1 className="text-2xl my-5 font-semibold">Clicks on time</h1>
			<StackedChart data={data} legend={legend} />
			<h1 className="text-2xl my-5 font-semibold">Click distribution</h1>
			<ClickDistributionChart data={pieData} />
		</div>
	)
}