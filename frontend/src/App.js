import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout, Page } from "./components/Layout";
import { Products } from "./pages/Products";
import { OneProduct } from "./pages/OneProduct";
import { Docs } from "./pages/Docs";
import { Manage } from "./pages/Manage";
import { Config } from "./Config";
import { ToastProvider } from "./providers/Toast";

import { App as AntdApp } from "antd";
import { QuickFixer } from "./pages/QuickFixer";

function App() {
  return (
    <AntdApp>
      <BrowserRouter>
        <Authenticator />
      </BrowserRouter>
    </AntdApp>
  );
}

const Authenticator = () => {
  return <AuthenticatedRoutes />;
};

const AuthenticatedRoutes = () => {
  return (
    <Config>
      <ToastProvider>
        <Page>
          <Routes>
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<OneProduct />} />
            <Route path="/products/create" element={<OneProduct />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/manage" element={<Manage />} />
            <Route path="/quick-fixer" element={<QuickFixer />} />
            <Route path="*" element={<h1>Not Found</h1>} />
          </Routes>
        </Page>
      </ToastProvider>
    </Config>
  );
};

export default App;
