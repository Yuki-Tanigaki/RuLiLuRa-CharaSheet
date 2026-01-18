// test/pages/sheets/catalogSheet/CatalogTest.jsx
import React, { useState } from "react";
import CatalogSheet from "/src/pages/sheets/catalogSheet/CatalogSheet.jsx";
import config from "/data/registry.json";

function makeEmptyUserCatalog() {
  const cats = config?.categories ?? {};
  const data = {};
  for (const k of Object.keys(cats)) data[k] = [];
  return { version: 1, data };
}

export default function CatalogTest() {
  // CatalogSheet が期待している state 形にする
  const [state, setState] = useState(() => ({
    userCatalog: makeEmptyUserCatalog(),
  }));

  return <CatalogSheet state={state} setState={setState} />;
}
