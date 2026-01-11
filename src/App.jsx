// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import Home from "./pages/Home";
// import HeroSheet from "./pages/sheets/HeroSheet";
// import DivaSheet from "./pages/sheets/DivaSheet";
// import ArmoredSheet from "./pages/sheets/ArmoredSheet";

// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Home />} />
//         <Route path="/sheet/hero" element={<HeroSheet />} />
//         <Route path="/sheet/diva" element={<DivaSheet />} />
//         <Route path="/sheet/armored" element={<ArmoredSheet />} />
//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }


// src/App.jsx
import React, { useMemo } from "react";
import HeroSheetFeature from "./pages/Home.jsx";

export default function App() {
  return <HeroSheetFeature />;
}
