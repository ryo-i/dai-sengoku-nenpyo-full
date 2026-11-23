import { useEffect, useState } from "react";
import { personApi } from "../api/person-api";
import type { Person } from "../types/person";

export const usePersons = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPersons = async () => {
      try {
        const data = await personApi.getAll();
        setPersons(data);
      } catch {
        setError("人物データの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchPersons();
  }, []);

  return { persons, loading, error };
};
