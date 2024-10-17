import { Button } from "antd";
import React, { useState } from "react";
import { pushToWordpress, scrapeAll } from "../client/backend";
import HackerVulture from "../assets/images/hacker_vulture_2.png";
import { useToast } from "../providers/Toast";

export const Manage = () => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const scrape = async () => {
    setLoading(true);
    await scrapeAll();
    setLoading(false);
    toast.success("Scraped and pushed to Wordpress");
  };
  const push = async () => {
    setLoading(true);
    await pushToWordpress();
    setLoading(false);
    toast.success("Pushed to Wordpress");
  };

  return (
    <div>
      <div className="rounded-md bg-gray-100 text-white text-2xl text-center p-4">
        <div className="flex gap-2 w-full">
          <img
            src={HackerVulture}
            alt="Hacker Vulture"
            className="w-1/2 mx-auto rounded-md"
          />
          <div className="flex flex-col gap-2 p-4 w-1/2">
            <h1 className="p-2 px-4 bg-white shadow-md rounded-md h-fit text-black mb-10 w-full">
              {loading
                ? "Yes, Sir!"
                : "Welcome back my Lord. What do you command?"}
            </h1>
            <Button
              onClick={scrape}
              loading={loading}
              disabled={loading}
              className="w-full"
            >
              Scrape And Push
            </Button>
            <Button
              onClick={push}
              loading={loading}
              disabled={loading}
              className="w-full"
            >
              Only Push
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
