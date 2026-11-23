import { renderHook, waitFor } from "@testing-library/react";
import { usePersons } from "./usePersons";
import { personApi } from "../api/person-api";
import { vi } from "vitest";

vi.mock("../api/person-api", () => ({
  personApi: {
    getAll: vi.fn(),
  },
}));

describe("usePersons", () => {
  it("成功時にpersonsを設定する", async () => {
    vi.mocked(personApi.getAll).mockResolvedValue([
      { id: 1, name: "織田信長" },
      { id: 2, name: "豊臣秀吉" },
    ]);

    const { result } = renderHook(() => usePersons());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.persons).toEqual([
      { id: 1, name: "織田信長" },
      { id: 2, name: "豊臣秀吉" },
    ]);
  });

  it("失敗時にerrorを設定する", async () => {
    vi.mocked(personApi.getAll).mockRejectedValue(new Error("API Error"));

    const { result } = renderHook(() => usePersons());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.persons).toEqual([]);
    expect(result.current.error).toBe("人物データの取得に失敗しました。");
  });
});
