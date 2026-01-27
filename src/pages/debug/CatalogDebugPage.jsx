import React, { useEffect, useState } from "react";
import { buildAllCatalogs } from "@/common/catalog.js";

export default function CatalogDebugPage() {
  const [state, setState] = useState({ loading: true, data: null, err: null });

  useEffect(() => {
    (async () => {
      try {
        const all = await buildAllCatalogs();
        setState({ loading: false, data: all, err: null });
      } catch (e) {
        setState({ loading: false, data: null, err: String(e?.message ?? e) });
      }
    })();
  }, []);

  if (state.loading) return <div style={{ padding: 16 }}>loading...</div>;
  if (state.err) return <pre style={{ padding: 16, color: "crimson" }}>{state.err}</pre>;

  const keys = Object.keys(state.data ?? {}).sort();

  return (
    <div style={{ padding: 16 }}>
      <h1>Catalog Debug</h1>
      {keys.map((k) => {
        const cat = state.data[k];
        return (
          <details key={k} style={{ marginTop: 12 }}>
            <summary>
              {k} / {cat.label} (rows: {cat.list.length})
            </summary>
            <pre>{JSON.stringify(cat.list, null, 2)}</pre>
          </details>
        );
      })}
    </div>
  );
}
