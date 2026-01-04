// src/App.js

import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

// ==== import halaman existing ====
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Item from "./pages/Item";
import Vendor from "./pages/Vendor";
import Navbar from "./components/Navbar";
import NotFound from "./pages/NotFound";
import Sidebar from "./components/Sidebar";

// ==== import halaman AHS (Updated) ====
import Ahs from "./pages/Ahs"; // <--- Import Component Baru
import AhsAdd from "./pages/AddAHS";

// ==== import data ====
import { AHS_LIST } from "./data/ahsData";
import { ITEM_LIST } from "./data/itemData";

import "./App.css";

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const AHS_API_URL = "http://127.0.0.1:8000/api/ahs";
  const location = useLocation();
  const isLoginPage = location.pathname === "/";

  // --- State Data Utama ---
  const [ahsData, setAhsData] = useState([]);

  
    const fetchDataAllAHS = async () => {
      try {
        const [itemsResponse] = await Promise.all([
          fetch(AHS_API_URL)
        ]);

        if (!itemsResponse.ok) throw new Error("Gagal mengambil Item");

        const response = await itemsResponse.json();
        setAhsData(response.data || []);

      } catch (err) {
        alert(err.message || "Gagal memuat data");
      }
  };

  useEffect(() => {
    fetchDataAllAHS();
  }, []);

  const [allItemData, setAllItemData] = useState(ITEM_LIST); // State Item list (biar konsisten pakai setAllItemData, meski di snippet awal pakai variabel lain)

  // --- CRUD LOGIC ---

  // 1. CREATE
  const handleAddAhs = (newAhsData) => {
    const total = (newAhsData.items || []).reduce((sum, item) => {
      const itemTotal = (item.volume || 0) * (item.hpp || 0);
      return sum + itemTotal;
    }, 0);
    const dataWithTotal = { ...newAhsData, total: total };
    setAhsData((prevData) => [...prevData, dataWithTotal]);
  };

  // 2. UPDATE
  const handleEditAhs = (updatedAhsData) => {
    const total = (updatedAhsData.items || []).reduce((sum, item) => {
      const itemTotal = (item.volume || 0) * (item.hpp || 0);
      return sum + itemTotal;
    }, 0);

    const dataWithTotal = { ...updatedAhsData, total: total };

    setAhsData((prevData) =>
      prevData.map((item) =>
        item.id === dataWithTotal.id ? dataWithTotal : item
      )
    );
  };

  // 3. DELETE
  const handleDeleteAhs = (idToDelete) => {
    setAhsData((prevData) =>
      prevData.filter((item) => item.id !== idToDelete)
    );
  };

  return (
    <div className="app-container">
      {/* Sidebar tampil jika bukan halaman login */}
      {!isLoginPage && <Sidebar />}

      {/* Navbar tampil jika bukan login DAN bukan di route /ahs (sesuai request layout Anda) */}
      {!isLoginPage && !location.pathname.startsWith("/ahs") && <Navbar />}

      <div className={`main-content ${!isLoginPage ? "with-sidebar" : ""}`}>
        <Routes>
          {/* ==== Halaman Auth ==== */}
          <Route path="/" element={<LoginPage />} />

          {/* ==== Halaman Utama ==== */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/item" element={<Item />} />
          <Route path="/vendor" element={<Vendor />} />

          {/* ==== Halaman AHS ==== */}

          {/* 1. Halaman List AHS (Menggunakan component dari src/pages/Ahs.js) */}
          <Route
            path="/ahs"
            element={
              <Ahs
                dataAhsFromApp={ahsData}
                onDeleteAhs={handleDeleteAhs}
              />
            }
          />

          {/* 2. Halaman Tambah AHS */}
          <Route
            path="/ahs/add"
            element={
              <AhsAdd
                onAddSubmit={handleAddAhs}
                allItemList={allItemData}
                fetchDataAllAHS={fetchDataAllAHS}
              />
            }
          />

          {/* 3. Halaman Edit AHS */}
          <Route
            path="/ahs/edit/:id"
            element={
              <AhsAdd
                onEditSubmit={handleEditAhs}
                allItemList={allItemData}
                allAhsData={ahsData} // Data lengkap dikirim untuk pencarian ID di form
                fetchDataAllAHS={fetchDataAllAHS}
              />
            }
          />

          {/* ==== Fallback ==== */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;