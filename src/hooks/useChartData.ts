/**
 * useChartData — 通用数据加载 hook
 * 所有图表组件统一用这个加载 JSON 数据。
 *
 * 用法:
 *   const { data, loading, error } = useChartData<AnnualReturn[]>("shanghai", "annual-returns.json");
 */

"use client";

import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/constants";

interface UseChartDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useChartData<T>(
  indexSlug: string,
  filename: string
): UseChartDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const url = apiUrl(indexSlug, filename);
        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${url}`);
        }

        const json = await res.json();

        if (!cancelled) {
          setData(json as T);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "未知错误");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [indexSlug, filename]);

  return { data, loading, error };
}
