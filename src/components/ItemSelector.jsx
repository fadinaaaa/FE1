import { useEffect, useMemo, useState } from "react";
import "./ItemSelector.css";

// Konstanta URL API
const AHS_API_URL = "http://127.0.0.1:8000/api/ahs";
const ITEMS_API_URL = "http://127.0.0.1:8000/api/items";
const token = localStorage.getItem("token");

const UniversalSelector = ({ selectedObject, onSelect }) => {
    const [itemList, setItemList] = useState([]);
    const [ahsList, setAhsList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // ===== FETCH DATA =====
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const [itemsResponse, ahsResponse] = await Promise.all([
                    fetch(ITEMS_API_URL, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                        },
                    }),
                    fetch(AHS_API_URL, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                        },
                    }),
                ]);

                if (!itemsResponse.ok) throw new Error("Gagal mengambil Item");
                if (!ahsResponse.ok) throw new Error("Gagal mengambil AHS");

                const itemsData = await itemsResponse.json();
                const ahsData = await ahsResponse.json();

                setItemList(itemsData?.data ?? []);
                setAhsList(ahsData?.data ?? []);
            } catch (err) {
                console.error("Error:", err);
                setError(err.message || "Gagal memuat data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);


    // ===== GABUNGKAN DATA =====
    const unifiedData = useMemo(() => {
        if (isLoading) return [];

        const term = searchTerm.toLowerCase();

        const formattedItems = itemList.map((item) => ({
            ...item,
            uniqueId: `ITEM-${item.id}`, // FIX DUPLICATE KEY
            type: "ITEM",
            displayId: item.item_no || `ITEM-${item.id}`,
            displayName: item.deskripsi || item.nama || "-",
            displayUnit: item.satuan || "-",
            displayPrice: Number(item.hpp) || 0,
        }));

        const formattedAhs = ahsList.map((ahs) => ({
            ...ahs,
            uniqueId: `AHS-${ahs.id}`,
            type: "AHS",
            displayId: ahs.ahs_no || `AHS-${ahs.id}`,
            displayName: ahs.deskripsi || "-",
            displayUnit: ahs.satuan || "-",
            displayPrice: Number(ahs.harga_pokok_total) || 0
        }));

        const merged = [...formattedItems, ...formattedAhs];
        //const merged = [...formattedItems];

        return merged.filter((obj) => {
            const idMatch = obj.displayId.toLowerCase().includes(term);
            const nameMatch = obj.displayName.toLowerCase().includes(term);
            return idMatch || nameMatch;
        });
    }, [itemList, ahsList, searchTerm, isLoading]);

    // ===== HANDLER =====
    const handleSelect = (obj) => {
        // --- TAMBAHKAN LOG INI ---
        console.log("1. Tombol Pilih Ditekan. Data:", obj);
        console.log("2. Apakah props onSelect ada?", typeof onSelect);
        // -------------------------

        if (onSelect) {
            onSelect(obj);
        } else {
            console.error("ERROR: Props onSelect tidak dikirim dari Parent!");
        }

        setShowModal(false);
        setSearchTerm("");
    };

    return (
        <div className="item-selector-container">
            {/* DISPLAY FIELD */}
            <div className="input-group">
                <input
                    type="text"
                    className="selector-display"
                    placeholder={isLoading ? "Memuat..." : "Klik untuk memilih..."}
                    readOnly
                    onClick={() => !isLoading && !error && setShowModal(true)}
                    value={
                        selectedObject
                            ? `${selectedObject.displayId ?? "-"} - ${selectedObject.displayName ?? "-"
                            }`
                            : ""
                    }
                />
            </div>

            {/* Tampilkan error */}
            {error && <p style={{ color: "red" }}>⚠ {error}</p>}

            {/* === MODAL === */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Pilih Item / AHS</h3>
                            <span className="close-icon" onClick={() => setShowModal(false)}>
                                ×
                            </span>
                        </div>

                        <div className="modal-search-box">
                            <input
                                type="text"
                                placeholder="Cari berdasarkan ID atau nama..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="table-responsive">
                            <table className="item-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Deskripsi</th>
                                        <th>Satuan</th>
                                        <th style={{ textAlign: "right" }}>Harga</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {unifiedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: "center" }}>
                                                {isLoading ? "Memuat..." : "Tidak ada data."}
                                            </td>
                                        </tr>
                                    ) : (
                                        unifiedData.map((obj) => (
                                            <tr
                                                key={obj.uniqueId}
                                                className="item-row"
                                                onClick={() => handleSelect(obj)}
                                            >
                                                <td>{obj.displayId}</td>
                                                <td>{obj.displayName}</td>
                                                <td>{obj.displayUnit}</td>
                                                <td style={{ textAlign: "right" }}>
                                                    {obj.displayPrice.toLocaleString("id-ID")}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn-pilih-small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelect(obj);
                                                        }}
                                                    >
                                                        Pilih
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowModal(false)}
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UniversalSelector;