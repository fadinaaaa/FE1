import { useEffect, useRef, useState } from "react";
import { FaArrowLeft, FaPencilAlt } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import ItemSelector from "../components/ItemSelector";
import Notification from "../components/Notification";
import "../styles/AddAHS.css";

// URL API Anda
const API_URL = "http://127.0.0.1:8000/api/ahs";
const VENDOR_API_URL = "http://127.0.0.1:8000/api/vendors";
const PROVINSI_API_URL = "http://127.0.0.1:8000/api/provinsi";
const KABUPATEN_API_URL = "http://127.0.0.1:8000/api/kabupaten";

const role = localStorage.getItem("role");
const token = localStorage.getItem("token");

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;



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
    foto: [],
    produk_deskripsi: "",
    produk_dokumen: [],
    spesifikasi: "",
  });

  useEffect(() => {
    console.log("DEBUG allAhsData:", allAhsData);
  }, [allAhsData]);

  const [items, setItems] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [selectedItemToAdd, setSelectedItemToAdd] = useState(null);
  const [currentItemVolume, setCurrentItemVolume] = useState(1);

  const [existingFotoNames, setExistingFotoNames] = useState([]);
  const [existingProdukDokumenNames, setexistingProdukDokumenNames] =
    useState([]);

  const vendorInputRef = useRef(null);

  // === AUTOCOMPLETE ===
  //deskripsi
  const [deskripsiList, setDeskripsiList] = useState([]);
  const [filteredDeskripsi, setFilteredDeskripsi] = useState([]);
  const [isDeskripsiOpen, setIsDeskripsiOpen] = useState(false);
  const deskripsiRef = useRef(null);
  //satuan
  const [satuanList, setSatuanList] = useState([]);
  const [filteredSatuan, setFilteredSatuan] = useState([]);
  const [isSatuanOpen, setIsSatuanOpen] = useState(false);
  const satuanInputRef = useRef(null);
  //tahun
  const [tahunList, setTahunList] = useState([]);
  const [filteredTahun, setFilteredTahun] = useState([]);
  const [isTahunOpen, setIsTahunOpen] = useState(false);
  //prov
  const [provinsiList, setProvinsiList] = useState([]);
  const [filteredProvinsi, setFilteredProvinsi] = useState([]);
  const [isProvinsiOpen, setIsProvinsiOpen] = useState(false);
  //kab
  const [kabupatenList, setKabupatenList] = useState([]);
  const [filteredKabupaten, setFilteredKabupaten] = useState([]);
  const [isKabupatenOpen, setIsKabupatenOpen] = useState(false);
  //vendor
  const [allVendors, setAllVendors] = useState([]);
  const [isVendorsLoading, setIsVendorsLoading] = useState(false);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [isVendorSuggestionOpen, setIsVendorSuggestionOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  //merek
  const [merekList, setMerekList] = useState([]);
  const [filteredMerek, setFilteredMerek] = useState([]);
  const [isMerekOpen, setIsMerekOpen] = useState(false);


  useEffect(() => {
    if (!Array.isArray(allAhsData)) return;

    const set = new Set();
    allAhsData.forEach(a => {
      if (typeof a.provinsi === "string") {
        set.add(a.provinsi.trim());
      }
    });

    setProvinsiList(Array.from(set));
  }, [allAhsData]);

  useEffect(() => {
    if (!Array.isArray(allAhsData) || !formData.provinsi) return;

    const set = new Set();

    allAhsData.forEach(a => {
      if (a.provinsi === formData.provinsi && typeof a.kab === "string") {
        set.add(a.kab.trim());
      }
    });

    setKabupatenList(Array.from(set));
  }, [allAhsData, formData.provinsi]);

  useEffect(() => {
    if (!Array.isArray(allAhsData)) return;

    const set = new Set();

    allAhsData.forEach(a => {
      if (a.deskripsi) {
        set.add(a.deskripsi.trim());
      }
    });

    setDeskripsiList(Array.from(set));
  }, [allAhsData]);

  useEffect(() => {
    if (!Array.isArray(allAhsData)) return;

    const set = new Set();

    allAhsData.forEach(a => {
      if (a.tahun) {
        set.add(String(a.tahun));
      }
    });

    setTahunList(Array.from(set).sort((a, b) => a - b));
  }, [allAhsData]);

  useEffect(() => {
    if (!Array.isArray(allAhsData)) return;

    const set = new Set();

    allAhsData.forEach(a => {
      if (typeof a.merek === "string") {
        set.add(a.merek.trim());
      }
    });

    setMerekList(Array.from(set));
  }, [allAhsData]);

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
    if (!Array.isArray(allAhsData)) return;

    const set = new Set();

    allAhsData.forEach(a => {
      if (typeof a.satuan === "string" && a.satuan.trim()) {
        set.add(a.satuan.trim());
      }

      if (a.satuan && typeof a.satuan.nama === "string") {
        set.add(a.satuan.nama.trim());
      }
    });

    const result = Array.from(set);
    console.log("SATUAN LIST:", result);

    setSatuanList(result);
  }, [allAhsData]);

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

        if (dataToEdit.vendor && typeof dataToEdit.vendor === "object") {
          vendorName =
            dataToEdit.vendor?.vendor_name ||
            dataToEdit.vendor?.nama || "";
          vendorId =
            dataToEdit.vendor?.vendor_id ||
            dataToEdit.vendor?.id || null;
        }

        // const rawFoto = dataToEdit.produk_foto || dataToEdit.foto || dataToEdit.item_ahs?.foto || [];
        const rawFoto = dataToEdit.gambar || [];
        const fotos = Array.isArray(rawFoto) ? rawFoto : (rawFoto ? [rawFoto] : []);
        // const rawDokumen = dataToEdit.produk_dokumen || dataToEdit.dokumen || dataToEdit.item_ahs?.dokumen || [];
        const rawDokumen = dataToEdit.dokumen || [];
        const docs = Array.isArray(rawDokumen) ? rawDokumen : (rawDokumen ? [rawDokumen] : []);

        setExistingFotoNames(fotos.map((f) => f.split(/[/\\]/).pop()));
        setexistingProdukDokumenNames(
          docs.map((d) => d.split(/[/\\]/).pop())
        );

        setFormData((prev) => ({
          ...prev,
          ahs: dataToEdit.ahs_no || dataToEdit.ahs || `AHS-${dataToEdit.id}`,
          deskripsi: dataToEdit.deskripsi || "",
          produk_deskripsi:
            dataToEdit.produk_deskripsi ||
            dataToEdit.item_ahs?.produk_deskripsi ||
            dataToEdit.item_ahs?.deskripsi ||
            "",
          satuan: dataToEdit.satuan || "m3",
          provinsi: dataToEdit.provinsi || "",
          kab: dataToEdit.kab || "",
          tahun: dataToEdit.tahun || "",
          merek: dataToEdit.merek || "",
          vendor: vendorName,
          vendor_id: vendorId,
          foto: fotos,
          produk_dokumen: docs,
          spesifikasi:
            dataToEdit.item_ahs?.spesifikasi ||
            dataToEdit.spesifikasi ||
            "",
        }));
        setSelectedVendorId(vendorId);

        const sourceItems =
          dataToEdit.items ||
          dataToEdit.item_ahs ||
          dataToEdit.rincian ||
          [];
        const loadedItems = sourceItems.map((i) => ({
          itemId: i.item_id,
          displayId: i.item_no,
          uraian: i.uraian,
          satuan: i.satuan,
          volume: Number(i.volume),
          hpp: Number(i.hpp),
        }));

        setItems(loadedItems);
      }
    }
  }, [isEditMode, id, allAhsData]);

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
        const prov = vendor.provinsi || "";
        return (
          name.toLowerCase().includes(lowerCaseValue) ||
          prov.toLowerCase().includes(lowerCaseValue)
        );
      });
      setFilteredVendors(filtered);
      setIsVendorSuggestionOpen(filtered.length > 0);
    } else {
      setFilteredVendors([]);
      setIsVendorSuggestionOpen(false);
    }
  };

  const handleVendorSelect = (vendor) => {
    const vendorName = vendor?.vendor_name || vendor?.nama || "";
    const vendorId = vendor?.vendor_id || vendor?.id || null;
    setFormData({ ...formData, vendor: vendorName, vendor_id: vendorId });
    setSelectedVendorId(vendor?.id || null);
    setIsVendorSuggestionOpen(false);
  };

  // 🔥 HANDLE HAPUS FILE (AMAN UNTUK FILE BARU & FILE LAMA)
  const handleRemoveFile = (fileName, fieldName) => {
    // hapus dari tampilan
    setFormData((prev) => {
      const currentFiles = Array.isArray(prev[fieldName]) ? prev[fieldName] : [];

      return {
        ...prev,
        [fieldName]: currentFiles.filter((file) => {
          if (file instanceof File) return file.name !== fileName;
          if (typeof file === "string")
            return file.split(/[/\\]/).pop() !== fileName;
          return true;
        }),
      };
    });

    // 🔥 sinkron ke existing file list
    if (fieldName === "foto") {
      setExistingFotoNames((prev) =>
        prev.filter((name) => name !== fileName)
      );
    }

    if (fieldName === "produk_dokumen") {
      setexistingProdukDokumenNames((prev) =>
        prev.filter((name) => name !== fileName)
      );
    }
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
      setFormData((prev) => ({ ...prev, [name]: value }));
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

    // Pastikan semua properti ada
    const itemToSave = {
      itemId: selectedItemToAdd.item_id || selectedItemToAdd.displayId || "UNKNOWN",
      displayId: selectedItemToAdd.displayId || selectedItemToAdd.item_id || "UNKNOWN",
      uraian: selectedItemToAdd.displayName || selectedItemToAdd.uraian || "Item Tanpa Nama",
      satuan: selectedItemToAdd.displayUnit || selectedItemToAdd.satuan || "-",
      volume: Number(currentItemVolume),
      hpp: Number(selectedItemToAdd.displayPrice || 0),
    };

    setItems((prev) => {
      if (editingItemId) {
        return prev.map((i) =>
          String(i.displayId) === String(editingItemId) ? itemToSave : i
        );
      }

      const isDuplicate = prev.some((i) => String(i.displayId) === String(itemToSave.displayId));
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
        prev.filter((item) => String(item.displayId) !== String(itemId))
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
      uraian: item.uraian,
      hpp: item.hpp,
      satuan: item.satuan
    });
    setCurrentItemVolume(item.volume);
    setEditingItemId(item.displayId);
  };

  //deskripsi pekerjaan autocomplete
  const handleDeskripsiChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, deskripsi: value }));

    if (!value) {
      setIsDeskripsiOpen(false);
      return;
    }

    const filtered = deskripsiList.filter(d =>
      d.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredDeskripsi(filtered);
    setIsDeskripsiOpen(filtered.length > 0);
  };

  const handleSelectDeskripsi = (value) => {
    setFormData(prev => ({ ...prev, deskripsi: value }));
    setIsDeskripsiOpen(false);
  };
  // tahun autocomplete
  const handleTahunChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, tahun: value }));

    if (value.length === 0) {
      setFilteredTahun([]);
      setIsTahunOpen(false);
      return;
    }

    const filtered = tahunList.filter(t =>
      t.includes(value)
    );

    setFilteredTahun(filtered);
    setIsTahunOpen(true);
  };
  //prov autocomplete
  const handleProvinsiChange = (e) => {
    const value = e.target.value;

    setFormData(prev => ({
      ...prev,
      provinsi: value,
      kab: "",
    }));

    if (value.length === 0) {
      setFilteredProvinsi([]);
      setIsProvinsiOpen(false);
      return;
    }

    const filtered = provinsiList.filter(p =>
      p.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredProvinsi(filtered);
    setIsProvinsiOpen(true);
  };
  //kab
  const handleKabupatenChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, kab: value }));

    if (value.length === 0) {
      setFilteredKabupaten([]);
      setIsKabupatenOpen(false);
      return;
    }

    const filtered = kabupatenList.filter(k =>
      k.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredKabupaten(filtered);
    setIsKabupatenOpen(true);
  };
  //merek
  const handleMerekChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, merek: value }));

    if (value.length === 0) {
      setFilteredMerek([]);
      setIsMerekOpen(false);
      return;
    }

    const filtered = merekList.filter(m =>
      m.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredMerek(filtered);
    setIsMerekOpen(true);
  };
  //satuan autocomplete
  const handleSatuanChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, satuan: value }));

    if (value.length === 0) {
      setFilteredSatuan([]);
      setIsSatuanOpen(false);
      return;
    }

    const filtered = satuanList.filter(s =>
      s.toLowerCase().includes(value.toLowerCase())
    );
    console.log("FILTERED:", filtered);
    setFilteredSatuan(filtered);
    setIsSatuanOpen(filtered.length > 0);
  };

  const handleSelectSatuan = (value) => {
    setFormData(prev => ({ ...prev, satuan: value }));
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
      ahs_no: formData.ahs,
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
      existing_foto: existingFotoNames,
      existing_produk_dokumen: existingProdukDokumenNames,
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
    console.log("DEBUG SAVE:", {
      deskripsi: formData.deskripsi,
      itemsLength: items.length,
      items,
    });

    if (!formData.deskripsi) {
      alert("Deskripsi pekerjaan wajib diisi!");
      return;
    }

    if (items.length === 0) {
      alert("Data item belum termuat. Silakan refresh halaman.");
      return;
    }

    setShowNotification(true);
  };


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

        <div style={inputWrapperStyle} ref={deskripsiRef}>
          <label style={labelStyle}>Deskripsi Pekerjaan *</label>
          <div className="satuan-wrapper">
            <input
              placeholder="Pekerjaan"
              type="text"
              value={formData.deskripsi}
              onChange={handleDeskripsiChange}
              autoComplete="off"
            />
            {isDeskripsiOpen && (
              <div className="satuan-dropdown">
                {filteredDeskripsi.map((d, i) => (
                  <div
                    key={i}
                    className="satuan-item"
                    onClick={() => handleSelectDeskripsi(d)}
                  >
                    {d}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={gridStyle}>
          <div style={inputWrapperStyle} ref={satuanInputRef}>
            <label style={labelStyle}>Satuan</label>
            <div className="satuan-wrapper">
              <input
                type="text"
                value={formData.satuan}
                onChange={handleSatuanChange}
                placeholder="Satuan"
              />
              {isSatuanOpen && filteredSatuan.length > 0 && (
                <div className="satuan-dropdown">
                  {filteredSatuan.map((s, i) => (
                    <div
                      key={i}
                      className="satuan-item"
                      onClick={() => handleSelectSatuan(s)}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={inputWrapperStyle}>
            <label style={labelStyle}>Tahun</label>
            <div className="satuan-wrapper">
              <input
                type="text"
                value={formData.tahun}
                onChange={handleTahunChange}
                onFocus={() => {
                  setFilteredTahun(tahunList);
                  setIsTahunOpen(tahunList.length > 0);
                }}
                autoComplete="off"
              />
              {isTahunOpen && (
                <div className="satuan-dropdown">
                  {filteredTahun.map((t, i) => (
                    <div
                      key={i}
                      className="satuan-item"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, tahun: t }));
                        setIsTahunOpen(false);
                      }}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={inputWrapperStyle}>
            <label style={labelStyle}>Provinsi</label>
            <div className="satuan-wrapper">
              <input
                type="text"
                value={formData.provinsi}
                onChange={handleProvinsiChange}
                autoComplete="off"
                placeholder="Provinsi"
              />

              {isProvinsiOpen && (
                <div className="satuan-dropdown">
                  {filteredProvinsi.map((p, i) => (
                    <div
                      key={i}
                      className="satuan-item"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, provinsi: p, kab: "" }));
                        setIsProvinsiOpen(false);
                      }}
                    >
                      {p}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={inputWrapperStyle}>
            <label style={labelStyle}>Kabupaten</label>
            <div className="satuan-wrapper">
              <input
                type="text"
                value={formData.kab}
                onChange={handleKabupatenChange}
                disabled={!formData.provinsi}
                placeholder={!formData.provinsi ? "Isi provinsi terlebih duhulu" : "Kabupaten"}
                autoComplete="off"
              />
              {isKabupatenOpen && (
                <div className="satuan-dropdown">
                  {filteredKabupaten.map((k, i) => (
                    <div
                      key={i}
                      className="satuan-item"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, kab: k }));
                        setIsKabupatenOpen(false);
                      }}
                    >
                      {k}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Merek & Vendor (Autocomplete) */}
        <div style={gridStyle}>
          <div style={inputWrapperStyle}>
            <label style={labelStyle}>Merek</label>
            <div className="satuan-wrapper">
              <input
                placeholder="Merek Produk"
                type="text"
                value={formData.merek}
                onChange={handleMerekChange}
                autoComplete="off"
              />

              {isMerekOpen && (
                <div className="satuan-dropdown">
                  {filteredMerek.map((m, i) => (
                    <div
                      key={i}
                      className="satuan-item"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, merek: m }));
                        setIsMerekOpen(false);
                      }}
                    >
                      {m}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                      style={{
                        ...suggestionItemStyle,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        suggestionItemHoverStyle.backgroundColor)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <span>
                        {vendor.vendor_name || vendor.nama}
                      </span>

                      <span
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          fontStyle: "italic",
                        }}
                      >
                        ({(vendor.provinsi || vendor.nama_provinsi || "").toLowerCase()})
                      </span>
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

            {/* {existingFotoNames.length > 0 && (
                <div
                  style={{ fontSize: "12px", marginTop: "10px", color: "#555" }}
                >
                  File Lama: {existingFotoNames.join(", ")}
                </div>
              )} */}

            {formData.foto.map((file, index) => {
              let fileName = "";
              let fileUrl = null;
              if (file instanceof File) {
                fileName = file.name;
              } else if (typeof file === "string") {
                fileName = file.split(/[/\\]/).pop(); // Ambil nama dari URL
                fileUrl = file;
              } else if (file.url || file.nama) {
                fileName = file.nama || file.url.split(/[/\\]/).pop();
              } else {
                fileName = file.nama || (file.url ? file.url.split(/[/\\]/).pop() : "Dokumen");
                fileUrl = file.url;
              }

              return (
                <span key={index} style={fileChipStyle}>
                  {/* Jika ada URL (file lama), buat jadi link bisa diklik */}
                  {fileUrl ? (
                    <a href={fileUrl} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                      📄 {fileName}
                    </a>
                  ) : (
                    <span>{fileName}</span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveFile(fileName, "foto")}
                    style={removeButtonStyle}
                    title="Hapus file ini"
                  >
                    &times;
                  </button>
                </span>
              );
            })}
          </div>
        </div>

        {/* --- 2. Spesifikasi (Dokumen Multiple dan Teks) --- */}
        <div style={inputWrapperStyle}>
          <label style={labelStyle}>Spesifikasi (Dokumen & Teks)</label>
          <p
            style={{
              fontSize: "12px",
              color: "#666",
              margin: "0 0 5px 0",
            }}
          >
            Maksimal ukuran per file pdf : {MAX_FILE_SIZE_MB}
            MB
          </p>
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

            {/* {existingProdukDokumenNames.length > 0 && (
                <div
                  style={{ fontSize: "12px", marginTop: "10px", color: "#555" }}
                >
                  Dokumen Lama: {existingProdukDokumenNames.join(", ")}
                </div>
              )} */}

            {formData.produk_dokumen.map((file, index) => {
              let fileName = "";
              let fileUrl = null;

              if (file instanceof File) {
                fileName = file.name;
              } else if (typeof file === "string") {
                fileName = file.split(/[/\\]/).pop();
                fileUrl = file;
              } else {
                fileName = file.nama || (file.url ? file.url.split(/[/\\]/).pop() : "Dokumen");
                fileUrl = file.url;
              }

              return (
                <span key={index} style={fileChipStyle}>
                  {/* Jika ada URL (file lama), buat jadi link bisa diklik */}
                  {fileUrl ? (
                    <a href={fileUrl} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                      📄 {fileName}
                    </a>
                  ) : (
                    <span>{fileName}</span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveFile(fileName, "produk_dokumen")}
                    style={removeButtonStyle}
                    title="Hapus dokumen ini"
                  >
                    &times;
                  </button>
                </span>
              );
            })}
          </div>


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
                items.map((item) => (
                  <tr key={item.displayId} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px", border: "1px solid #eee" }}>
                      {item.displayId}
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
                        onClick={() => handleRemoveItem(item.displayId)}
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
