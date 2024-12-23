import { Checkbox } from "antd";
import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-white max-h-96 p-2 shadow-md rounded-md">
				{payload.filter(i => i.value > 0).map((item, index) => (
					<div key={index} className="p-2 flex gap-2 text-xs" style={{ color: item.color }}>
						<p>{item.dataKey}</p>
						<p>{item.value}</p>
					</div>
				))}
			</div>
		);
	}

	return null;
};

export const StackedChart = ({ data, legend }) => {
	const [displayData, setDisplayData] = useState([]);
	const [chartType, setChartType] = useState('line');
	const toggleChartType = () => {
		if (chartType === 'line') {
			setChartType('area');
		} else if (chartType === 'area') {
			setChartType('bar');
		} else {
			setChartType('line');
		}
	}
	useEffect(() => {
		setDisplayData(data.map(item => ({ ...item })));
	}, [data]);

	return (
		<div className="w-full flex">
			<div className="flex gap-2 flex-col">
				<button onClick={toggleChartType} className="hover:underline">Change chart [{chartType}]</button>
				<HideShowSelector data={data} displayData={displayData} setDisplayData={setDisplayData} legend={legend} />
			</div>
			<div className="flex-grow">
				{chartType === 'line' ? <StackedLine data={displayData} legend={legend} /> : chartType == 'area' ? <StackedArea data={displayData} legend={legend} /> : <StackedBar data={displayData} legend={legend} />}
			</div>
		</div>
	);
};

const StackedLine = ({ data }) => (
	<LineChart width={730} height={350} data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
		<CartesianGrid strokeDasharray="3 3" />
		<XAxis dataKey="name" />
		<YAxis />
		<Tooltip content={<CustomTooltip />} />
		{data[0] && Object.keys(data[0]).filter(key => key !== 'name').map((key, index) => (
			<Line type="monotone" dataKey={key} stroke={randomStrokeColor()} key={index} />
		))}
	</LineChart>
)

const StackedArea = ({ data }) => {
	const dataWithColors = data.map((item, index) => {
		const newItem = { ...item };
		Object.keys(item).filter(key => key !== 'name').forEach(key => {
			newItem[key] = { value: item[key], fill: randomStrokeColor() };
		});
		return newItem;
	});

	return (
		<AreaChart
			data={dataWithColors}
			width={730} height={350}
			margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
		>
			<defs>
				{
					dataWithColors[0] && Object.keys(dataWithColors[0]).filter(key => key !== 'name').map((key, index) => (
						<linearGradient key={index} id={dataWithColors[0][key].fill} x1="0" y1="0" x2="0" y2="1">
							{/* Adjust gradient stops to have a smooth transition */}
							<stop offset="0%" fill={dataWithColors[0][key].fill} stopOpacity={0.7} />
							<stop offset="100%" fill={dataWithColors[0][key].fill} stopOpacity={0} />
						</linearGradient>
					))
				}
			</defs>
			<XAxis dataKey="name" />
			<YAxis />
			<CartesianGrid strokeDasharray="3 3" />
			<Tooltip />
			{
				dataWithColors[0] && Object.keys(dataWithColors[0]).filter(key => key !== 'name').map((key, index) => (
					<Area
						key={index}
						type="monotone"
						dataKey={`${key}.value`}
						stroke={dataWithColors[0][key].fill}
						fillOpacity={0.1}
						fill={dataWithColors[0][key].fill}
					/>
				))
			}
		</AreaChart>
	);
};

const StackedBar = ({ data }) => {
	return (
		<BarChart width={730} height={350} data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
			<CartesianGrid strokeDasharray="3 3" />
			<XAxis dataKey="name" />
			<YAxis />
			<Tooltip />
			{
				data[0] && Object.keys(data[0]).filter(key => key !== 'name').map((key, index) => (
					<Bar dataKey={key} fill={randomStrokeColor()} key={index} />
				))
			}
		</BarChart>
	)
}

const HideShowSelector = ({ data, displayData, setDisplayData, legend }) => {
	const toggleShow = (key) => {
		if (displayData[0][key] !== undefined) {
			setDisplayData(displayData.map(obj => {
				const newObj = { ...obj };
				delete newObj[key];
				return newObj;
			}));
		} else {
			setDisplayData(displayData.map((obj, i) => ({ ...obj, [key]: data[i][key] })));
		}
	};

	return (
		<div className="flex flex-col max-h-72 overflow-auto border rounded-md p-2">
			{data.length > 0 && legend.map((item, index) => (
				<div key={index} className="flex items-center gap-2">
					<Checkbox onChange={() => toggleShow(item.key)} checked={displayData[0]?.[item.key] !== undefined} />
					<span>{item.name} <label className="font-semibold text-eiwit-blue">[{item.clicks}]</label></span>
				</div>
			))}
		</div>
	);
};

const randomStrokeColor = () => {
	const letters = '0123456789ABCDEF';
	let color = '#';
	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
};