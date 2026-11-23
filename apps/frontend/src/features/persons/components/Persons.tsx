"use client";

import React from "react";
import { usePersons } from "../hooks/usePersons";
import { PersonsView } from "./PersonsView";
import { PersonsStatus } from "./PersonsStatus";

const Persons = () => {
  const { persons, loading, error } = usePersons();

  if (loading) {
    return <PersonsStatus resourceLabel="人物データ" tone="loading" />;
  }

  if (error) {
    return <PersonsStatus resourceLabel="人物データ" tone="error" />;
  }

  return <PersonsView persons={persons} />;
};

export default Persons;
