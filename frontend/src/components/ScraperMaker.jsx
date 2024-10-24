import { Input, Select } from "antd";
import { Button, Form } from "antd";
import { v4 as idv4 } from "uuid";
import { RiDeleteBin5Fill } from "react-icons/ri";
import { actionTypes, defaultAction } from "../assets/content/content";
import HackerVulture from "../assets/images/hacker_vulture.png";
import { testScraper } from "../client/backend";
import { useEffect, useState } from "react";
import { SiMinetest } from "react-icons/si";
import { IoMdAdd } from "react-icons/io";
import { MdError } from "react-icons/md";
import { FaCheckCircle } from "react-icons/fa";

const OneAction = ({ onChange, value, removeAction, error }) => {
	const setField = (field, fieldValue) => {
		onChange({ ...value, [field]: fieldValue });
	};
	return (
		<>
			<div
				className="flex gap-4 items-center w-full flex-col border rounded-md border-b-4 border-b-blue
       p-2"
			>
				<div className="flex gap-4 justify-between w-full items-center">
					<label className="text-2xl text-red-500">
						{error ? <MdError /> : ""}
					</label>
					<Button onClick={removeAction}>
						<RiDeleteBin5Fill />
					</Button>
				</div>
				<Select
					placeholder="Type"
					className="w-full"
					onChange={(value) => setField("type", value)}
					value={value.type}
				>
					{actionTypes.map((type, key) => (
						<Select.Option key={key} value={type.value}>
							{type.name}
						</Select.Option>
					))}
				</Select>
				<Select
					placeholder="Select by"
					className="w-full"
					onChange={(value) => setField("selector", value)}
					value={value.selector || "xpath"}
				>
					<Select.Option value="css">By CSS</Select.Option>
					<Select.Option value="xpath">By XPATH</Select.Option>
				</Select>

				<Input
					placeholder="XPATH"
					onChange={(e) => setField("xpath", e.target.value)}
					value={value.xpath}
				/>
				{value.type == "selectOption" && (
					<Input
						placeholder="Option Text"
						onChange={(e) => setField("optionText", e.target.value)}
						value={value.option}
					/>
				)}
			</div>
			{error && <ErrorDisplay error={error} />}
		</>
	);
};

const ErrorDisplay = ({ error }) => (
	<div className="bg-red-500/10 border-2 p-2 rounded-md border-red-500 text-red-500">
		<h1 className="flex items-center gap-2 my-4">
			<MdError /> {error.text}
		</h1>
		<ErrorImage screenshot={error.screenshot} />
	</div>
);

export const Actions = ({ url }) => {
	return (
		<Form.Item label="Scraper Actions" name="scraper">
			<ActionEditor url={url} />
		</Form.Item>
	);
};

const TestScraper = ({ actions, url, setError }) => {
	const [retrievedPrice, setRetrievedPrice] = useState(null);
	const [loading, setLoading] = useState(false);

	const test = async () => {
		setLoading(true);
		setError(null);
		const { price, error } = await testScraper(url, actions);
		setRetrievedPrice(price);
		console.log("retrieved", price);
		if (error.index != -1) {
			setError(error);
		}
		setLoading(false);
	};

	return (
		<div className="flex gap-6 p-4 rounded-md bg-gray-50 border">
			<img
				src={HackerVulture}
				alt="HackerVulture"
				className="h-24 w-24 rounded-md"
			/>
			<div className="flex flex-col w-full justify-between">
				<Button
					onClick={test}
					icon={<SiMinetest />}
					loading={loading}
					disabled={loading}
				>
					Test Scraper Actions
				</Button>
				{!loading && retrievedPrice != null && (
					<ScrapedDataDisplay scrapedData={retrievedPrice} />
				)}
			</div>
		</div>
	);
};

const ActionEditor = ({ onChange, value, url }) => {
	const editAction = (i, newAction) => {
		const newValue = [...value];
		newValue[i] = newAction;
		onChange(newValue);
	};

	const addAction = (action) => {
		onChange([...value, { ...action, id: idv4() }]);
	};

	const removeAction = (i) => {
		onChange(value.filter((_, index) => index !== i));
	};

	const [error, setError] = useState(null);
	return (
		<div className="flex flex-col gap-6">
			{value?.map((c, i) => (
				<OneAction
					onChange={(newAction) => editAction(i, newAction)}
					value={c}
					key={c.id}
					removeAction={() => removeAction(i)}
					error={error?.index === i ? error : null}
				/>
			))}
			<Button onClick={() => addAction(defaultAction)} icon={<IoMdAdd />}>
				Add Action
			</Button>
			<TestScraper actions={value} url={url} setError={setError} />
		</div>
	);
};

const ErrorImage = ({ screenshot }) => <div className="rounded-md">
	<h1 className="text-white rounded-tr-xl w-fit bg-red-500 px-3 py-1 rounded-tl-xl">Error Screenshot</h1>
	<img src={`data:image/png;base64,${screenshot}`} alt="Screenshot" className="rounded-md" />
</div>


const ScrapedDataDisplay = ({ scrapedData }) => {
	if (scrapedData == 0) {
		return (
			<h1 className="bg-red-500 font-bold flex items-center justify-center gap-2 p-1 text-white rounded-md">
				<MdError /> No Data Retrieved
			</h1>
		);
	}
	return (
		<h1 className="bg-green-500 font-bold flex items-center justify-center gap-2 p-1 text-white rounded-md">
			<FaCheckCircle /> Retrieved Data: {scrapedData}
		</h1>
	);
};
