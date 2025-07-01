import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import ShopOwnerDashboard from "./pages/ShopOwnerDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import ShopSetup from "./pages/ShopSetup";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/shop-owner-dashboard" element={<ShopOwnerDashboard />} />
        <Route path="/customer-dashboard" element={<CustomerDashboard />} />
        <Route path="/shop-setup" element={<ShopSetup />} />
      </Routes>
    </Router>
  );
}

export default App;
