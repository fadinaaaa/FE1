import React, { useState, useRef } from "react";
import axios from 'axios'; // <-- Penting: Pastikan Anda telah menginstal axios (npm install axios)
import "../pages/Vendor.css";

// Definisi API Endpoint
const API_BASE_URL = "http://localhost:8000/api/ahs"; 
const API_TEMPLATE_URL = "http://127.0.0.1:8000/api/ahs/import/template"; 
const API_OPTIONS_URL = "http://127.0.0.1:8000/api/ahs/option-item"; 

const Topbar = ({
  search, setSearch,
  filterProvinsi, setFilterProvinsi,
  filterKab, setFilterKab,
  filterTahun, setFilterTahun,
  onAddNew,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false); // State untuk loading (opsional)

  // Helper untuk handle change dengan aman
  const safeSet = (setter, value) => {
    if (setter) setter(value);
  };
  
  // --- LOGIC INTERNAL TOPBAR DENGAN INTEGRASI API ---

  /**
   * 1. Handler untuk EKSPOR Data
   * - Endpoint: http://localhost:8000/api/ahs/export
   * - Metode: GET (Biasanya) atau POST
   * - Catatan: Menambahkan filter sebagai query params (opsional)
   */
  const handleExport = async () => {
    setIsLoading(true);
    // Buat query string dari filter (Contoh: ?provinsi=JawaTimur&kab=Surabaya)
    const filterQuery = new URLSearchParams({
      search: search || '',
      provinsi: filterProvinsi || '',
      kab: filterKab || '',
      tahun: filterTahun || '',
    }).toString();

    const exportUrl = `${API_BASE_URL}/export?${filterQuery}`;

    try {
      // Menggunakan fetch karena lebih mudah untuk menangani respons file/blob
      const response = await fetch(exportUrl, {
        method: 'GET', // Ganti ke 'POST' jika API Anda mengharuskan POST
        // Tambahkan headers jika otorisasi diperlukan, contoh:
        // headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Gagal mengunduh file: ${response.statusText}`);
      }

      // Ambil nama file dari header 'Content-Disposition' jika ada
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'data_export.xlsx';
      if (contentDisposition) {
        const matches = /filename="(.+?)"/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // Buat blob dari respons dan buat URL untuk diunduh
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename; // Nama file yang akan diunduh
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url); // Bersihkan URL objek
      
      alert(`Data berhasil diekspor sebagai ${filename}!`);

    } catch (error) {
      console.error("Error saat Ekspor Data:", error);
      alert(`Gagal Ekspor Data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 2. Handler untuk UNDUH TEMPLATE
   * - Endpoint: http://127.0.0.1:8000/api/ahs/import/template
   * - Metode: GET
   */
  const handleDownloadTemplate = async () => {
    setIsLoading(true);
    setShowDropdown(false);
    
    try {
        const response = await fetch(API_TEMPLATE_URL, {
            method: 'GET',
            // Headers, jika diperlukan
        });

        if (!response.ok) {
            throw new Error(`Gagal mengunduh template: ${response.statusText}`);
        }

        // Ambil nama file
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'template_import.xlsx';
        if (contentDisposition) {
            const matches = /filename="(.+?)"/.exec(contentDisposition);
            if (matches && matches[1]) {
                filename = matches[1];
            }
        }

        // Proses pengunduhan file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        alert(`Template berhasil diunduh sebagai ${filename}!`);

    } catch (error) {
        console.error("Error saat Unduh Template:", error);
        alert(`Gagal Unduh Template: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };
  
  // Handler untuk Pilih File (memicu input file tersembunyi)
  const handleSelectFile = () => {
      fileInputRef.current.click();
      // handleFileChange akan menangani setShowDropdown(false)
  };


  /**
   * 3. Handler untuk Impor File
   * - Endpoint: http://localhost:8000/api/ahs/import
   * - Metode: POST (dengan FormData)
   */
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    setShowDropdown(false); 
    
    if (!file) {
      // Reset input file agar bisa import file yang sama lagi
      e.target.value = null; 
      return;
    }
    
    setIsLoading(true);
    
    // Siapkan FormData untuk mengirim file
    const formData = new FormData();
    formData.append('file', file); // 'file' harus sesuai dengan nama field di API backend Anda

    try {
      // Menggunakan axios lebih nyaman untuk upload file dan mendapatkan respons JSON
      const response = await axios.post(`${API_BASE_URL}/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          // Tambahkan Authorization jika diperlukan
        },
        // Anda juga bisa menambahkan parameter lain ke FormData jika diperlukan,
        // contoh: formData.append('provinsi', filterProvinsi);
      });
      
      // Asumsi API mengembalikan status sukses dan/atau pesan
      console.log("Respons Impor:", response.data); 
      alert(`Impor file ${file.name} berhasil! Pesan: ${response.data.message || 'Data berhasil diimpor.'}`);
      
    } catch (error) {
      console.error("Error saat Impor File:", error);
      // Coba ambil pesan error dari respons API
      const errorMessage = error.response?.data?.message || error.message || "Terjadi kesalahan saat impor.";
      alert(`Gagal Impor File ${file.name}: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      // Reset input file agar bisa import file yang sama lagi
      e.target.value = null; 
    }
  };


  return (
    <div className="topbar-container">
      <div className="topbar-left">
        <div className="input-wrapper">
          <span className="icon-search">🔍</span>
          <input
            type="text"
            placeholder="Cari"
            value={search}
            onChange={(e) => safeSet(setSearch, e.target.value)}
          />
        </div>
        <input 
            placeholder="Provinsi" 
            value={filterProvinsi} 
            onChange={(e) => safeSet(setFilterProvinsi, e.target.value)} 
        />
        <input 
            placeholder="Kab" 
            value={filterKab} 
            onChange={(e) => safeSet(setFilterKab, e.target.value)} 
        />
        <input 
            placeholder="Tahun" 
            value={filterTahun} 
            onChange={(e) => safeSet(setFilterTahun, e.target.value)} 
            className="input-tahun" 
        />
      </div>

      <div className="topbar-right">
        {/* Tombol Ekspor */}
        <button 
            className="btn-action btn-export" 
            onClick={handleExport}
            disabled={isLoading} // Nonaktifkan saat proses loading
        >
          {isLoading ? 'Mengunduh...' : '📤 Ekspor'}
        </button>

        {/* Dropdown Impor */}
        <div className="dropdown" style={{ position: 'relative', display: 'inline-block' }}>
          <button 
            className="btn-action btn-import" 
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isLoading}
          >
            📥 Impor ▼
          </button>
          {showDropdown && (
            <div className="dropdown-menu">
              <button onClick={handleDownloadTemplate} disabled={isLoading}>
                📄 Unduh Template
              </button>
              <button onClick={handleSelectFile} disabled={isLoading}>
                📂 Pilih File
              </button>
            </div>
          )}
        </div>

        {/* TOMBOL + BARU: Menggunakan prop onAddNew */}
        <button className="btn-action btn-new" onClick={onAddNew} disabled={isLoading}>
          + Baru
        </button>

        {/* Input File Tersembunyi untuk Import */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default Topbar;