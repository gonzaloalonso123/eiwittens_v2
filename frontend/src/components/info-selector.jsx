import { BarChart3Icon, LineChartIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function InfoSelector({ selectedOption, setter }) {
  return (
    <ToggleGroup
      type="single"
      value={selectedOption}
      onValueChange={(value) => value && setter(value)}
    >
      <ToggleGroupItem value="total" aria-label="Total clicks">
        <LineChartIcon className="h-4 w-4 mr-2" />
        Total Clicks
      </ToggleGroupItem>
      <ToggleGroupItem value="by_product" aria-label="By product">
        <BarChart3Icon className="h-4 w-4 mr-2" />
        By Product
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
