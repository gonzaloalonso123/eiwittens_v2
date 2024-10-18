import { ConfigProvider } from "antd";

const theme = {
	primaryColor: "#00BED1",
	token: {
		colorPrimary: "#00BED1",
		borderRadius: "10px",
	},
	components: {
		Button: {
			colorPrimary: "#00BED1",
			algorithm: "lighten",
		},
		Input: {
			colorPrimary: "#00BED1",
		},
	},
};

export const Config = ({ children }) => (
	<ConfigProvider theme={theme}>{children}</ConfigProvider>
);
