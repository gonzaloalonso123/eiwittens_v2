import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout, Page } from "./components/Layout";
import { Products } from "./pages/Products";
import { OneProduct } from "./pages/OneProduct";
import { Docs } from "./pages/Docs";
import { Manage } from "./pages/Manage";
import { Config } from "./Config";
import { ToastProvider } from "./providers/Toast";
import RogerImage from "./assets/images/rogier.png";
import { App as AntdApp, Button } from "antd";
import { QuickFixer } from "./pages/QuickFixer";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./providers/AuthProvider";
import { BrandDiscounts } from "./pages/BrandDiscount";
import { useState } from "react";
import { ProductsGeneralAnaltyics } from "./pages/ProductsGeneralAnalytics";

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
  const [timoPopUpVisible, setTimoPopUpVisible] = useState(true);

  return timoPopUpVisible ? (
    <TimoPopUp close={() => setTimoPopUpVisible(false)} />
  ) : (
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
          <Route path="/general-analytics" element={<ProductsGeneralAnaltyics />} />
          <Route path="*" element={<h1>Not Found</h1>} />
        </Routes>
      </Page>
    </ToastProvider>
  );
};

export default App;

const TimoPopUp = ({ close }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 w-screen h-screen flex items-center justify-center">
      <div className="bg-white rounded-md shadow-md flex flex-col p-4 items-center justify-center">
        <img src={RogerImage} alt="Roger" className="w-24 h-24 rounded-full" />
        <h1 className="font-bold text-xl">You got this, Timo</h1>
        <p>Keep up the good work</p>
        <Button primary onClick={close}>
          Close
        </Button>
      </div>
    </div>
  );
};
