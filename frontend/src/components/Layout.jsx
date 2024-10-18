import React from "react";
import { Layout, Menu } from "antd";
import { FaListAlt } from "react-icons/fa";
import { IoMdAddCircle } from "react-icons/io";
import { SlActionRedo } from "react-icons/sl";
import { AiFillThunderbolt } from "react-icons/ai";
import { FaBookOpen } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/images/logo.webp";
import { Status } from "./Status";
import { CurrentUser } from "./CurrentUser";

const { Sider } = Layout;

const items = [
	{
		label: "Products",
		icon: <FaListAlt />,
		key: "products",
	},
	{
		label: "Manage",
		icon: <SlActionRedo />,
		key: "manage",
	},
	{
		label: "Docs",
		icon: <FaBookOpen />,
		key: "docs",
	},
	{
		label: "Create Product",
		icon: <IoMdAddCircle />,
		key: "products/create",
	},
	{
		label: "Quick Fixer",
		icon: <AiFillThunderbolt />,
		key: "quick-fixer",
	},
];

export const Page = ({ children }) => {
	const navigate = useNavigate();

	const handleClick = (key) => {
		navigate(key);
	};

	return (
		<Layout>
			<Sidebar items={items} onClick={handleClick} />
			<Container>{children}</Container>
		</Layout>
	);
};

const Sidebar = ({ items, onClick }) => (
	<Sider className="bg-white h-screen fixed" width={300}>
		<div className="h-full flex flex-col justify-between">
			<div>
				<div className="flex w-full justify-center p-2 px-4 border-b items-center">
					<img src={Logo} className="w-full" />
				</div>
				<Menu mode="inline" items={items} onClick={(e) => onClick(e.key)} />
			</div>
			<div>
				<CurrentUser />
				<Status />
			</div>
		</div>
	</Sider>
);

const Container = ({ children }) => (
	<Layout
		style={{
			marginInlineStart: 300,
		}}
		className="bg-eiwit-blue"
	>
		<div className="mx-10 my-4 ">
			<div className="p-4 bg-white rounded-xl">{children}</div>
		</div>
	</Layout>
);
