import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Import komponen lain
import Sidebar from "../components/Sidebar";
import Header from "../components/header";

import "./Item.css";
import "../components/AhsList.css";

// ==================================================================
// KONSTANTA API
// ==================================================================
const API_URL = "http://127.0.0.1:8000/api/ahs"; // Endpoint Utama AHS
const API_TEMPLATE_URL = "http://127.0.0.1:8000/api/ahs/import/template";
const API_IMPORT_URL = `${API_URL}/import`;
const role = localStorage.getItem("role");
const isAdmin = role === "admin";
const token = localStorage.getItem('token');

// ==================================================================
// 1. SUB-KOMPONEN: AHS DETAIL (DETAIL PRODUK + TABEL RINCIAN)
// ==================================================================
// ... (AhsDetail tetap sama, perbaikan URL gambar sudah diterapkan) ...
const AhsDetail = ({ selectedAhs }) => {
    const [showgambarModal, setShowgambarModal] = useState(false);

    if (!selectedAhs) return null;

    const items = Array.isArray(selectedAhs.items) ? selectedAhs.items : [];

    const photos = Array.isArray(selectedAhs.gambar)
        ? selectedAhs.gambar
        : selectedAhs.gambar
            ? [selectedAhs.gambar]
            : [];

    const total = items.length > 0
        ? items.reduce((sum, item) => sum + (Number(item.volume || 0) * Number(item.hpp || 0)), 0)
        : Number(selectedAhs.hpp || 0);

    const formatRupiah = (number) => {
        return Number(number).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
    };

    const ahsDisplayId = selectedAhs.ahs_no || '-';

    return (
        <div className="ahs-detail">
            <h4 className="detail-title">
                {selectedAhs.deskripsi}
            </h4>
            <p className="detail-info">
                ID: <strong>{ahsDisplayId}</strong> •
                Satuan: <strong>{selectedAhs.satuan}</strong> •
                Vendor: <strong>{selectedAhs.vendor?.vendor_name || selectedAhs.vendor?.nama || '-'}</strong>
            </p>
            <div className="ahs-produk-detail">
                <div className="detail-item">
                    <div className="label">Merek</div>
                    <div className="value">{selectedAhs.merek || '-'}</div>
                </div>

                <div className="detail-item">
                    <div className="label">Vendor</div>
                    <div className="value">
                        {selectedAhs.vendor?.vendor_name || selectedAhs.vendor?.nama || '-'}
                    </div>
                </div>

                <div className="detail-item">
                    <div className="label">Deskripsi Produk</div>
                    <div className="value">
                        {selectedAhs.produk_deskripsi || '-'}
                    </div>
                </div>

                <div className="detail-item">
                    <div className="label">Spesifikasi (Dokumen & Teks)</div>

                    {/* 1. POSISI ATAS: DAFTAR DOKUMEN */}
                    <div className="value-file">
                        {Array.isArray(selectedAhs.dokumen) && selectedAhs.dokumen.length > 0 ? (
                            selectedAhs.dokumen.map((doc, index) => {
                                const url = typeof doc === "string" ? doc : doc.url;
                                const name = typeof doc === "string"
                                    ? `Dokumen ${index + 1}`
                                    : doc.nama || `Dokumen ${index + 1}`;

                                return (
                                    <div key={index} className="dokumen-item">
                                        <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            📄 {name}
                                        </a>
                                    </div>
                                );
                            })
                        ) : (
                            <span className="file-empty">Tidak ada dokumen</span>
                        )}
                    </div>
                    <div className="value" style={{ whiteSpace: 'pre-wrap'}}>
                        {selectedAhs.spesifikasi || '-'}
                    </div>
                </div>
                <div className="detail-item">
                    <div className="label">gambar Produk</div>
                    <div className="value value-stack">
                        {photos.length > 0 ? (
                            <>
                                <div
                                    className="gambar-wrapper"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowgambarModal(true);
                                    }}
                                >
                                    <img
                                        src={photos[0]}
                                        alt="gambar Produk"
                                        className="gambar-preview"
                                    />
                                    <div className="gambar-caption">
                                        📷 Lihat ({photos.length}) Foto
                                    </div>
                                </div>

                                {showgambarModal && (
                                    <div
                                        className="gambar-modal-overlay"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowgambarModal(false);
                                        }}
                                    >
                                        <div
                                            className="gambar-modal-content"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="gambar-scroll">
                                                {photos.map((gambar, i) => (
                                                    <img
                                                        src={gambar}
                                                        alt={`gambar ${i + 1}`}
                                                        className="gambar-modal-image"
                                                    />
                                                ))}
                                            </div>

                                            <button
                                                className="gambar-modal-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowgambarModal(false);
                                                }}
                                            >
                                                Tutup
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="value-textarea no-photo">
                                Tidak ada gambar
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="table-container">
                <table className="detail-table">
                    <thead>
                        <tr>
                            <th>ITEM ID</th>
                            <th>URAIAN</th>
                            <th>SATUAN</th>
                            <th>VOLUME</th>
                            <th>HPP (Rp)</th>
                            <th>JUMLAH (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length > 0 ? (
                            items.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.item_no || item.item_id || '-'}</td>
                                    <td>{item.uraian}</td>
                                    <td>{item.satuan}</td>
                                    <td className="center">{Number(item.volume).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="right">{formatRupiah(item.hpp)}</td>
                                    <td className="right">{formatRupiah(Number(item.volume) * Number(item.hpp))}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="no-data">
                                    Tidak ada rincian item.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="5" className="right">TOTAL</td>
                            <td className="right" style={{ fontWeight: 'bold' }}>{formatRupiah(total)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};


// ==================================================================
// 2. SUB-KOMPONEN: AHS LIST TABLE (TETAP SAMA)
// ==================================================================
// ... (AhsListTable tetap sama) ...
const AhsListTable = ({ data, selectedId, onSelect, onEdit, onDelete, isAdmin }) => {

    const calculateTotal = (ahs) => {
        if (ahs.items && ahs.items.length > 0) {
            return ahs.items.reduce((sum, item) => sum + (Number(item.volume || 0) * Number(item.hpp || 0)), 0);
        }
        return Number(ahs.hpp || 0);
    };

    const handleRowClick = (e, ahsId) => {
        e.stopPropagation();
        onSelect(ahsId === selectedId ? null : ahsId); // Toggle detail
    };

    return (
        <div className="ahs-list-container">
            <div className="table-responsive">
                <table className="ahs-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Deskripsi</th>
                            <th>Satuan</th>
                            <th>Provinsi</th>
                            <th>Kab</th>
                            <th>Tahun</th>
                            <th>Harga Pokok Total</th>
                            <th className="sticky-action">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? (
                            data.map((ahs, index) => (
                                <React.Fragment key={ahs.ahs_id || `temp-${Math.random()}`}>
                                    <tr
                                        className={`ahs-row ${ahs.ahs_id === selectedId ? "active" : ""}`}
                                        onClick={(e) => handleRowClick(e, ahs.ahs_id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td>{`AHS${index + 1}`}</td>
                                        <td className="col-deskripsi">{ahs.deskripsi}</td>
                                        <td>{ahs.satuan}</td>
                                        <td>{ahs.provinsi || '-'}</td>
                                        <td>{ahs.kab || '-'}</td>
                                        <td>{ahs.tahun || '-'}</td>
                                        <td className="col-hpp" style={{ fontWeight: 'bold', color: '#2e1a5e' }}>
                                            Rp {calculateTotal(ahs).toLocaleString('id-ID')}
                                        </td>
                                        <td className="ahs-actions sticky-action">
                                            <button
                                                className="btn-icon btn-view"
                                                onClick={(e) => handleRowClick(e, ahs.ahs_id)}
                                            >
                                                {ahs.ahs_id === selectedId ? "❌" : "👁️"}
                                            </button>

                                            {isAdmin && (
                                                <>
                                                    <button
                                                        className="btn-icon btn-edit"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEdit(ahs.ahs_id);
                                                        }}
                                                    >
                                                        ✏️
                                                    </button>

                                                    <button
                                                        className="btn-icon btn-delete"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDelete(ahs.ahs_id);
                                                        }}
                                                    >
                                                        🗑️
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                    {ahs.ahs_id === selectedId && (
                                        <tr className="ahs-detail-row">
                                            <td colSpan="8" style={{ padding: 0, border: 'none' }}>
                                                <div style={{ padding: '20px', backgroundColor: '#fcfcfc', borderBottom: '2px solid #ddd' }}>
                                                    <AhsDetail selectedAhs={ahs} />
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="no-data-cell" style={{ textAlign: 'center', padding: '20px' }}>
                                    Tidak ada data ditemukan
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// ==================================================================
// 3. KOMPONEN UTAMA: HALAMAN AHS
// ==================================================================
const Ahs = () => {
    const navigate = useNavigate();

    const [ahsList, setAhsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State Filter & Topbar
    const [search, setSearch] = useState('');
    const [filterProvinsi, setFilterProvinsi] = useState('');
    const [filterKab, setFilterKab] = useState('');
    const [filterTahun, setFilterTahun] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);

    // === OPTIONS DROPDOWN (DARI DATABASE) ===
    const [provinsiOptions, setProvinsiOptions] = useState([]);
    const [kabOptions, setKabOptions] = useState([]);
    const [tahunOptions, setTahunOptions] = useState([]);

    // === KONTROL DROPDOWN ===
    const [showProvDD, setShowProvDD] = useState(false);
    const [showKabDD, setShowKabDD] = useState(false);
    const [showTahunDD, setShowTahunDD] = useState(false);


    // Ref untuk input file tersembunyi
    const fileInputRef = useRef(null);


    // === FUNGSI FETCH DATA ===
    const fetchDataAhs = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(API_URL, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = response.data.data || response.data;
            const validatedData = Array.isArray(data) ? data.filter(item => item && item.ahs_id != null) : [];
            setAhsList(validatedData);
            setSelectedId(null);

        } catch (err) {
            console.error("Gagal mengambil data AHS:", err);
            setError("Gagal mengambil data AHS. Cek koneksi API.");
            setAhsList([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDataAhs();
    }, []);

    // === ISI DROPDOWN FILTER DARI DATA AHS ===
    useEffect(() => {
        if (ahsList.length > 0) {
            const provSet = new Set(
                ahsList.map(a => a.provinsi).filter(Boolean)
            );
            setProvinsiOptions([...provSet]);

            const kabSet = new Set(
                ahsList.map(a => a.kab).filter(Boolean)
            );
            setKabOptions([...kabSet]);

            const tahunSet = new Set(
                ahsList.map(a => a.tahun).filter(Boolean)
            );
            setTahunOptions([...tahunSet].sort((a, b) => b - a));
        }
    }, [ahsList]);


    // === FUNGSI CRUD & NAVIGASI ===
    const handleNavigateAdd = () => navigate('/ahs/add');
    const handleNavigateEdit = (ahsId) => navigate(`/ahs/edit/${ahsId}`);

    const handleDelete = async (ahsId) => {
        if (
            window.confirm(
                `Yakin hapus data AHS ID: ${ahsId}? Tindakan ini tidak bisa dibatalkan.`
            )
        ) {
            try {
                await axios.delete(`${API_URL}/${ahsId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setAhsList((prevList) =>
                    prevList.filter((ahs) => ahs.ahs_id !== ahsId)
                );
                if (selectedId === ahsId) setSelectedId(null);
                alert(`Data AHS ID: ${ahsId} berhasil dihapus.`);
            } catch (error) {
                console.error("Gagal menghapus data AHS:", error);
                alert(
                    `Gagal menghapus data AHS ID: ${ahsId}. Cek koneksi API. Detail: ${error.message}`
                );
            }
        }
    };


    // ==================================================================
    // 📢 LOGIC EKSPOR & UNDUH TEMPLATE (TANPA isProcessing)
    // ==================================================================

    const handleDownloadResponse = (response, defaultFilename) => {
        const contentDisposition = response.headers['content-disposition'];
        let filename = defaultFilename;

        // Ambil nama file dari header Content-Disposition
        if (contentDisposition) {
            const matches = /filename\*?=(?:['"]?)(.+?)(?:['"]?)(?:;|$)/i.exec(contentDisposition);
            if (matches && matches[1]) {
                filename = decodeURIComponent(matches[1].replace(/utf-8''/i, ''));
            }
        }

        const blob = new Blob([response.data], {
            type: response.headers['content-type']
        });

        // Memaksa unduhan tanpa perlu state loading
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return filename;
    };


    /**
     * 1. Handler untuk EKSPOR Data (Langsung Unduh)
     */
    const handleExport = async () => {
        const params = new URLSearchParams({
            search: search || "",
            provinsi: filterProvinsi || "",
            kab: filterKab || "",
            tahun: filterTahun || "",
        }).toString();

        try {
            const response = await axios.get(`${API_URL}/export?${params}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                responseType: "blob", // PENTING
            });

            handleDownloadResponse(response, "data_ahs_export.xlsx");
            // Hilangkan alert sukses agar terasa lebih 'langsung'
            // alert(`Data berhasil diekspor!`);
        } catch (error) {
            console.error("Error saat Ekspor Data:", error);
            alert(`Gagal Ekspor Data. Cek koneksi dan API endpoint /ahs/export.`);
        }
    };
    /**
     * 2. Handler untuk UNDUH TEMPLATE (Langsung Unduh)
     */
    const handleDownloadTemplate = async () => {
        setShowDropdown(false);

        try {
            const response = await axios.get(API_TEMPLATE_URL, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                responseType: "blob", // PENTING
            });

            handleDownloadResponse(response, "template_import_ahs.xlsx");
            // Hilangkan alert sukses agar terasa lebih 'langsung'
            // alert(`Template berhasil diunduh!`);
        } catch (error) {
            console.error("Error saat Unduh Template:", error);
            alert("Gagal Unduh Template. Pastikan API Template berjalan.");
        }
    };


    /**
     * Handler untuk memicu input file tersembunyi
     */
    const handleSelectFile = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
        setShowDropdown(false);
    };

    /**
     * 3. Handler untuk Impor File (Tetap ada loading/alert karena melibatkan perubahan data)
     */
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            e.target.value = null;
            return;
        }

        // Feedback sederhana untuk proses impor
        const loadingMessage = alert(
            `Memulai Impor file ${file.name}... Mohon tunggu.`
        );

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post(API_IMPORT_URL, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });
            console.log("Respons Impor:", response.data);
            // Feedback sukses
            alert(`Impor file ${file.name} berhasil! Pesan: ${response.data.message || 'Data berhasil diimpor.'}`);

            fetchDataAhs();

        } catch (error) {
            console.error("Error saat Impor File:", error);
            const errorMessage = error.response?.data?.message || error.message || "Terjadi kesalahan saat impor.";
            alert(`Gagal Impor File ${file.name}: ${errorMessage}`);
        } finally {
            e.target.value = null;
        }
    };

    // === LOGIKA FILTER DAN SEARCH (Tetap Sama) ===
    const filteredList = useMemo(() => {
        const term = search.toLowerCase();
        const provTerm = filterProvinsi.toLowerCase();
        const kabTerm = filterKab.toLowerCase();
        const tahunTerm = filterTahun.toLowerCase();

        return ahsList.filter(item => {
            const matchSearch =
                (item.ahs && item.ahs.toString().toLowerCase().includes(term)) ||
                (item.deskripsi && item.deskripsi.toLowerCase().includes(term));
            const matchProv = provTerm ? item.provinsi?.toLowerCase().includes(provTerm) : true;
            const matchKab = kabTerm ? item.kab?.toLowerCase().includes(kabTerm) : true;
            const matchTahun = tahunTerm ? item.tahun?.toString().includes(tahunTerm) : true;

            return matchSearch && matchProv && matchKab && matchTahun;
        })
            .sort((a, b) => {
                const numA = parseInt(a.ahs_no?.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.ahs_no?.replace(/\D/g, '')) || 0;
                return numA - numB;
            });
    }, [ahsList, search, filterProvinsi, filterKab, filterTahun]);


    return (
        <div className="vendor-container">
            <Sidebar />
            <div className="vendor-main">
                <Header />

                {/* ======================= START TOPBAR INTEGRASI ======================= */}
                <div className="topbar-container">
                    <div className="topbar-left">
                        <div className="input-wrapper">
                            <span className="icon-search">🔍</span>
                            <input
                                type="text"
                                placeholder="Cari "
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="filter-wrapper">
                            <input
                                placeholder="Provinsi"
                                value={filterProvinsi}
                                onChange={(e) => {
                                    setFilterProvinsi(e.target.value);
                                    setShowProvDD(true);
                                }}
                                onFocus={() => setShowProvDD(true)}
                                onBlur={() => setTimeout(() => setShowProvDD(false), 150)}
                            />

                            {showProvDD && (
                                <div className="filter-dropdown">
                                    {provinsiOptions
                                        .filter(p =>
                                            p.toLowerCase().includes(filterProvinsi.toLowerCase())
                                        )
                                        .map((p, i) => (
                                            <div
                                                key={i}
                                                className="filter-item"
                                                onMouseDown={() => {
                                                    setFilterProvinsi(p);
                                                    setShowProvDD(false);
                                                }}
                                            >
                                                {p}
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>

                        <div className="filter-wrapper">
                            <input
                                placeholder="Kab"
                                value={filterKab}
                                onChange={(e) => {
                                    setFilterKab(e.target.value);
                                    setShowKabDD(true);
                                }}
                                onFocus={() => setShowKabDD(true)}
                                onBlur={() => setTimeout(() => setShowKabDD(false), 150)}
                            />

                            {showKabDD && (
                                <div className="filter-dropdown">
                                    {kabOptions
                                        .filter(k =>
                                            k.toLowerCase().includes(filterKab.toLowerCase())
                                        )
                                        .map((k, i) => (
                                            <div
                                                key={i}
                                                className="filter-item"
                                                onMouseDown={() => {
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

                        <div className="filter-wrapper">
                            <input
                                placeholder="Tahun"
                                value={filterTahun}
                                onChange={(e) => {
                                    setFilterTahun(e.target.value);
                                    setShowTahunDD(true);
                                }}
                                onFocus={() => setShowTahunDD(true)}
                                onBlur={() => setTimeout(() => setShowTahunDD(false), 150)}
                                className="input-tahun"
                            />

                            {showTahunDD && (
                                <div className="filter-dropdown">
                                    {tahunOptions
                                        .filter(t => t.toString().includes(filterTahun))
                                        .map((t, i) => (
                                            <div
                                                key={i}
                                                className="filter-item"
                                                onMouseDown={() => {
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
                        {/* Tombol EKSPOR (Langsung Unduh) */}
                        <button className="btn-action btn-export" onClick={handleExport}>
                            📤 Export
                        </button>

                        {/* Import → ADMIN SAJA */}
                        {isAdmin && (
                            <div className="dropdown" style={{ position: "relative" }}>
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
                                        <button onClick={handleSelectFile}>📂 Pilih File</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tambah Data → ADMIN SAJA */}
                        {isAdmin && (
                            <button
                                className="btn-action btn-new"
                                onClick={handleNavigateAdd}
                            >
                                + Baru
                            </button>
                        )}

                        {/* Input File Tersembunyi untuk Import */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        />
                    </div>
                </div>
                {/* ======================= END TOPBAR INTEGRASI ======================= */}


                <div className="vendor-content">
                    {loading && <p style={{ textAlign: 'center', padding: '20px' }}>Memuat data AHS...</p>}
                    {error && <p style={{ textAlign: 'center', padding: '20px', color: 'red' }}>⚠️ {error}</p>}

                    {!loading && !error && (
                        <AhsListTable
                            data={filteredList}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                            onEdit={handleNavigateEdit}
                            onDelete={handleDelete}
                            isAdmin={isAdmin}
                        />
                    )}

                    {!loading && !error && filteredList.length === 0 && (
                        <div className="no-data-message" style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd' }}>
                            Tidak ada data AHS yang cocok dengan kriteria pencarian/filter.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Ahs;