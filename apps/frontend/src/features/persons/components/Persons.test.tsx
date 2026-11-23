import React from "react";
import { render, screen } from "@testing-library/react";
import Persons from "./Persons";
import { usePersons } from "../hooks/usePersons";
import { vi } from "vitest";

vi.mock("../hooks/usePersons", () => ({
  usePersons: vi.fn(),
}));

const mockedUsePersons = vi.mocked(usePersons);

describe("Persons", () => {
  it("ローディング中メッセージを表示する", () => {
    mockedUsePersons.mockReturnValue({
      persons: [],
      loading: true,
      error: null,
    });

    render(<Persons />);

    expect(
      screen.getByText("人物データを読み込み中です..."),
    ).toBeInTheDocument();
  });

  it("エラーメッセージを表示する", () => {
    mockedUsePersons.mockReturnValue({
      persons: [],
      loading: false,
      error: "人物データの取得に失敗しました。",
    });

    render(<Persons />);

    expect(
      screen.getByText("人物データの取得に失敗しました。"),
    ).toBeInTheDocument();
  });

  it("人物一覧を表示する", () => {
    mockedUsePersons.mockReturnValue({
      persons: [
        { id: 1, name: "織田信長" },
        { id: 2, name: "豊臣秀吉" },
      ],
      loading: false,
      error: null,
    });

    render(<Persons />);

    expect(screen.getByText("人物一覧")).toBeInTheDocument();
    expect(screen.getByText("2 名")).toBeInTheDocument();
    expect(screen.getByText("織田信長")).toBeInTheDocument();
    expect(screen.getByText("豊臣秀吉")).toBeInTheDocument();
  });
});
