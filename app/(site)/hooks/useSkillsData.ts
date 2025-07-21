"use client";

import { useState, useEffect } from "react";
import { Skill } from "../types/skills";

const dataCache = new Map<string, Skill>();

export const useSkillsData = () => {
  const [data, setData] = useState<Skill | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cacheKey = "/json/skills.json";

    if (dataCache.has(cacheKey)) {
      setData(dataCache.get(cacheKey)!);
      return;
    }

    fetch(cacheKey)
      .then((res) =>
        res.ok ? res.json() : Promise.reject(`HTTP ${res.status}`),
      )
      .then((result: Skill) => {
        dataCache.set(cacheKey, result);
        setData(result);
      })
      .catch((err) => setError(err.toString()));
  }, []);

  return { data, error };
};
