import React from "react";
import type { Person } from "../types/person";

type PersonsViewProps = {
  persons: Person[];
};

export const PersonsView = ({ persons }: PersonsViewProps) => {
  return (
    <section className="min-h-screen bg-slate-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70 sm:p-8">
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              人物一覧
            </h1>
          </div>
          <span className="shrink-0 rounded-full bg-slate-900 px-3 py-1.5 text-sm font-semibold text-slate-100 shadow-sm">
            {persons.length} 名
          </span>
        </div>

        <ul className="space-y-3">
          {persons.map((person) => (
            <li
              key={person.id}
              className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white shadow-sm">
                  {person.id}
                </div>
                <span className="text-lg font-semibold tracking-wide text-slate-800 group-hover:text-slate-950">
                  {person.name}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
