// src/context/CatalogProvider.jsx
import React, { createContext, useContext, useMemo } from "react";
import { createCatalogService } from "@/common/catalogService.js";

const CatalogContext = createContext(null);

export function CatalogProvider({ masterCatalogs, userCatalog, children }) {
  // S2/S3: 同期・pure な createCatalogService を useMemo で安定生成
  const service = useMemo(() => {
    if (!masterCatalogs) return null;
    return createCatalogService({ masterCatalogs, userCatalog });
  }, [masterCatalogs, userCatalog]);

  // S1: master ロード完了まで App が描画しない前提だが、
  // 念のため provider 単体でも落ちないようにしておく
  if (!service) return null;

  return <CatalogContext.Provider value={service}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error("useCatalog() must be used within <CatalogProvider>.");
  }
  return ctx;
}
