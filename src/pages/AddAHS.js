import { useEffect, useRef, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import ItemSelector from "../components/ItemSelector";
import Notification from "../components/Notification";
import "../styles/AddAHS.css";
import { FaPencilAlt } from "react-icons/fa";

// URL API Anda
const API_URL = "http://127.0.0.1:8000/api/ahs";
// URL API Vendor
const VENDOR_API_URL = "http://127.0.0.1:8000/api/vendors";

const role = localStorage.getItem("role");
const token = localStorage.getItem("token");

// Fungsi pembantu untuk mengkonversi objek JavaScript ke FormData
const buildFormData = (formData, data, parentKey) => {
    if (
        data &&
        typeof data === "object" &&
        !(data instanceof Date) &&
        !(data instanceof File)
    ) {
        if (Array.isArray(data)) {
            data.forEach((element, index) => {
                if (element instanceof File) {
                    formData.append(`${parentKey}[]`, element);
                } else {
                    buildFormData(formData, element, `${parentKey}[${index}]`);
                }
            });
        } else {
            Object.keys(data).forEach((key) => {
                buildFormData(
                    formData,
                    data[key],
                    parentKey ? `${parentKey}[${key}]` : key
                );
            });
        }
    } else if (data !== undefined && data !== null) {
        const value = data instanceof File ? data : String(data);
        formData.append(parentKey, value);
    }
};

// Komponen Utama
const AddAHS = ({
    onAddSubmit,
    onEditSubmit,
    allItemList,
    allAhsData,
    fetchDataAllAHS,
}) => {
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // State Vendor dan Autocomplete
    const [allVendors, setAllVendors] = useState([]);
    const [isVendorsLoading, setIsVendorsLoading] = useState(false);
    const [filteredVendors, setFilteredVendors] = useState([]);
    const [isVendorSuggestionOpen, setIsVendorSuggestionOpen] = useState(false);
    const [selectedVendorId, setSelectedVendorId] = useState(null);

    const [formData, setFormData] = useState({
        ahs: "",
        deskripsi: "",
        satuan: "",
        provinsi: "",
        kab: "",
        tahun: new Date().getFullYear().toString(),
        merek: "",
        vendor: "",
        vendor_id: null,
        foto: [], // Array untuk menyimpan multiple file
        produk_deskripsi: "",
        produk_dokumen: [], // Array untuk menyimpan multiple file
        spesifikasi: "",
    });

    const [items, setItems] = useState([]);
    const [editingItemId, setEditingItemId] = useState(null);
    const [showNotification, setShowNotification] = useState(false);
    const [selectedItemToAdd, setSelectedItemToAdd] = useState(null);
    const [currentItemVolume, setCurrentItemVolume] = useState(1);

    // State untuk nama file yang sudah ada (mode edit)
    const [existingFotoNames, setExistingFotoNames] = useState([]);
    const [existingProdukDokumenNames, setexistingProdukDokumenNames] =
        useState([]);

    const vendorInputRef = useRef(null);

    // === SATUAN AUTOCOMPLETE ===
    const [satuanList, setSatuanList] = useState([]);
    const [filteredSatuan, setFilteredSatuan] = useState([]);
    const [isSatuanOpen, setIsSatuanOpen] = useState(false);
    const satuanInputRef = useRef(null);

    // --- 1. Fetch Data Vendor dan Setup Listener ---
    useEffect(() => {
        const fetchVendors = async () => {
            setIsVendorsLoading(true);
            try {
                const response = await fetch(VENDOR_API_URL, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error(`Gagal mengambil data vendor: ${response.status}`);
                }

                const data = await response.json();
                setAllVendors(data.data || data);
            } catch (err) {
                console.error("Error fetching vendors:", err);
                setError(`Gagal memuat daftar vendor: ${err.message}`);
            } finally {
                setIsVendorsLoading(false);
            }
        };
        fetchVendors();

        const handleClickOutside = (event) => {
            if (
                vendorInputRef.current &&
                !vendorInputRef.current.contains(event.target)
            ) {
                setIsVendorSuggestionOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const satuanSet = new Set();

        // dari AHS
        if (allAhsData && allAhsData.length > 0) {
            allAhsData.forEach((a) => {
                if (a.satuan) satuanSet.add(a.satuan);
            });
        }

        // dari item penyusun
        if (allItemList && allItemList.length > 0) {
            allItemList.forEach((i) => {
                if (i.satuan) satuanSet.add(i.satuan);
            });
        }

        setSatuanList([...satuanSet]);
    }, [allAhsData, allItemList]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                satuanInputRef.current &&
                !satuanInputRef.current.contains(e.target)
            ) {
                setIsSatuanOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- 2. Load Data atau Generate ID ---
    useEffect(() => {
        if (!isEditMode) {
            const generateAHSId = () => {
                const randomNum = Math.floor(100 + Math.random() * 900);
                return `AHS-${randomNum}`;
            };
            setFormData((prev) => ({ ...prev, ahs: generateAHSId() }));
        }
    }, [isEditMode]);

    useEffect(() => {
        if (isEditMode && allAhsData && allAhsData.length > 0) {
            const dataToEdit = allAhsData.find(
                (item) => String(item.ahs_id) === String(id)
            );

            if (dataToEdit) {
                let vendorName = "";
                let vendorId = null;
                if (dataToEdit.vendor.length > 0) {
                    if (typeof dataToEdit.vendor === "object") {
                        vendorName =
                            dataToEdit.vendor.vendor_name || dataToEdit.vendor.nama || "";
                        vendorId = dataToEdit.vendor.vendor_id || null;
                    } else {
                        vendorName = String(dataToEdit.vendor);
                        vendorId = isNaN(Number(vendorName)) ? null : Number(vendorName);
                    }
                }

                const fotos = Array.isArray(dataToEdit.produk_foto)
                    ? dataToEdit.produk_foto
                    : dataToEdit.produk_foto
                        ? [dataToEdit.produk_foto]
                        : [];
                const docs = Array.isArray(dataToEdit.produk_dokumen)
                    ? dataToEdit.produk_dokumen
                    : dataToEdit.produk_dokumen
                        ? [dataToEdit.produk_dokumen]
                        : [];

                setExistingFotoNames(fotos.map((f) => f.split(/[/\\]/).pop()));
                setexistingProdukDokumenNames(
                    docs.map((d) => d.split(/[/\\]/).pop())
                );

                setFormData((prev) => ({
                    ...prev,
                    ahs: dataToEdit.ahs_no || dataToEdit.ahs || `AHS-${dataToEdit.id}`,
                    deskripsi: dataToEdit.deskripsi || "",
                    satuan: dataToEdit.satuan || "m3",
                    provinsi: dataToEdit.provinsi || "",
                    kab: dataToEdit.kab || "",
                    tahun: dataToEdit.tahun || "",
                    merek: dataToEdit.merek || "",
                    vendor: vendorName,
                    vendor_id: vendorId,
                    foto: [],
                    produk_deskripsi: dataToEdit.item_ahs.produk_deskripsi || "",
                    produk_dokumen: [],
                    spesifikasi:
                        dataToEdit.spesifikasi || dataToEdit.spesifikasi || "",
                }));
                setSelectedVendorId(vendorId);

                const loadedItems = (dataToEdit.items || []).map((i) => ({
                    itemId: i.item_id || i.itemId || "UNKNOWN",
                    displayId:
                        i.item_no || i.displayId || i.ahs_no || i.item_id || "UNKNOWN",
                    uraian: i.uraian || i.deskripsi || "Item Tanpa Nama",
                    satuan: i.satuan || "-",
                    volume: i.volume || 0,
                    hpp: i.hpp || 0,
                }));
                setItems(loadedItems);
                console.log(dataToEdit);
            }
            console.log(allAhsData);
        }
    }, [isEditMode, id, allAhsData, allVendors]);

    // --- 3. Fungsi Handler ---

    // Autocomplete Vendor
    const handleVendorSearch = (e) => {
        const value = e.target.value;
        setFormData({ ...formData, vendor: value });
        setSelectedVendorId(null);
        if (value.length > 0) {
            const lowerCaseValue = value.toLowerCase();
            const filtered = allVendors.filter((vendor) => {
                const name = vendor.vendor_name || vendor.nama || "";
                return name.toLowerCase().includes(lowerCaseValue);
            });
            setFilteredVendors(filtered);
            setIsVendorSuggestionOpen(filtered.length > 0);
        } else {
            setFilteredVendors([]);
            setIsVendorSuggestionOpen(false);
        }
    };

    const handleVendorSelect = (vendor) => {
        const vendorName = vendor.vendor_name || "";
        const vendorId = vendor.vendor_id || null;
        setFormData({ ...formData, vendor: vendorName, vendor_id: vendorId });
        setSelectedVendorId(vendor.id);
        setIsVendorSuggestionOpen(false);
    };

    // Hapus File dari state (sebelum disimpan)
    const handleRemoveFile = (fileName, fieldName) => {
        setFormData((prev) => ({
            ...prev,
            [fieldName]: prev[fieldName].filter((file) => file.name !== fileName),
        }));
    };

    // Perubahan Input (TERMASUK FILE UPLOAD BERTAHAP)
    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === "foto") {
            const newFiles = Array.from(files);
            setFormData((prev) => ({
                ...prev,
                [name]: [...prev.foto, ...newFiles], // Menggabungkan file lama dan baru
            }));
            setExistingFotoNames([]);
            e.target.value = ""; // Reset input file
        } else if (name === "produk_dokumen") {
            const newFiles = Array.from(files);
            setFormData((prev) => ({
                ...prev,
                [name]: [...prev.produk_dokumen, ...newFiles], // Menggabungkan file lama dan baru
            }));
            setexistingProdukDokumenNames([]);
            e.target.value = ""; // Reset input file
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // Item AHS
    const handleItemSelect = (item) => {
        setSelectedItemToAdd(item);
    };
    const handleAddItem = () => {
        if (!selectedItemToAdd || Number(currentItemVolume) <= 0) {
            alert("Pilih item dan isi volume (> 0)");
            return;
        }

        const itemId = selectedItemToAdd.displayId; // ✅ FIX UTAMA

        const itemToSave = {
            itemId, // M_001
            displayId: itemId, // M_001
            uraian: selectedItemToAdd.displayName,
            satuan: selectedItemToAdd.displayUnit,
            volume: Number(currentItemVolume),
            hpp: Number(selectedItemToAdd.displayPrice || 0),
        };

        setItems((prev) => {
            if (editingItemId) {
                return prev.map((i) =>
                    String(i.itemId) === String(editingItemId) ? itemToSave : i
                );
            }

            const isDuplicate = prev.some((i) => String(i.itemId) === String(itemId));
            if (isDuplicate) {
                alert("Item sudah ada. Gunakan tombol Edit.");
                return prev;
            }

            return [...prev, itemToSave];
        });

        setSelectedItemToAdd(null);
        setCurrentItemVolume(1);
        setEditingItemId(null);
    };

    const handleRemoveItem = (itemId) => {
        if (window.confirm("Yakin ingin menghapus item ini dari AHS?")) {
            setItems((prev) =>
                prev.filter((item) => String(item.itemId) !== String(itemId))
            );
        }
    };

    const handleEditItem = (item) => {
        setSelectedItemToAdd({
            item_id: item.itemId,
            displayId: item.displayId,
            displayName: item.uraian,
            displayUnit: item.satuan,
            displayPrice: item.hpp,
        });

        setCurrentItemVolume(item.volume);
        setEditingItemId(item.itemId);
    };

    // === SATUAN AUTOCOMPLETE HANDLER ===
    const handleSatuanChange = (e) => {
        const value = e.target.value;

        setFormData((prev) => ({ ...prev, satuan: value }));

        if (!value) {
            setFilteredSatuan([]);
            setIsSatuanOpen(false);
            return;
        }

        const filtered = satuanList.filter((s) =>
            s.toLowerCase().includes(value.toLowerCase())
        );

        setFilteredSatuan(filtered);
        setIsSatuanOpen(filtered.length > 0);
    };

    const handleSelectSatuan = (value) => {
        setFormData((prev) => ({ ...prev, satuan: value }));
        setIsSatuanOpen(false);
    };

    // Simpan Data
    const confirmSave = async () => {
        setShowNotification(false);
        setIsLoading(true);
        setError(null);

        const calculatedTotal = items.reduce(
            (sum, item) => sum + item.volume * item.hpp,
            0
        );

        const itemsPayload = items.map((i) => ({
            item_no: i.displayId,
            volume: Number(i.volume),
        }));

        const ahsDataToSubmit = {
            ...(isEditMode && { id: Number(id) }),

            tahun: formData.tahun,
            merek: formData.merek,
            vendor_id: formData.vendor_id,
            deskripsi: formData.deskripsi,
            produk_deskripsi: formData.produk_deskripsi,
            spesifikasi: formData.spesifikasi,
            satuan: formData.satuan,
            provinsi: formData.provinsi,
            kab: formData.kab,
            produk_foto: formData.foto,
            produk_dokumen: formData.produk_dokumen,
            items: itemsPayload,
            _method: isEditMode ? "PUT" : "POST",
        };

        const formPayload = new FormData();
        buildFormData(formPayload, ahsDataToSubmit);

        const token = localStorage.getItem("token");

        const url = isEditMode ? `${API_URL}/${id}` : API_URL;
        const method = "POST"; // pakai spoofing _method

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    // ❌ JANGAN set Content-Type untuk FormData
                },
                body: formPayload,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message ||
                    JSON.stringify(errorData.errors) ||
                    `Gagal menyimpan data: ${response.status}`
                );
            }

            const result = await response.json();

            fetchDataAllAHS();

            const finalData = {
                id: result.id || Number(id) || Date.now(),
                ...ahsDataToSubmit,
                hpp: calculatedTotal,
                items: itemsPayload,
            };

            if (isEditMode) {
                onEditSubmit(finalData);
            } else {
                onAddSubmit(finalData);
            }

            navigate("/ahs");
        } catch (err) {
            console.error("Error saat menyimpan data AHS:", err);
            setError(err.message || "Terjadi kesalahan saat koneksi ke API.");
            alert(
                "Error: " + (err.message || "Terjadi kesalahan saat menyimpan data.")
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        if (!formData.deskripsi) {
            alert("Deskripsi pekerjaan wajib diisi!");
            return;
        }
        if (items.length === 0) {
            alert("AHS harus memiliki minimal satu rincian item!");
            return;
        }
        setShowNotification(true);
    };

    // --- 4. Helper Styles (CSS Inline) ---
    const inputWrapperStyle = { marginBottom: "15px", width: "100%" };
    const labelStyle = {
        display: "block",
        marginBottom: "5px",
        fontWeight: "bold",
        fontSize: "14px",
        color: "#333",
    };
    const gridStyle = {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "15px",
    };
    const flexContainerStyle = {
        display: "flex",
        alignItems: "center",
        gap: "15px",
        marginBottom: "20px",
    };
    const itemSelectorGroupStyle = {
        display: "flex",
        gap: "10px",
        alignItems: "flex-end",
        marginBottom: "20px",
    };
    const vendorInputGroupStyle = { position: "relative", width: "100%" };

    // Style untuk Autocomplete
    const suggestionListStyle = {
        position: "absolute",
        zIndex: 10,
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        maxHeight: "200px",
        overflowY: "auto",
        width: "100%",
        listStyle: "none",
        padding: 0,
        margin: 0,
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    };
    const suggestionItemStyle = {
        padding: "10px",
        cursor: "pointer",
        borderBottom: "1px solid #eee",
    };
    const suggestionItemHoverStyle = { backgroundColor: "#f0f0f0" };

    // Style Baru untuk File Input Box
    const fileBoxStyle = {
        border: "1px dashed #ccc",
        padding: "15px",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
        minHeight: "80px",
        display: "flex",
        flexDirection: "column",
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

    // --- 5. Return JSX ---
    return (
        <div className="add-ahs-content">
            {/* Header */}
            <div style={flexContainerStyle}>
                <button
                    onClick={() => navigate("/ahs")}
                    style={{
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        padding: 0,
                    }}
                >
                    <FaArrowLeft size={20} color="#333" />
                </button>
                <h2 style={{ margin: 0 }}>
                    {isEditMode ? "Edit Data AHS" : "Tambah Data AHS"}
                </h2>
            </div>

            {/* Error Message */}
            {(error || isVendorsLoading) && (
                <div
                    style={{
                        color: error ? "white" : "#333",
                        backgroundColor: error ? "#e74c3c" : "#f0f0f0",
                        padding: "10px",
                        borderRadius: "5px",
                        marginBottom: "20px",
                        fontWeight: "bold",
                    }}
                >
                    {isVendorsLoading ? "Memuat daftar vendor..." : `Error: ${error}`}
                </div>
            )}

            <form className="ahs-form">
                {/* ID & Deskripsi Utama */}

                <div style={inputWrapperStyle}>
                    <label style={labelStyle}>Deskripsi Pekerjaan *</label>
                    <input
                        type="text"
                        name="deskripsi"
                        value={formData.deskripsi}
                        onChange={handleChange}
                        required
                        style={{ ...inputWrapperStyle }}
                    />
                </div>

                {/* Satuan, Tahun, Provinsi, Kab */}
                <div style={gridStyle}>
                    <div style={inputWrapperStyle} ref={satuanInputRef}>
                        <label style={labelStyle}>Satuan</label>

                        <input
                            type="text"
                            value={formData.satuan}
                            onChange={handleSatuanChange}
                            onFocus={() => filteredSatuan.length > 0 && setIsSatuanOpen(true)}
                            placeholder="Contoh: m2, m3, bh, ls"
                            style={{
                                width: "100%",
                                padding: "10px",
                                height: "42px",
                                boxSizing: "border-box",
                            }}
                        />

                        {isSatuanOpen && filteredSatuan.length > 0 && (
                            <ul style={suggestionListStyle}>
                                {filteredSatuan.map((s, idx) => (
                                    <li
                                        key={idx}
                                        onClick={() => handleSelectSatuan(s)}
                                        style={suggestionItemStyle}
                                        onMouseEnter={(e) =>
                                        (e.currentTarget.style.backgroundColor =
                                            suggestionItemHoverStyle.backgroundColor)
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.backgroundColor = "transparent")
                                        }
                                    >
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div style={inputWrapperStyle}>
                        <label style={labelStyle}>Tahun</label>
                        <input
                            type="text"
                            name="tahun"
                            value={formData.tahun}
                            onChange={handleChange}
                            style={{ ...inputWrapperStyle }}
                        />
                    </div>
                </div>
                <div style={gridStyle}>
                    <div style={inputWrapperStyle}>
                        <label style={labelStyle}>Provinsi</label>
                        <input
                            type="text"
                            name="provinsi"
                            value={formData.provinsi}
                            onChange={handleChange}
                            style={{ ...inputWrapperStyle }}
                        />
                    </div>
                    <div style={inputWrapperStyle}>
                        <label style={labelStyle}>Kabupaten</label>
                        <input
                            type="text"
                            name="kab"
                            value={formData.kab}
                            onChange={handleChange}
                            style={{ ...inputWrapperStyle }}
                        />
                    </div>
                </div>

                {/* Merek & Vendor (Autocomplete) */}
                <div style={gridStyle}>
                    <div style={inputWrapperStyle}>
                        <label style={labelStyle}>Merek</label>
                        <input
                            type="text"
                            name="merek"
                            value={formData.merek}
                            onChange={handleChange}
                            style={{ ...inputWrapperStyle }}
                        />
                    </div>
                    <div style={inputWrapperStyle}>
                        <label style={labelStyle}>Vendor</label>
                        <div style={vendorInputGroupStyle} ref={vendorInputRef}>
                            <input
                                type="text"
                                name="vendor"
                                value={formData.vendor}
                                onChange={handleVendorSearch}
                                placeholder="Ketik nama vendor (PT/CV/nama)"
                                onFocus={() =>
                                    formData.vendor.length > 0 &&
                                    filteredVendors.length > 0 &&
                                    setIsVendorSuggestionOpen(true)
                                }
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    height: "42px",
                                    boxSizing: "border-box",
                                }}
                                disabled={isVendorsLoading}
                            />
                            {isVendorSuggestionOpen && filteredVendors.length > 0 && (
                                <ul style={suggestionListStyle}>
                                    {filteredVendors.map((vendor) => (
                                        <li
                                            key={vendor.id}
                                            onClick={() => handleVendorSelect(vendor)}
                                            style={suggestionItemStyle}
                                            onMouseEnter={(e) =>
                                            (e.currentTarget.style.backgroundColor =
                                                suggestionItemHoverStyle.backgroundColor)
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.backgroundColor = "transparent")
                                            }
                                        >
                                            {vendor.vendor_name ||
                                                vendor.nama ||
                                                `Vendor ID: ${vendor.id}`}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {isVendorsLoading && (
                                <small
                                    style={{ display: "block", marginTop: "5px", color: "#888" }}
                                >
                                    Memuat daftar...
                                </small>
                            )}
                        </div>
                    </div>
                </div>

                {/* 1. Deskripsi Produk */}
                <div style={inputWrapperStyle}>
                    <label style={labelStyle}>Deskripsi Produk</label>
                    <input
                        type="text"
                        name="produk_deskripsi"
                        value={formData.produk_deskripsi}
                        onChange={handleChange}
                        placeholder="Contoh: Semen Gresik 50kg Tipe 1"
                        style={{ ...inputWrapperStyle }}
                    />
                </div>

                {/* --- Upload FOTO Produk (Desain Box Chip) --- */}
                <div style={inputWrapperStyle}>
                    <label style={labelStyle}>Foto Produk</label>
                    <div style={fileBoxStyle}>
                        <label htmlFor="foto-upload" style={browseButtonStyle}>
                            + Tambah Foto
                        </label>
                        <input
                            id="foto-upload"
                            type="file"
                            name="foto"
                            onChange={handleChange}
                            accept="image/*"
                            multiple
                            style={{ display: "none" }}
                        />

                        {existingFotoNames.length > 0 && (
                            <div
                                style={{ fontSize: "12px", marginTop: "10px", color: "#555" }}
                            >
                                File Lama: {existingFotoNames.join(", ")}
                            </div>
                        )}

                        {formData.foto.length > 0 && (
                            <div style={fileChipContainerStyle}>
                                {formData.foto.map((file, index) => (
                                    <span key={index} style={fileChipStyle}>
                                        {file.name}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFile(file.name, "foto")}
                                            style={removeButtonStyle}
                                            title="Hapus file ini"
                                        >
                                            &times;
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- 2. Spesifikasi (Dokumen Multiple dan Teks) --- */}
                <div style={inputWrapperStyle}>
                    <label style={labelStyle}>Spesifikasi (Dokumen & Teks)</label>

                    {/* Input Dokumen (Desain Box Chip) */}
                    <div style={fileBoxStyle}>
                        <label htmlFor="dokumen-upload" style={browseButtonStyle}>
                            + Tambah Dokumen
                        </label>
                        <input
                            id="dokumen-upload"
                            type="file"
                            name="produk_dokumen"
                            onChange={handleChange}
                            accept=".pdf,.doc,.docx,.xls,.xlsx"
                            multiple
                            style={{ display: "none" }}
                        />

                        {existingProdukDokumenNames.length > 0 && (
                            <div
                                style={{ fontSize: "12px", marginTop: "10px", color: "#555" }}
                            >
                                Dokumen Lama: {existingProdukDokumenNames.join(", ")}
                            </div>
                        )}

                        {formData.produk_dokumen.length > 0 && (
                            <div style={fileChipContainerStyle}>
                                {formData.produk_dokumen.map((file, index) => (
                                    <span key={index} style={fileChipStyle}>
                                        {file.name}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleRemoveFile(file.name, "produk_dokumen")
                                            }
                                            style={removeButtonStyle}
                                            title="Hapus dokumen ini"
                                        >
                                            &times;
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Textarea (Teks Spesifikasi) */}
                    <textarea
                        name="spesifikasi"
                        value={formData.spesifikasi}
                        onChange={handleChange}
                        placeholder="Contoh: &#10;• Berat: 50kg&#10;• Standar: SNI"
                        rows="4"
                        style={{
                            width: "100%",
                            padding: "10px",
                            boxSizing: "border-box",
                            resize: "vertical",
                            minHeight: "80px",
                            marginTop: "15px",
                        }}
                    ></textarea>
                </div>

                <hr style={{ margin: "20px 0", borderTop: "1px solid #eee" }} />

                <h3>Rincian Item Penyusun AHS</h3>

                {/* Item Selector Section */}
                <div style={itemSelectorGroupStyle}>
                    <div style={{ flex: 3 }}>
                        <label style={labelStyle}>Pilih Item/AHS Lain</label>
                        <ItemSelector
                            itemList={allItemList}
                            selectedObject={selectedItemToAdd}
                            onSelect={handleItemSelect}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Volume *</label>
                        <input
                            type="number"
                            value={currentItemVolume}
                            onChange={(e) => setCurrentItemVolume(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px",
                                height: "42px",
                                boxSizing: "border-box",
                            }}
                            min="0.001"
                            step="any"
                            required
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="btn-save"
                        style={{ height: "42px", alignSelf: "flex-end", padding: "0 20px" }}
                        disabled={
                            !selectedItemToAdd || Number(currentItemVolume) <= 0 || isLoading
                        }
                    >
                        {editingItemId ? "Update Item" : "+ Tambah"}
                    </button>
                </div>

                {/* Table Items */}
                <div className="item-list">
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "14px",
                            border: "1px solid #ddd",
                        }}
                    >
                        <thead style={{ backgroundColor: "#ecf0f1" }}>
                            <tr>
                                <th
                                    style={{
                                        padding: "12px 8px",
                                        width: "100px",
                                        textAlign: "left",
                                        border: "1px solid #ddd",
                                    }}
                                >
                                    ID
                                </th>
                                <th
                                    style={{
                                        padding: "12px 8px",
                                        textAlign: "left",
                                        border: "1px solid #ddd",
                                    }}
                                >
                                    Uraian
                                </th>
                                <th
                                    style={{
                                        padding: "12px 8px",
                                        width: "80px",
                                        textAlign: "center",
                                        border: "1px solid #ddd",
                                    }}
                                >
                                    Satuan
                                </th>
                                <th
                                    style={{
                                        padding: "12px 8px",
                                        width: "80px",
                                        textAlign: "center",
                                        border: "1px solid #ddd",
                                    }}
                                >
                                    Vol
                                </th>
                                <th
                                    style={{
                                        padding: "12px 8px",
                                        width: "120px",
                                        textAlign: "right",
                                        border: "1px solid #ddd",
                                    }}
                                >
                                    HPP
                                </th>
                                <th
                                    style={{
                                        padding: "12px 8px",
                                        width: "120px",
                                        textAlign: "right",
                                        border: "1px solid #ddd",
                                    }}
                                >
                                    Jumlah
                                </th>
                                <th
                                    style={{
                                        padding: "12px 8px",
                                        width: "60px",
                                        textAlign: "center",
                                        border: "1px solid #ddd",
                                    }}
                                >
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length > 0 ? (
                                items.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                                        <td style={{ padding: "8px", border: "1px solid #eee" }}>
                                            {item.displayId || item.itemId}
                                        </td>
                                        <td style={{ padding: "8px", border: "1px solid #eee" }}>
                                            {item.uraian}
                                        </td>
                                        <td
                                            style={{
                                                padding: "8px",
                                                textAlign: "center",
                                                border: "1px solid #eee",
                                            }}
                                        >
                                            {item.satuan}
                                        </td>
                                        <td
                                            style={{
                                                padding: "8px",
                                                textAlign: "center",
                                                border: "1px solid #eee",
                                            }}
                                        >
                                            {item.volume.toFixed(3)}
                                        </td>
                                        <td
                                            style={{
                                                padding: "8px",
                                                textAlign: "right",
                                                border: "1px solid #eee",
                                            }}
                                        >
                                            {item.hpp.toLocaleString("id-ID")}
                                        </td>
                                        <td
                                            style={{
                                                padding: "8px",
                                                textAlign: "right",
                                                border: "1px solid #eee",
                                            }}
                                        >
                                            {(item.volume * item.hpp).toLocaleString("id-ID")}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            <button
                                                type="button"
                                                onClick={() => handleEditItem(item)}
                                                style={{
                                                    marginRight: "6px",
                                                    color: "#2980b9",
                                                    border: "none",
                                                    background: "none",
                                                    cursor: "pointer",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                <FaPencilAlt />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(item.itemId)}
                                                style={{
                                                    color: "red",
                                                    border: "none",
                                                    background: "none",
                                                    cursor: "pointer",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                X
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="7"
                                        style={{
                                            textAlign: "center",
                                            padding: "15px",
                                            color: "#888",
                                            border: "1px solid #eee",
                                        }}
                                    >
                                        Belum ada rincian item. Tambahkan item atau AHS lain yang
                                        akan menjadi komponen.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot style={{ fontWeight: "bold", backgroundColor: "#f0f3f4" }}>
                            <tr>
                                <td
                                    colSpan="5"
                                    style={{
                                        padding: "10px",
                                        textAlign: "right",
                                        border: "1px solid #ddd",
                                    }}
                                >
                                    TOTAL HARGA POKOK:
                                </td>
                                <td
                                    style={{
                                        padding: "10px",
                                        textAlign: "right",
                                        border: "1px solid #ddd",
                                    }}
                                >
                                    {items
                                        .reduce((sum, i) => sum + i.volume * i.hpp, 0)
                                        .toLocaleString("id-ID")}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Buttons */}
                <div style={{ marginTop: "30px", display: "flex", gap: "15px" }}>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="btn-save"
                        style={{ flex: 1 }}
                        disabled={isLoading || !formData.deskripsi || items.length === 0}
                    >
                        {isLoading
                            ? isEditMode
                                ? "Menyimpan..."
                                : "Menambah..."
                            : isEditMode
                                ? "Simpan Perubahan"
                                : "Simpan Data Baru"}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/ahs")}
                        className="btn-cancel"
                        style={{ flex: 1 }}
                    >
                        Batal
                    </button>
                </div>
            </form>

            {showNotification && (
                <Notification
                    message={
                        isEditMode ? "Simpan perubahan data ini?" : "Simpan data baru ini?"
                    }
                    onConfirm={confirmSave}
                    onCancel={() => setShowNotification(false)}
                />
            )}
        </div>
    );
};

export default AddAHS;
