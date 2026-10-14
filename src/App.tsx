import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Home from "./pages/Home";
import Members from "./pages/Members";
import MemberDetails from "./pages/MemberDetails";
import Claims from "./pages/Claims";
import Referrals from "./pages/Referrals";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/:id" element={<MemberDetails />} />
          <Route path="/claims" element={<Claims />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
