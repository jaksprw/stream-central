import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import HomePage from "@/pages/HomePage";
import ArchivePage from "@/pages/ArchivePage";
import DetailPage from "@/pages/DetailPage";
import PlayerPage from "@/pages/PlayerPage";
import SearchPage from "@/pages/SearchPage";
import GenrePage from "@/pages/GenrePage";
import ActorPage from "@/pages/ActorPage";
import WatchlistPage from "@/pages/WatchlistPage";
import ProfilePage from "@/pages/ProfilePage";
import WatchProvidersPage from "@/pages/WatchProvidersPage";
import FilterPage from "@/pages/FilterPage";
import AuthPage from "@/pages/AuthPage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/movies" element={<ArchivePage type="movie" />} />
            <Route path="/tv" element={<ArchivePage type="tv" />} />
            <Route path="/movie/:id" element={<DetailPage />} />
            <Route path="/tv/:id" element={<DetailPage />} />
            <Route path="/watch/:type/:id" element={<PlayerPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/genre/:type/:id" element={<GenrePage />} />
            <Route path="/actor/:id" element={<ActorPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/providers" element={<WatchProvidersPage />} />
            <Route path="/filter" element={<FilterPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
