import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RogiersChoiceClicks({ products }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!products) return;
    const count = products.reduce((acc, p) => {
      return (
        acc +
        (p.count_clicked?.filter((click) => click.rogier_choice)?.length || 0)
      );
    }, 0);
    setCount(count);
  }, [products]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Rogier's Choice Clicks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 items-end">
          <div className="text-6xl font-bold text-primary">{count}</div>
          <img
            src="/placeholder.svg?height=96&width=96"
            alt="Rogier"
            className="w-24 h-24 rounded-full object-cover border-4 border-primary"
          />
        </div>
      </CardContent>
    </Card>
  );
}
