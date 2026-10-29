import { useEffect, useState } from "react";
import type { ChartRange } from "../lib/aggregate";
import { isChartRange } from "../lib/chart";

const KEY = "stats.chartRange";

function read(): ChartRange {
  try {
    const v = localStorage.getItem(KEY);
    return isChartRange(v) ? v : "7d";
  } catch {
    return "7d";
  }
}

export function useChartRange() {
  const [range, setRange] = useState<ChartRange>(read);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, range);
    } catch {
      /* private mode, bỏ qua */
    }
  }, [range]);

  return [range, setRange] as const;
}