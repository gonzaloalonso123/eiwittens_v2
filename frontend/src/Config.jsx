import { ConfigProvider } from "antd";

const theme = {
  token: {
    colorPrimary: "#00BED1",
    borderRadius: "10px",
  },
  components: {
    Button: {
      colorPrimary: "#00BED1",
      algorithm: "lighten",
    },
  },
};

export const Config = ({ children }) => (
  <ConfigProvider theme={theme}>{children}</ConfigProvider>
);
