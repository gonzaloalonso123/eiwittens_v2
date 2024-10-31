import React from "react";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import { Card, Col, Row, Statistic } from "antd";
import { LineChart } from "./LineChart";
import { formatDate } from "../helpers/helpers";

export const Stats = ({ count_top10, count_clicked }) => {
	const preparedClickData = count_clicked.reduce((acc, curr) => {
		const date = new Date(curr.split("T")[0]);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		const key = `${year}-${month < 10 ? "0" + month : month}-${day < 10 ? "0" + day : day}`;
		acc[key] = acc[key] ? acc[key] + 1 : 1;
		return acc;
	}, {});

	const preparedData = Object.keys(preparedClickData).map((key) => ({
		x: key,
		y: preparedClickData[key],
	}));

	return (
		<Row gutter={16}>
			<Col span={12}>
				<Card bordered={false}>
					<Statistic
						title="Times top 10"
						value={count_top10}
						precision={0}
						valueStyle={{
							color: "#3f8600",
						}}
						prefix={<ArrowUpOutlined />}
					/>
				</Card>
			</Col>
			<Col span={12}>
				<Card bordered={false}>
					<Statistic
						title="Times clicked"
						value={count_clicked.length}
						precision={0}
						valueStyle={{
							color: "#3f8600",
						}}
						prefix={<ArrowUpOutlined />}
					/>
					<LineChart data={preparedData} width={"100%"} height={200} />
				</Card>
			</Col>
		</Row>
	)
}