import { useEffect, useState } from "react";
import { StackedChart } from "../components/StackedChart";
import { getProducts } from "../client/database";
import { ClickDistributionChart, PieChart } from "../components/PieChart";
import { GrGraphQl } from "react-icons/gr";
import { MdAutoGraph } from "react-icons/md";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import rogier from "../assets/images/rogier.webp";
const { RangePicker } = DatePicker;

const prepareByProduct = (products, range) => {
  const { start, end } = range;
  const data = [];
  let currentDate = new Date(start);
  while (currentDate >= end) {
    const productClicks = {};
    products.forEach((product) => {
      const clicks = product.count_clicked?.filter(
        (click) =>
          click.date?.split("T")[0] === currentDate.toISOString().split("T")[0]
      ).length;
      productClicks[product.name] = clicks;
    });
    data.push({ name: start.toISOString().split("T")[0], ...productClicks });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return data;
};

const prepareByAllProducts = (products, range) => {
  const { start, end } = range;

  console.log(start, end);
  const currentDate = new Date(start);
  const data = [];
  while (currentDate >= end) {
    const clicks = products.reduce((acc, p) => {
      return (
        acc +
        p.count_clicked?.filter(
          (click) =>
            click.date?.split("T")[0] ===
            currentDate.toISOString().split("T")[0]
        ).length
      );
    }, 0);
    data.push({
      name: currentDate.toISOString().split("T")[0],
      clicks: clicks,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(data);
  return data;
};

const preparePieData = (products) => {
  const pieData = [];
  products
    .filter((p) => p.count_clicked?.length > 0)
    .sort((a, b) => b.count_clicked.length - a.count_clicked.length)
    .forEach((p, i) => {
      if (i < 5) {
        pieData.push({
          name: `${p.store} - ${p.name}`,
          value: p.count_clicked.length,
        });
      } else if (i === 5) {
        pieData.push({ name: "Other", value: 0 });
      } else {
        pieData[5].value += p.count_clicked.length;
      }
    });
  return pieData;
};

export const ProductsGeneralAnaltyics = () => {
  const [data, setData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [legend, setLegend] = useState([]);
  const [infoType, setInfoType] = useState("total");
  const [products, setProducts] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date("2024-10-24"),
    end: new Date(),
  });

  useEffect(() => {
    getProducts().then((products) => {
      const pieData = preparePieData(products);
      setPieData(pieData);
      setProducts(products);
    });
  }, []);

  useEffect(() => {
    if (products) {
      const productsWithClicks = products.filter(
        (p) => p.count_clicked?.length > 0
      );
      console.log(productsWithClicks);
      const d =
        infoType === "total"
          ? prepareByAllProducts(productsWithClicks, dateRange)
          : prepareByProduct(productsWithClicks, dateRange);
      setData(d);
      setLegend(
        infoType === "total"
          ? [
              {
                name: "Clicks",
                clicks: d.reduce((acc, e) => acc + e.clicks, 0),
                key: "clicks",
              },
            ]
          : products
              .filter((p) => p.count_clicked?.length > 0)
              .sort((a, b) => b.count_clicked.length - a.count_clicked.length)
              .map((p) => ({
                name: `${p.store} - ${p.name}`,
                key: p.name,
                clicks: p.count_clicked.length,
              }))
      );
    }
  }, [products, infoType, dateRange]);

  return (
    <div>
      <h1 className="text-2xl my-5 font-semibold">Clicks on time</h1>
      <InfoSelector setter={setInfoType} selectedOption={infoType} />
      <DateSelector setter={setDateRange} range={dateRange} />
      <StackedChart data={data} legend={legend} />
      <div className="flex gap-10 items-start">
        <div>
          <h1 className="text-2xl my-5 font-semibold">Click distribution</h1>
          <ClickDistributionChart data={pieData} />
        </div>
        <RogiersChoiceClicks products={products} />
      </div>
    </div>
  );
};

const RogiersChoiceClicks = ({ products }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!products) return;
    const count = products.reduce((acc, p) => {
      return (
        acc + p.count_clicked?.filter((click) => click.rogier_choice).length
      );
    }, 0);
    setCount(count);
  }, [products]);

  return (
    <div>
      <h1 className="text-2xl my-5 font-semibold">Rogiers choice clicks</h1>
      <div className="flex gap-2 items-end">
        <span className="text-6xl p-2 shadow-md h-fit">{count}</span>
        <img src={rogier} className="w-24" />
      </div>
    </div>
  );
};

const InfoSelector = ({ setter, selectedOption }) => {
  return (
    <div className="flex border divide-x rounded-md w-fit">
      <InfoSelectorOption
        icon={<GrGraphQl />}
        text="Total clicks"
        setter={() => setter("total")}
        selected={selectedOption == "total"}
      />
      <InfoSelectorOption
        icon={<MdAutoGraph />}
        text="By Product"
        setter={() => setter("by_product")}
        selected={selectedOption == "by_product"}
      />
    </div>
  );
};

const InfoSelectorOption = ({ icon, text, setter, selected }) => {
  return (
    <div
      className={`flex gap-2 w-fit items-center p-2 px-4 cursor-pointer ${
        selected ? "bg-gray-100" : "bg-white"
      }`}
      onClick={setter}
    >
      {icon}
      <label>{text}</label>
    </div>
  );
};

const DateSelector = ({ setter, range }) => {
  return (
    <div className="mt-4 w-64">
      <RangePicker
        picker="day"
        id={{
          start: "startInput",
          end: "endInput",
        }}
        value={[dayjs(range.start), dayjs(range.end)]}
        onChange={(date, dateString) =>
          setter({ start: new Date(date[0]), end: new Date(date[1]) })
        }
        minDate={dayjs("2024-10-24")}
        maxDate={dayjs()}
        format="DD-MM-YYYY"
      />
    </div>
  );
};
