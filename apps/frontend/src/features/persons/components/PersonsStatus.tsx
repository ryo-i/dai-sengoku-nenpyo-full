import React from "react";

type PersonsStatusProps = {
  resourceLabel: string;
  tone: "loading" | "error";
};

export const PersonsStatus = ({ resourceLabel, tone }: PersonsStatusProps) => {
  const isError = tone === "error";
  const message = isError
    ? `${resourceLabel}の取得に失敗しました。`
    : `${resourceLabel}を読み込み中です...`;

  return (
    <section className="min-h-screen bg-slate-100 px-4 py-12 sm:px-6 lg:px-8">
      <div
        className={`mx-auto w-full max-w-3xl rounded-2xl border p-6 shadow-lg sm:p-8 ${isError ? "border-rose-200 bg-rose-50 shadow-rose-100/70" : "border-slate-200 bg-white shadow-slate-200/70"}`}
      >
        <p
          className={isError ? "font-semibold text-rose-700" : "text-slate-700"}
        >
          {message}
        </p>
      </div>
    </section>
  );
};
