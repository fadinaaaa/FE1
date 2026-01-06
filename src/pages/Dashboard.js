import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Header from "../components/header";
import "../styles/Dashboard.css";
import { FaBoxOpen, FaIndustry, FaCalculator } from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const API_BASE_URL = "http://127.0.0.1:8000/api";
const token = localStorage.getItem("token");

const Dashboard = () => {
  // State untuk menyimpan jumlah total (Card)
  const [counts, setCounts] = useState({
    vendor: 0,
    item: 0,
    ahs: 0, // Diubah dari static 2 menjadi 0
  });

  // State untuk data grafik batang (Bar Chart)
  const [barData, setBarData] = useState([]);

  // State untuk data grafik lingkaran (Pie Chart)
  const [pieData, setPieData] = useState([]);

  // ================= FILTER TAHUN & BULAN =================
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState("all"); // all | 0-11


  const COLORS = ["#4e73df", "#1cc88a", "#f6c23e"];

  const processMonthlyData = (vendors, items, ahsList, year, month) => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    ];

    // ================= SEMUA BULAN =================
    if (month === "all") {
      const monthlyStats = months.map((m) => ({
        name: m,
        vendor: 0,
        item: 0,
        ahs: 0,
      }));

      const incrementMonth = (dataList, key) => {
        if (!Array.isArray(dataList)) return;

        dataList.forEach((data) => {
          if (data.created_at) {
            const date = new Date(data.created_at);
            if (date.getFullYear() === year) {
              const monthIndex = date.getMonth();
              monthlyStats[monthIndex][key] += 1;
            }
          }
        });
      };

      incrementMonth(vendors, "vendor");
      incrementMonth(items, "item");
      incrementMonth(ahsList, "ahs");

      return monthlyStats;
    }

    // ================= BULAN TERTENTU =================
    const monthIndex = parseInt(month);

    const countByMonth = (dataList) =>
      Array.isArray(dataList)
        ? dataList.filter((d) => {
          if (!d.created_at) return false;
          const date = new Date(d.created_at);
          return (
            date.getFullYear() === year &&
            date.getMonth() === monthIndex
          );
        }).length
        : 0;

    return [
      {
        name: months[monthIndex],
        vendor: countByMonth(vendors),
        item: countByMonth(items),
        ahs: countByMonth(ahsList),
      },
    ];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Request ke Backend secara paralel (Menambahkan AHS)
        const [vendorRes, itemRes, ahsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/vendors`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/items`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/ahs`, {
            headers: { Authorization: `Bearer ${token}` },
          }), // Endpoint baru AHS
        ]);

        // PERBAIKAN 2: Normalisasi data untuk semua endpoint
        const normalizeData = (response) => {
          return Array.isArray(response.data)
            ? response.data
            : (response.data.data || []);
        };

        const vendors = normalizeData(vendorRes);
        const items = normalizeData(itemRes);
        const ahsList = normalizeData(ahsRes); // Data AHS

        // 1. Update State Counts (Kartu Atas)
        setCounts((prev) => ({
          ...prev,
          vendor: vendors.length,
          item: items.length,
          ahs: ahsList.length, // Mengambil jumlah data AHS
        }));

        // 2. Update Pie Chart Data
        setPieData([
          { name: "Vendor", value: vendors.length },
          { name: "Item", value: items.length },
          { name: "AHS", value: ahsList.length }, // Menggunakan jumlah data AHS
        ]);

        // 3. Update Bar Chart Data (Aktivitas Bulanan)
        const processedBarData = processMonthlyData(
          vendors,
          items,
          ahsList,
          selectedYear,
          selectedMonth
        );
        setBarData(processedBarData);


      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
      }
    };

    fetchData();
  }, [selectedYear, selectedMonth]);

  return (
    <div className="layout">
      <Sidebar />
      <div className="content">
        <Header />
        <div className="dashboard-header">
          <h2>Selamat Datang 🖐️</h2>
        </div>

        {/* Grid 2 baris */}
        <div className="dashboard-grid">
          {/* Baris Pertama: 3 Card ringkas */}
          <div className="top-cards">
            {/* Card Vendor */}
            <div className="dashboard-card">
              <FaIndustry className="card-icon vendor" />
              <h4>Jumlah Vendor</h4>
              <p>{counts.vendor}</p>
            </div>

            {/* Card Item */}
            <div className="dashboard-card">
              <FaBoxOpen className="card-icon item" />
              <h4>Jumlah Item</h4>
              <p>{counts.item}</p>
            </div>

            {/* Card AHS */}
            <div className="dashboard-card">
              <FaCalculator className="card-icon ahs" />
              <h4>Jumlah AHS</h4>
              <p>{counts.ahs}</p>
            </div>
          </div>

          {/* Baris Kedua: Chart */}
          <div className="bottom-cards">
            {/* PIE CHART */}
            <div className="dashboard-card chart-card">
              <h4>Distribusi Data</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData.length > 0 ? pieData : [{ name: 'Loading', value: 1 }]} // Fallback saat loading
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} />
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>


            {/* BAR CHART */}
            <div className="dashboard-card chart-card">
              <div className="chart-header">
                <h4>Aktivitas Bulanan (Input Data)</h4>

                <div className="chart-filter">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                  >
                    {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    <option value="all">Semua Bulan</option>
                    <option value="0">Januari</option>
                    <option value="1">Februari</option>
                    <option value="2">Maret</option>
                    <option value="3">April</option>
                    <option value="4">Mei</option>
                    <option value="5">Juni</option>
                    <option value="6">Juli</option>
                    <option value="7">Agustus</option>
                    <option value="8">September</option>
                    <option value="9">Oktober</option>
                    <option value="10">November</option>
                    <option value="11">Desember</option>
                  </select>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="vendor" name="Vendor" fill="#1cc88a" />
                  <Bar dataKey="item" name="Item" fill="#4e73df" />
                  <Bar dataKey="ahs" name="AHS" fill="#f6c23e" /> {/* Tambahkan Bar AHS */}
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;