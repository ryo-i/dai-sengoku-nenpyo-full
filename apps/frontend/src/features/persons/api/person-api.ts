import { apiClient } from "@/lib/api-client";
import type { Person } from "../types/person";

export const personApi = {
  getAll: async (): Promise<Person[]> => {
    const response = await apiClient.get<Person[]>("/persons");
    return response.data;
  },
};
