import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Header from "../components/header";
import "./Item.css";
import { FaTimes } from "react-icons/fa";

// Base URL API
const API_BASE_URL = "http://127.0.0.1:8000/api";
const role = localStorage.getItem("role"); // admin | user
const isAdmin = role === "admin";
const token = localStorage.getItem('token');


// 🔥 KONSTANTA BATAS FILE (contoh: 5MB)
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const Item = () => {
  // === 1. STATE & DATA ===
  const filterRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // State Filter & Search
  const [search, setSearch] = useState("");
  const [filterProvinsi, setFilterProvinsi] = useState("");
  const [filterKab, setFilterKab] = useState("");
  const [filterTahun, setFilterTahun] = useState("");

  const [provinsiOptions, setProvinsiOptions] = useState([]);
  const [kabOptions, setKabOptions] = useState([]);
  const [tahunOptions, setTahunOptions] = useState([]);

  const [showProvinsiDD, setShowProvinsiDD] = useState(false);
  const [showKabDD, setShowKabDD] = useState(false);
  const [showTahunDD, setShowTahunDD] = useState(false);

  // === STATE SATUAN (Autocomplete Lokal) ===
  const [satuanList, setSatuanList] = useState([]);
  const [satuanSuggestions, setSatuanSuggestions] = useState([]);
  const [showSatuanDropdown, setShowSatuanDropdown] = useState(false);

  // State Modal & UI
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFotoModal, setShowFotoModal] = useState(false);
  const [fotoList, setFotoList] = useState([]);

  // 🔥 State Error Validasi File
  const [fotoError, setFotoError] = useState("");
  const [docError, setDocError] = useState("");

  // State Form Data
  const [formData, setFormData] = useState({
    id: "",
    item_no: "",
    ahs: "",
    deskripsi: "",
    merek: "",
    satuan: "",
    hpp: "",
    vendorName: "",
    vendor_no: "",
    vendor_id: "",
    provinsi: "",
    kab: "",
    tahun: "",
    deskripsiProduk: "",
    teksSpesifikasi: "",
    fotoFiles: [],
    docSpecFiles: [],
  });

  // State untuk menyimpan nama file yang sudah ada (mode edit)
  const [existingFotoNames, setExistingFotoNames] = useState([]);
  const [existingDocNames, setExistingDocNames] = useState([]);

  // Refs
  const fileInputRef = useRef(null);
  const vendorInputRef = useRef(null);

  // Vendor Autocomplete
  const [vendorSuggestions, setVendorSuggestions] = useState([]);
  const [vendorNotFound, setVendorNotFound] = useState(false);

  // Helper functions
  const getVendorName = (v) =>
    v ? v.vendor_name || v.nama || v.name || v.vendor_no || "" : "";
  const getGambarList = (item) => {
    if (!item?.gambar || !Array.isArray(item.gambar)) return [];
    return item.gambar;
  };

  const getDokumenList = (item) => {
    if (!item?.dokumen || !Array.isArray(item.dokumen)) return [];
    return item.dokumen;
  };

  // === 2. FETCH DATA ITEMS ===

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("item_no", search);
      if (filterProvinsi) params.append("provinsi", filterProvinsi);
      if (filterKab) params.append("kab", filterKab);
      if (filterTahun) params.append("tahun", filterTahun);

      const response = await axios.get(
        `${API_BASE_URL}/items?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && Array.isArray(response.data.data)) {
        setItems(
          response.data.data.filter((i) => !i.ahs_id && !i.is_ahs)
        );
      } else if (Array.isArray(response.data)) {
        setItems(
          response.data.filter((i) => !i.ahs_id && !i.is_ahs)
        );
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Gagal load items:", error);
    } finally {
      setLoading(false);
    }
  }, [search, filterProvinsi, filterKab, filterTahun]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchItems();
    }, 500);
    return () => clearTimeout(handler);
  }, [fetchItems]);

  // === ISI DROPDOWN FILTER DARI DATA ITEMS ===
  useEffect(() => {
    if (items.length > 0) {
      // Provinsi unik
      const provSet = new Set(items.map((i) => i.provinsi).filter(Boolean));
      setProvinsiOptions([...provSet]);

      // Kab unik
      const kabSet = new Set(items.map((i) => i.kab).filter(Boolean));
      setKabOptions([...kabSet]);

      // Tahun unik (urut desc)
      const tahunSet = new Set(items.map((i) => i.tahun).filter(Boolean));
      setTahunOptions([...tahunSet].sort((a, b) => b - a));
    }
  }, [items]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowProvinsiDD(false);
        setShowKabDD(false);
        setShowTahunDD(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      const uniqueSatuan = [
        ...new Set(
          items.map((item) => item.satuan).filter((s) => s && s.trim() !== "")
        ),
      ];
      setSatuanList(uniqueSatuan);
    }
  }, [items]);

  // === 3. LOGIC LIVE SEARCH VENDOR ===

  const handleVendorChange = async (e) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      vendorName: value,
      vendor_id: "",
      vendor_no: "",
    });
    setVendorNotFound(false);

    if (value.length > 0) {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/vendors?search=${value}`
        );
        const data = response.data.data ? response.data.data : response.data;

        if (Array.isArray(data) && data.length > 0) {
          setVendorSuggestions(data);
          setVendorNotFound(false);
        } else {
          setVendorSuggestions([]);
          setVendorNotFound(true);
        }
      } catch (error) {
        console.error("Error searching vendor:", error);
      }
    } else {
      setVendorSuggestions([]);
    }
  };

  const handleSelectVendor = (vendor) => {
    const vName = getVendorName(vendor);
    setFormData({
      ...formData,
      vendorName: vName,
      vendor_id: vendor.vendor_id,
      vendor_no: vendor.vendor_no,
    });
    setVendorSuggestions([]);
    setVendorNotFound(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        vendorInputRef.current &&
        !vendorInputRef.current.contains(event.target)
      ) {
        setVendorSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // === 4. FILE HANDLERS (Multiple File & Chip Display) ===

  // 🔥 MODIFIKASI: Implementasi VALIDASI TANPA POP-UP (Hanya Teks Merah)
  const handleFileChange = (e, fieldName) => {
    const newFiles = Array.from(e.target.files);
    let validFiles = [];
    let totalOverSize = 0;
    let isOverSize = false;

    // Reset error state
    if (fieldName === "fotoFiles") setFotoError("");
    if (fieldName === "docSpecFiles") setDocError("");

    const currentFiles = formData[fieldName];

    newFiles.forEach((file) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        isOverSize = true;
        totalOverSize++;
        // File yang melebihi batas TIDAK dimasukkan ke validFiles
      } else {
        // Pastikan nama file baru tidak duplikat dengan yang sudah ada di state
        const isDuplicate = currentFiles.some((f) => f.name === file.name);
        if (!isDuplicate) {
          validFiles.push(file);
        }
      }
    });

    let errorMessage = "";
    if (isOverSize) {
      const fileType =
        fieldName === "fotoFiles" ? "Foto" : "Dokumen Spesifikasi";
      errorMessage = `⚠️ ${totalOverSize} file ${fileType} melebihi batas maksimal ${MAX_FILE_SIZE_MB}MB dan tidak ditambahkan.`;
      // Set error state, ini akan menampilkan teks merah di bawah input
      if (fieldName === "fotoFiles") setFotoError(errorMessage);
      if (fieldName === "docSpecFiles") setDocError(errorMessage);
    }

    if (validFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        // Tambahkan file yang valid ke list
        [fieldName]: [...prev[fieldName], ...validFiles],
      }));

      // Jika ada upload baru, kosongkan existing file names (asumsi upload baru akan menggantikan/melengkapi)
      if (fieldName === "fotoFiles") setExistingFotoNames([]);
      if (fieldName === "docSpecFiles") setExistingDocNames([]);
    }

    e.target.value = null; // Reset input agar file yang sama bisa diupload lagi
  };

  // Menghapus file yang baru dipilih (belum disimpan ke server)
  const handleRemoveFile = (fileName, fieldName) => {
    setFormData((prev) => {
      const updatedFiles = prev[fieldName].filter(
        (file) => file.name !== fileName
      );

      // Clear error jika array file menjadi kosong dan sebelumnya ada error
      if (fieldName === "fotoFiles" && fotoError && updatedFiles.length === 0)
        setFotoError("");
      if (fieldName === "docSpecFiles" && docError && updatedFiles.length === 0)
        setDocError("");

      return {
        ...prev,
        [fieldName]: updatedFiles,
      };
    });
  };

  // Menghapus file yang sudah ada di server
  const handleRemoveExistingFile = (fileName, fieldName) => {
    if (
      window.confirm(
        `Yakin ingin menghapus file "${fileName}"? Perubahan akan disimpan saat Anda klik "Simpan Perubahan".`
      )
    ) {
      if (fieldName === "foto") {
        setExistingFotoNames((prev) =>
          prev.filter((name) => name !== fileName)
        );
      } else if (fieldName === "doc") {
        setExistingDocNames((prev) => prev.filter((name) => name !== fileName));
      }
    }
  };
  // === SATUAN AUTOCOMPLETE HANDLERS ===
  const handleSatuanChange = (e) => {
    const value = e.target.value;

    setFormData((prev) => ({
      ...prev,
      satuan: value,
    }));

    if (!value) {
      setSatuanSuggestions([]);
      setShowSatuanDropdown(false);
      return;
    }

    const filtered = satuanList.filter((s) =>
      s.toLowerCase().includes(value.toLowerCase())
    );

    setSatuanSuggestions(filtered);
    setShowSatuanDropdown(filtered.length > 0);
  };

  const handleSelectSatuan = (value) => {
    setFormData((prev) => ({
      ...prev,
      satuan: value,
    }));
    setShowSatuanDropdown(false);
  };

  // === 5. CRUD HANDLERS ===

  const handleOpenAdd = async () => {
    setIsEditMode(false);
    setFotoError("");
    setDocError(""); // Reset error

    const initialData = {
      id: "",
      item_no: "Loading...",
      ahs: "",
      deskripsi: "",
      merek: "",
      satuan: "",
      hpp: "",
      vendorName: "",
      vendor_no: "",
      vendor_id: "",
      provinsi: "",
      kab: "",
      tahun: new Date().getFullYear().toString(),
      deskripsiProduk: "",
      teksSpesifikasi: "",
      fotoFiles: [],
      docSpecFiles: [],
    };
    setFormData(initialData);
    setExistingFotoNames([]);
    setExistingDocNames([]);
    setVendorSuggestions([]);
    setShowModal(true);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/items/next-id`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setFormData((prev) => ({ ...prev, item_no: response.data.next_id }));
    } catch (error) {
      console.error("Gagal mengambil ID otomatis:", error);
      setFormData((prev) => ({ ...prev, item_no: "Manual Input" }));
    }
  };

  const handleOpenEdit = (item) => {
    setIsEditMode(true);
    setFotoError("");
    setDocError(""); // Reset error

    const vName = item.vendor ? getVendorName(item.vendor) : "";
    const vNo = item.vendor ? item.vendor.vendor_no : "";

    const existingFoto = item?.gambar?.map((f) => f.file_name) || [];

    const existingDoc = item?.dokumen?.map((d) => d.file_name) || [];

    setExistingFotoNames(existingFoto.map((path) => path.split(/[/\\]/).pop()));
    setExistingDocNames(existingDoc.map((path) => path.split(/[/\\]/).pop()));

    setFormData({
      id: item.item_id,
      item_no: item.item_no,
      ahs: item.ahs,
      deskripsi: item.deskripsi,
      merek: item.merek,
      satuan: item.satuan,
      hpp: item.hpp,
      vendorName: vName,
      vendor_id: item.vendor_id,
      vendor_no: vNo,
      provinsi: item.provinsi,
      kab: item.kab,
      tahun: item.tahun,
      deskripsiProduk: item.produk_deskripsi,
      teksSpesifikasi: item.spesifikasi,
      fotoFiles: [],
      docSpecFiles: [],
    });
    setShowModal(true);
  };

  const handleSaveModal = async () => {
    if (formData.vendorName && !formData.vendor_no && !formData.vendor_id) {
      alert("Vendor belum valid! Mohon pilih vendor dari daftar saran.");
      return;
    }

    // 🔥 Hentikan save jika ada error validasi file
    if (fotoError || docError) {
      alert(
        "Perhatian: Harap perbaiki atau hapus file yang melebihi batas sebelum menyimpan."
      );
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append("item_no", formData.item_no);

    data.append("ahs", formData.ahs || "-");
    data.append("deskripsi", formData.deskripsi || "-");
    data.append("merek", formData.merek || "-");
    data.append("satuan", formData.satuan || "-");
    data.append("hpp", formData.hpp || "0");
    data.append("provinsi", formData.provinsi || "-");
    data.append("kab", formData.kab || "-");
    data.append("tahun", formData.tahun || "");
    data.append("produk_deskripsi", formData.deskripsiProduk || "-");
    data.append("spesifikasi", formData.teksSpesifikasi || "-");

    const handleSatuanChange = (e) => {
      const value = e.target.value;
      setFormData({ ...formData, satuan: value });

      if (value.length === 0) {
        setSatuanSuggestions([]);
        setShowSatuanDropdown(false);
        return;
      }

      const filtered = satuanList.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase())
      );

      setSatuanSuggestions(filtered);
      setShowSatuanDropdown(filtered.length > 0);
    };

    const handleSelectSatuan = (value) => {
      setFormData({ ...formData, satuan: value });
      setShowSatuanDropdown(false);
    };

    // Vendor Logic
    if (isEditMode) {
      if (formData.vendor_id) data.append("vendor_id", formData.vendor_id);
    } else {
      if (formData.vendor_no) {
        data.append("vendor_no", formData.vendor_no);
      } else {
        setLoading(false);
        alert("Gagal: Data Vendor tidak lengkap (Vendor No hilang).");
        return;
      }
    }

    // Append Existing File Names
    existingFotoNames.forEach((name) =>
      data.append("existing_produk_foto[]", name)
    );
    existingDocNames.forEach((name) =>
      data.append("existing_produk_dokumen[]", name)
    );

    // Append New Files (Array of Files)
    formData.fotoFiles.forEach((file) =>
      data.append("produk_foto[]", file, file.name)
    );
    formData.docSpecFiles.forEach((file) =>
      data.append("produk_dokumen[]", file, file.name)
    );

    try {
      if (isEditMode) {
        data.append("_method", "PUT");
        await axios.post(
          `${API_BASE_URL}/items/${formData.id}`,
          data,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        alert("Data berhasil diperbarui!");
      } else {
        await axios.post(
          `${API_BASE_URL}/items`,
          data,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        alert("Data berhasil ditambahkan!");
      }
      fetchItems();
      setShowModal(false);
    } catch (error) {
      console.error("Error save:", error.response);
      const msg =
        error.response?.data?.message ||
        JSON.stringify(error.response?.data?.errors) ||
        "Gagal menyimpan data.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin hapus data?")) {
      try {
        const token = localStorage.getItem("token");

        await axios.delete(`${API_BASE_URL}/items/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        fetchItems();
      } catch (error) {
        console.error(error.response?.data || error);
        alert("Gagal menghapus.");
      }
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${API_BASE_URL}/items/export`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob", // ⬅️ PENTING
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "items.xlsx"); // sesuaikan nama file
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Gagal export data");
      console.error(error);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${API_BASE_URL}/items/template/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "template_items.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Gagal download template");
      console.error(error);
    }
  };


  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/items/import`,
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Import berhasil!");
      fetchItems();
    } catch (e) {
      alert("Gagal Import.");
    } finally {
      setLoading(false);
    }
    setShowDropdown(false);
    e.target.value = null;
  };

  // --- 6. Helper Styles (CSS Inline untuk File Box) ---
  const fileBoxStyle = {
    border: "1px dashed #ccc",
    padding: "15px",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
    minHeight: "80px",
    display: "flex",
    flexDirection: "column",
    marginTop: "5px",
  };
  const fileChipContainerStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "10px",
  };
  const fileChipStyle = {
    backgroundColor: "#e0f7fa",
    border: "1px solid #b2ebf2",
    borderRadius: "4px",
    padding: "5px 10px",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    color: "#006064",
    fontWeight: "500",
  };
  const removeButtonStyle = {
    background: "none",
    border: "none",
    color: "#006064",
    cursor: "pointer",
    marginLeft: "5px",
    fontWeight: "bold",
    fontSize: "14px",
    lineHeight: "1",
    padding: 0,
  };
  const browseButtonStyle = {
    backgroundColor: "#3498db",
    color: "white",
    padding: "8px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    display: "inline-block",
    marginTop: "5px",
    fontSize: "14px",
    fontWeight: "bold",
    textAlign: "center",
    alignSelf: "flex-start",
  };
  // 🔥 Gaya untuk Pesan Error
  const errorTextStyle = {
    color: "red",
    fontSize: "12px",
    marginTop: "5px",
    fontWeight: "bold", // Menambahkan bold agar lebih menonjol
  };

  // === 7. RENDER UI ===
  return (
    <div className="vendor-container">
      <Sidebar />

      <div className="vendor-main">
        <Header />

        {/* Topbar */}
        <div className="topbar-container">
          <div className="topbar-left" ref={filterRef}>
            <div className="input-wrapper">
              <span className="icon-search">🔍</span>
              <input
                type="text"
                placeholder="Cari"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ position: "relative" }}>
              <input
                placeholder="Provinsi"
                value={filterProvinsi}
                onChange={(e) => setFilterProvinsi(e.target.value)}
                onClick={() => {
                  setShowProvinsiDD((prev) => !prev);
                  setShowKabDD(false);
                  setShowTahunDD(false);
                }}
              />

              {showProvinsiDD && (
                <div className="autocomplete-dropdown">
                  {provinsiOptions
                    .filter((p) =>
                      p.toLowerCase().includes(filterProvinsi.toLowerCase())
                    )
                    .map((p, i) => (
                      <div
                        key={i}
                        className="suggestion-item"
                        onClick={() => {
                          setFilterProvinsi(p);
                          setShowProvinsiDD(false);
                        }}
                      >
                        {p}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div style={{ position: "relative" }}>
              <input
                placeholder="Kab"
                value={filterKab}
                onChange={(e) => setFilterKab(e.target.value)}
                onClick={() => {
                  setShowKabDD((prev) => !prev);
                  setShowProvinsiDD(false);
                  setShowTahunDD(false);
                }}
              />

              {showKabDD && (
                <div className="autocomplete-dropdown">
                  {kabOptions
                    .filter((k) =>
                      k.toLowerCase().includes(filterKab.toLowerCase())
                    )
                    .map((k, i) => (
                      <div
                        key={i}
                        className="suggestion-item"
                        onClick={() => {
                          setFilterKab(k);
                          setShowKabDD(false);
                        }}
                      >
                        {k}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div style={{ position: "relative" }}>
              <input
                placeholder="Tahun"
                value={filterTahun}
                onChange={(e) => setFilterTahun(e.target.value)}
                onClick={() => {
                  setShowTahunDD((prev) => !prev);
                  setShowProvinsiDD(false);
                  setShowKabDD(false);
                }}
                className="input-tahun"
              />

              {showTahunDD && (
                <div className="autocomplete-dropdown">
                  {tahunOptions
                    .filter((t) => t.toString().includes(filterTahun))
                    .map((t, i) => (
                      <div
                        key={i}
                        className="suggestion-item"
                        onClick={() => {
                          setFilterTahun(t);
                          setShowTahunDD(false);
                        }}
                      >
                        {t}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="topbar-right">
            <button className="btn-action btn-export" onClick={handleExport}>
              📥 Export
            </button>
            {isAdmin && (
              <>
                <div
                  className="dropdown"
                  style={{ position: "relative", display: "inline-block" }}
                >
                  <button
                    className="btn-action btn-import"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    📥 Import ▼
                  </button>

                  {showDropdown && (
                    <div className="dropdown-menu">
                      <button onClick={handleDownloadTemplate}>
                        📄 Unduh Template
                      </button>
                      <button onClick={() => fileInputRef.current.click()}>
                        📂 Pilih File
                      </button>
                    </div>
                  )}
                </div>

                <button className="btn-action btn-new" onClick={handleOpenAdd}>
                  + Baru
                </button>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleImport}
            />
          </div>
        </div>

        {/* Tabel */}
        <div className="vendor-content">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>AHS</th>
                  <th>Deskripsi</th>
                  <th>Merek</th>
                  <th>Satuan</th>
                  <th>HPP</th>
                  <th>Vendor</th>
                  <th>Provinsi</th>
                  <th>Kab</th>
                  <th>Tahun</th>
                  <th>Foto</th>
                  <th>Deskripsi Produk</th>
                  <th>Spesifikasi</th>
                  <th className="sticky-action">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(items) && items.length > 0 ? (
                  items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.item_no}</td>
                      <td>{item.ahs}</td>
                      <td className="col-deskripsi">{item.deskripsi}</td>
                      <td>{item.merek}</td>
                      <td>{item.satuan}</td>
                      <td>{new Intl.NumberFormat("id-ID").format(item.hpp)}</td>
                      <td>{item.vendor ? getVendorName(item.vendor) : "-"}</td>
                      <td>{item.provinsi}</td>
                      <td>{item.kab}</td>
                      <td>{item.tahun}</td>
                      <td>
                        {item?.gambar && item.gambar.length > 0 ? (
                          <>
                            {/* Thumbnail */}
                            <img
                              src={`http://127.0.0.1:8000${item.gambar[0].file_url}`}
                              alt={item.gambar[0].file_name}
                              className="table-img"
                            />

                            {/* Button lihat semua foto */}
                            <div>
                              <button
                                className="link-doc"
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#1a73e8",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  padding: 0,
                                }}
                                onClick={() => {
                                  setFotoList(item.gambar);
                                  setShowFotoModal(true);
                                }}
                              >
                                📷 Lihat {item.gambar.length} Foto
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="value-textarea no-photo">
                            Tidak ada gambar
                          </div>
                        )}
                      </td>

                      <td className="col-desc-prod">{item.produk_deskripsi}</td>
                      <td className="col-specs">
                        {item?.dokumen && item.dokumen.length > 0
                          ? item.dokumen.map((doc, idx) => (
                            <div key={idx}>
                              <a
                                href={`http://127.0.0.1:8000${doc.file_url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="link-doc"
                              >
                                📄 Dokumen
                              </a>
                            </div>
                          ))
                          : "-"}

                        <div className="spec-text">{item.spesifikasi}</div>
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-view"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowDetail(true);
                            }}
                            title="Lihat"
                          >
                            👁️
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                className="btn-edit"
                                onClick={() => handleOpenEdit(item)}
                                title="Edit"
                              >
                                ✏️
                              </button>

                              <button
                                className="btn-delete"
                                onClick={() => handleDelete(item.item_id)}
                                title="Hapus"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="14"
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      Tidak ada data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Form */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal" style={{ position: "relative" }}>
              <h3>{isEditMode ? "Edit Data Item" : "Tambah Data Item"}</h3>
              <div className="modal-body">
                <label>AHS</label>
                <input
                  placeholder="Material / Jasa"
                  value={formData.ahs}
                  onChange={(e) =>
                    setFormData({ ...formData, ahs: e.target.value })
                  }
                />
                <label>Deskripsi</label>
                <input
                  placeholder="Nama Item"
                  value={formData.deskripsi}
                  onChange={(e) =>
                    setFormData({ ...formData, deskripsi: e.target.value })
                  }
                />
                <label>Merek</label>
                <input
                  placeholder="Merek Produk"
                  value={formData.merek}
                  onChange={(e) =>
                    setFormData({ ...formData, merek: e.target.value })
                  }
                />
                <label>Satuan</label>
                <div style={{ position: "relative" }}>
                  <input
                    placeholder="Unit (Bh, Paket, dll)"
                    value={formData.satuan}
                    onChange={handleSatuanChange}
                    onFocus={() => {
                      if (satuanSuggestions.length > 0) {
                        setShowSatuanDropdown(true);
                      }
                    }}
                  />

                  {showSatuanDropdown && (
                    <div className="autocomplete-dropdown">
                      {satuanSuggestions.map((satuan, idx) => (
                        <div
                          key={idx}
                          className="suggestion-item"
                          onClick={() => handleSelectSatuan(satuan)}
                        >
                          {satuan}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <label>HPP</label>
                <input
                  placeholder="Harga Satuan (Rp)"
                  value={formData.hpp}
                  onChange={(e) =>
                    setFormData({ ...formData, hpp: e.target.value })
                  }
                />

                {/* --- FITUR PENCARIAN VENDOR LIVE --- */}
                <div style={{ position: "relative" }} ref={vendorInputRef}>
                  <label>Vendor</label>
                  <input
                    placeholder="Ketik untuk mencari vendor..."
                    value={formData.vendorName}
                    onChange={handleVendorChange}
                    style={{
                      border: vendorNotFound
                        ? "2px solid red"
                        : "1px solid #ccc",
                    }}
                  />
                  {vendorNotFound && (
                    <p style={{ color: "red", fontSize: "12px", margin: "0" }}>
                      Vendor tidak ditemukan.
                    </p>
                  )}

                  {vendorSuggestions.length > 0 && (
                    <div className="autocomplete-dropdown">
                      {vendorSuggestions.map((vendor) => (
                        <div
                          key={vendor.vendor_id}
                          className="suggestion-item"
                          onClick={() => handleSelectVendor(vendor)}
                        >
                          {getVendorName(vendor)}{" "}
                          <span>({vendor.provinsi})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* ----------------------------------- */}

                <label>Provinsi</label>
                <input
                  placeholder="Lokasi Provinsi"
                  value={formData.provinsi}
                  onChange={(e) =>
                    setFormData({ ...formData, provinsi: e.target.value })
                  }
                />
                <label>Kab</label>
                <input
                  placeholder="Lokasi Kab"
                  value={formData.kab}
                  onChange={(e) =>
                    setFormData({ ...formData, kab: e.target.value })
                  }
                />
                <label>Tahun</label>
                <input
                  placeholder="Tahun Anggaran"
                  type="number"
                  value={formData.tahun}
                  onChange={(e) =>
                    setFormData({ ...formData, tahun: e.target.value })
                  }
                />

                <label
                  style={{
                    fontWeight: "bold",
                    marginTop: "10px",
                    display: "block",
                  }}
                >
                  Deskripsi Produk
                </label>
                <input
                  placeholder="Detail Lengkap"
                  value={formData.deskripsiProduk}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deskripsiProduk: e.target.value,
                    })
                  }
                />

                {/* --- FILE BOX: Upload FOTO Produk --- */}
                <div>
                  <label
                    style={{
                      fontWeight: "bold",
                      marginTop: "10px",
                      display: "block",
                    }}
                  >
                    Foto Produk
                  </label>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      margin: "0 0 5px 0",
                    }}
                  >
                    Maksimal ukuran per file: {MAX_FILE_SIZE_MB}MB
                  </p>
                  <div style={fileBoxStyle}>
                    <label
                      htmlFor="foto-upload-modal"
                      style={browseButtonStyle}
                    >
                      + Tambah Foto
                    </label>

                    <input
                      id="foto-upload-modal"
                      type="file"
                      onChange={(e) => handleFileChange(e, "fotoFiles")}
                      accept="image/*"
                      multiple
                      style={{ display: "none" }}
                    />

                    {/* Tampilkan File Lama (Mode Edit) */}
                    {existingFotoNames.length > 0 && (
                      <div
                        style={{
                          fontSize: "12px",
                          marginTop: "10px",
                          color: "#555",
                        }}
                      >
                        File Lama ({existingFotoNames.length}):
                        <div style={fileChipContainerStyle}>
                          {existingFotoNames.map((name, index) => (
                            <span
                              key={`old-f-${index}`}
                              style={{
                                ...fileChipStyle,
                                backgroundColor: "#d1e7dd",
                                color: "#0f5132",
                              }}
                            >
                              {name}
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveExistingFile(name, "foto")
                                }
                                style={{
                                  ...removeButtonStyle,
                                  color: "#0f5132",
                                }}
                                title="Hapus file lama ini"
                              >
                                <FaTimes />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tampilkan File Baru dalam bentuk Chip/Tag */}
                    {formData.fotoFiles.length > 0 && (
                      <div style={fileChipContainerStyle}>
                        {formData.fotoFiles.map((file, index) => (
                          <span key={`new-f-${index}`} style={fileChipStyle}>
                            {file.name}
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveFile(file.name, "fotoFiles")
                              }
                              style={removeButtonStyle}
                              title="Hapus file ini"
                            >
                              <FaTimes />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* 🔥 Notifikasi Error Foto */}
                  {fotoError && <p style={errorTextStyle}>{fotoError}</p>}
                </div>
                {/* ----------------------------------- */}

                <label
                  style={{
                    fontWeight: "bold",
                    marginTop: "10px",
                    display: "block",
                  }}
                >
                  Spesifikasi (Dokumen & Teks)
                </label>

                {/* --- FILE BOX: Upload Dokumen Spesifikasi --- */}
                <div>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      margin: "0 0 5px 0",
                    }}
                  >
                    Maksimal ukuran per file word atau pdf : {MAX_FILE_SIZE_MB}
                    MB
                  </p>
                  <div style={fileBoxStyle}>
                    <label
                      htmlFor="dokumen-upload-modal"
                      style={browseButtonStyle}
                    >
                      + Tambah Dokumen
                    </label>

                    <input
                      id="dokumen-upload-modal"
                      type="file"
                      onChange={(e) => handleFileChange(e, "docSpecFiles")}
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      multiple
                      style={{ display: "none" }}
                    />

                    {/* Tampilkan Dokumen Lama (Mode Edit) */}
                    {existingDocNames.length > 0 && (
                      <div
                        style={{
                          fontSize: "12px",
                          marginTop: "10px",
                          color: "#555",
                        }}
                      >
                        Dokumen Lama ({existingDocNames.length}):
                        <div style={fileChipContainerStyle}>
                          {existingDocNames.map((name, index) => (
                            <span
                              key={`old-d-${index}`}
                              style={{
                                ...fileChipStyle,
                                backgroundColor: "#fff3cd",
                                color: "#664d03",
                              }}
                            >
                              {name}
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveExistingFile(name, "doc")
                                }
                                style={{
                                  ...removeButtonStyle,
                                  color: "#664d03",
                                }}
                                title="Hapus dokumen lama ini"
                              >
                                <FaTimes />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tampilkan File Baru dalam bentuk Chip/Tag */}
                    {formData.docSpecFiles.length > 0 && (
                      <div style={fileChipContainerStyle}>
                        {formData.docSpecFiles.map((file, index) => (
                          <span key={`new-d-${index}`} style={fileChipStyle}>
                            {file.name}
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveFile(file.name, "docSpecFiles")
                              }
                              style={removeButtonStyle}
                              title="Hapus dokumen ini"
                            >
                              <FaTimes />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* 🔥 Notifikasi Error Dokumen */}
                  {docError && <p style={errorTextStyle}>{docError}</p>}
                </div>
                {/* ----------------------------------- */}

                <textarea
                  placeholder="• Daya: 150W&#10;• Tegangan: 220V"
                  rows="4"
                  style={{ width: "100%", padding: "8px", marginTop: "15px" }}
                  value={formData.teksSpesifikasi}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      teksSpesifikasi: e.target.value,
                    })
                  }
                />
              </div>

              <div className="modal-buttons">
                <button
                  className="btn-save"
                  onClick={handleSaveModal}
                  disabled={loading || fotoError || docError}
                >
                  {loading
                    ? "Memproses..."
                    : isEditMode
                      ? "Simpan Perubahan"
                      : "Simpan Data"}
                </button>
                <button
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Detail */}
        {showDetail && selectedItem && (
          <div className="modal-overlay">
            <div className="modal" style={{ position: "relative" }}>
              <h3>Detail Item</h3>
              <div
                className="detail-content"
                style={{ maxHeight: "70vh", overflowY: "auto" }}
              >
                <p>
                  <strong>ID:</strong> {selectedItem.item_no}
                </p>
                <p>
                  <strong>AHS:</strong> {selectedItem.ahs}
                </p>
                <p>
                  <strong>Deskripsi:</strong> {selectedItem.deskripsi}
                </p>
                <p>
                  <strong>Merek:</strong> {selectedItem.merek}
                </p>
                <p>
                  <strong>Satuan:</strong> {selectedItem.satuan}
                </p>
                <p>
                  <strong>HPP:</strong>{" "}
                  {new Intl.NumberFormat("id-ID").format(selectedItem.hpp)}
                </p>
                <p>
                  <strong>Vendor:</strong>{" "}
                  {selectedItem.vendor
                    ? getVendorName(selectedItem.vendor)
                    : "-"}
                </p>
                <p>
                  <strong>Provinsi:</strong> {selectedItem.provinsi}
                </p>
                <p>
                  <strong>Kab:</strong> {selectedItem.kab}
                </p>
                <p>
                  <strong>Tahun:</strong> {selectedItem.tahun}
                </p>

                <div style={{ margin: "15px 0" }}>
                  <strong>Foto Produk:</strong>
                  <br />

                  {selectedItem?.gambar && selectedItem.gambar.length > 0 ? (
                    <>
                      <img
                        src={`http://127.0.0.1:8000${selectedItem.gambar[0].file_url}`}
                        alt={selectedItem.gambar[0].file_name}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "200px",
                          marginTop: "5px",
                          borderRadius: "4px",
                          border: "1px solid #ddd",
                        }}
                      />

                      {selectedItem.gambar.length > 1 && (
                        <button
                          className="link-doc"
                          style={{
                            background: "none",
                            border: "none",
                            color: "#1a73e8",
                            cursor: "pointer",
                            fontSize: "12px",
                            padding: "5px 0",
                          }}
                          onClick={() => {
                            setFotoList(selectedItem.gambar);
                            setShowFotoModal(true);
                          }}
                        >
                          Lihat Semua ({selectedItem.gambar.length} Foto)
                        </button>
                      )}
                    </>
                  ) : (
                    <p>-</p>
                  )}
                </div>

                <p>
                  <strong>Deskripsi Produk:</strong>{" "}
                  {selectedItem.produk_deskripsi}
                </p>
                <div style={{ margin: "10px 0" }}>
                  <strong>Spesifikasi Teknis:</strong>
                  <div style={{ margin: "10px 0" }}>
                    <strong>Spesifikasi Teknis:</strong>

                    <p>
                      <strong>File Dokumen:</strong>{" "}
                      {selectedItem?.dokumen && selectedItem.dokumen.length > 0
                        ? selectedItem.dokumen.map((doc, idx) => (
                          <span key={idx} style={{ marginRight: "8px" }}>
                            <a
                              href={`http://127.0.0.1:8000${doc.file_url}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              📄 {doc.file_name}
                            </a>
                          </span>
                        ))
                        : " -"}
                    </p>
                  </div>
                  <p
                    style={{
                      whiteSpace: "pre-line",
                      margin: "5px 0 0 10px",
                      color: "#555",
                    }}
                  >
                    {selectedItem.spesifikasi}
                  </p>
                </div>
              </div>
              <div className="modal-buttons">
                <button
                  className="btn-cancel"
                  onClick={() => setShowDetail(false)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL FOTO PRODUK */}
        {showFotoModal && (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: "800px" }}>
              <h3>Foto Produk ({fotoList.length} Foto)</h3>

              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  overflowX: "auto",
                  paddingBottom: "10px",
                  maxWidth: "100%",
                  scrollSnapType: "x mandatory",
                }}
              >
                {fotoList.map((foto, idx) => (
                  <img
                    key={idx}
                    src={`http://127.0.0.1:8000${foto.file_url}`}
                    alt={foto.file_name}
                    style={{
                      flexShrink: 0,
                      width: "300px",
                      maxHeight: "400px",
                      objectFit: "contain",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      scrollSnapAlign: "center",
                    }}
                  />
                ))}
              </div>

              <div className="modal-buttons">
                <button
                  className="btn-cancel"
                  onClick={() => setShowFotoModal(false)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Item;