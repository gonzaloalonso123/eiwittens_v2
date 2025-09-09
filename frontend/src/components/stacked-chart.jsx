import { useState, useEffect } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { LineChartIcon, BarChart3Icon, AreaChartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export function StackedChart({ data, legend }) {
  const [displayData, setDisplayData] = useState > [];
  const [chartType, setChartType] = useState("line");

  useEffect(() => {
    setDisplayData(data.map((item) => ({ ...item })));
  }, [data]);

  const chartConfig = legend.reduce((acc, item) => {
    const colorIndex =
      Math.abs(
        item.key.split("").reduce((a, b) => a + b.charCodeAt(0), 0) % 10
      ) + 1;

    return {
      ...acc,
      [item.key]: {
        label: item.name,
        color: `hsl(var(--chart-${colorIndex}))`,
      },
    };
  }, {});

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col space-y-4 w-full md:w-64">
            <div className="flex gap-2">
              <Button
                variant={chartType === "line" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType("line")}
                className="flex items-center gap-2"
              >
                <LineChartIcon className="h-4 w-4" />
                Line
              </Button>
              <Button
                variant={chartType === "area" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType("area")}
                className="flex items-center gap-2"
              >
                <AreaChartIcon className="h-4 w-4" />
                Area
              </Button>
              <Button
                variant={chartType === "bar" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType("bar")}
                className="flex items-center gap-2"
              >
                <BarChart3Icon className="h-4 w-4" />
                Bar
              </Button>
            </div>

            <LegendSelector
              data={data}
              displayData={displayData}
              setDisplayData={setDisplayData}
              legend={legend}
            />
          </div>

          <div className="flex-grow">
            <ChartContainer config={chartConfig} className="min-h-[350px]">
              {chartType === "line" && (
                <LineChart
                  accessibilityLayer
                  data={displayData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {displayData[0] &&
                    Object.keys(displayData[0])
                      .filter((key) => key !== "name")
                      .map((key) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={`var(--color-${key})`}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      ))}
                </LineChart>
              )}

              {chartType === "area" && (
                <AreaChart
                  accessibilityLayer
                  data={displayData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {displayData[0] &&
                    Object.keys(displayData[0])
                      .filter((key) => key !== "name")
                      .map((key) => (
                        <Area
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={`var(--color-${key})`}
                          fill={`var(--color-${key})`}
                          fillOpacity={0.2}
                          stackId="1"
                        />
                      ))}
                </AreaChart>
              )}

              {chartType === "bar" && (
                <BarChart
                  accessibilityLayer
                  data={displayData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {displayData[0] &&
                    Object.keys(displayData[0])
                      .filter((key) => key !== "name")
                      .map((key) => (
                        <Bar
                          key={key}
                          dataKey={key}
                          fill={`var(--color-${key})`}
                          radius={[4, 4, 0, 0]}
                        />
                      ))}
                </BarChart>
              )}
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LegendSelector({ data, displayData, setDisplayData, legend }) {
  const toggleShow = (key) => {
    if (displayData[0]?.[key] !== undefined) {
      setDisplayData(
        displayData.map((obj) => {
          const newObj = { ...obj };
          delete newObj[key];
          return newObj;
        })
      );
    } else {
      setDisplayData(
        displayData.map((obj, i) => ({ ...obj, [key]: data[i]?.[key] || 0 }))
      );
    }
  };

  return (
    <div className="flex flex-col max-h-72 overflow-auto border rounded-md p-3 space-y-2">
      {legend.map((item, index) => {
        const colorIndex =
          Math.abs(
            item.key.split("").reduce((a, b) => a + b.charCodeAt(0), 0) % 10
          ) + 1;

        return (
          <div key={index} className="flex items-center gap-3">
            <Checkbox
              id={`legend-${index}`}
              checked={displayData[0]?.[item.key] !== undefined}
              onCheckedChange={() => toggleShow(item.key)}
            />
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: `hsl(var(--chart-${colorIndex}))` }}
              />
              <label
                htmlFor={`legend-${index}`}
                className="text-sm cursor-pointer"
              >
                {item.name}
                <span className="ml-1 font-semibold text-primary">
                  [{item.clicks}]
                </span>
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
}
