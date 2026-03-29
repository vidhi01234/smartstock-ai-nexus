import CostIntelligence from "./pages/CostIntelligence"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "./pages/Login";
import { AppLayout } from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import SalesLogs from "./pages/SalesLogs";
import AIForecasts from "./pages/AIForecasts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
  <Route path="/login" element={<Login />} />

  <Route path="/" element={<AppLayout />}>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="inventory" element={<Inventory />} />
    <Route path="sales" element={<SalesLogs />} />
    <Route path="forecasts" element={<AIForecasts />} />
    <Route path="cost-intelligence" element={<CostIntelligence />} />
  </Route>

  <Route path="*" element={<NotFound />} />
</Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
