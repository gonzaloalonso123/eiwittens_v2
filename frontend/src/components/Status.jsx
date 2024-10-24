import { useEffect, useState } from "react";
import { getStatus } from "../client/backend";
import { migrate } from "../client/database";

const useStatus = () => {
  const [status, setStatus] = useState(false);
  useEffect(() => {
    getStatus().then((status) => {
      setStatus(status);
    });
  }, []);
//   migrate();
  return status;
};

export const Status = () => {
  const status = useStatus();
  const color = status ? "bg-green-500" : "bg-red-500";
  return (
    <div className="flex items-center px-6 gap-2 w-full justify-between py-4 border-t">
      <h1>Status</h1>
      <div className={`w-4 h-4 rounded-full shadow-md ${color}`}></div>
    </div>
  );
};
