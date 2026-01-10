import { useState } from "react";
import Home from "./pages/Home";
import HeroSheet from "./pages/HeroSheet";

export default function App() {
  const [mode, setMode] = useState("home");

  if (mode === "home") {
    return <Home onStart={() => setMode("edit")} />;
  }
  return <HeroSheet />;
}
