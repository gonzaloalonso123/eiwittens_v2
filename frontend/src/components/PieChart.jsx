import { Cell, Pie, PieChart, Tooltip } from "recharts"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#00661B', '#00A13B'];

export const ClickDistributionChart = ({ data }) => {
	return (
		<PieChart width={220} height={220}>
			<Pie
				dataKey="value"
				isAnimationActive={false}
				data={data}
				cx="50%"
				cy="50%"
				outerRadius={80}
				fill="#8884d8"
				label
			>
				{data.map((entry, index) => (
					<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
				))}
			</Pie>
			<Pie dataKey="value" data={data} cx={500} cy={200} innerRadius={40} outerRadius={80} fill="#82ca9d" />
			<Tooltip />
		</PieChart>
	)
}