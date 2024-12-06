import { Form, Input, Select } from "antd";

export const FormTextInput = ({ label, name }) => (
	<Form.Item name={name} label={label}>
		<Input />
	</Form.Item>
);

export const FormSelectInput = ({ options, name, label }) => (
	<Form.Item name={name} label={label}>
		<Select>
			{options.map((option, key) => (
				<Select.Option value={option.value} key={key}>
					{option.name}
				</Select.Option>
			))}
		</Select>
	</Form.Item>
);


export const FormMultiSelectInput = ({ options, name, label }) => (
	<Form.Item name={name} label={label}>
		<Select mode="multiple">
			{options.map((option, key) => (
				<Select.Option value={option.value} key={key}>
					{option.name}
				</Select.Option>
			))}
		</Select>
	</Form.Item>
);

export const CategorySection = ({ title, children }) => (
	<div className="border-t border-eiwit-orange mt-10">
		<div className="text-2xl bg-eiwit-orange text-white rounded-b-xl w-fit px-6 pt-0 mb-10 font-bold">
			{title}
		</div>
		{children}
	</div>
);
