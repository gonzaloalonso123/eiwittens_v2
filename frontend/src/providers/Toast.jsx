import React, { createContext, useContext } from "react";
import { App } from "antd";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const { message } = App.useApp();
  const success = (text) => {
    message.success(text);
  };

  const error = (text) => {
    message.error(text);
  };

  return (
    <ToastContext.Provider
      value={{
        success,
        error,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};
