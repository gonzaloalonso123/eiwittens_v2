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
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./providers/AuthProvider";
import { BrandDiscounts } from "./pages/BrandDiscount";

function App() {
  return (
    <AntdApp>
      <Config>
        <BrowserRouter>
          <AuthProvider>
            <Authenticator />
          </AuthProvider>
        </BrowserRouter>
      </Config>
    </AntdApp>
  );
}

const Authenticator = () => {
  const { user } = useAuth();
  return user ? <AuthenticatedRoutes /> : <Login />;
};

const AuthenticatedRoutes = () => {
  return (
    <ToastProvider>
      <Page>
        <Routes>
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<OneProduct />} />
          <Route path="/products/create" element={<OneProduct />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/manage" element={<Manage />} />
          <Route path="/quick-fixer" element={<QuickFixer />} />
          <Route path="/brand-discounts" element={<BrandDiscounts />} />
          <Route path="*" element={<h1>Not Found</h1>} />
        </Routes>
      </Page>
    </ToastProvider>
  );
};

export default App;
