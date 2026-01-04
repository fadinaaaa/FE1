// src/data/ahsData.js

export const AHS_LIST = [
  {
    id: "AHS1",
    deskripsi: "Pekerjaan Survey dan Pengukuran",
    satuan: "Ls",
    provinsi: "Jawa Tengah",
    kab: "Magelang",
    tahun: "2024",

    // ===== DETAIL ATAS =====
    merek: "Bosch",
    deskripsi_produk: "Jasa survey lapangan dan pengukuran teknis",
    spesifikasi: {
      teks: "Standar PU, akurasi tinggi",
      dokumen: "spesifikasi-survey.pdf"
    },
    foto: null,

    vendor: {
      vendor_name: "PT Survey Nusantara"
    },

    // ===== DETAIL BAWAH =====
    items: [
      { itemId: "M_100", uraian: "Sewa Motor", satuan: "Hr", volume: 0.05, hpp: 24000 },
      { itemId: "M_101", uraian: "Alat Ukur", satuan: "Bh", volume: 0.05, hpp: 70000 },
      { itemId: "M_084", uraian: "Tenaga Ahli", satuan: "ho", volume: 0.01, hpp: 281446 }
    ]
  },

  {
    id: "AHS2",
    deskripsi: "Administrasi dan Dokumentasi",
    satuan: "Unit",
    provinsi: "Jawa Timur",
    kab: "Madiun",
    tahun: "2025",

    merek: "-",
    deskripsi_produk: "-",
    spesifikasi: {
      teks: "-",
      dokumen: null
    },
    foto: null,

    vendor: {
      vendor_name: "CV Karya Mandiri"
    },

    items: [
      { itemId: "M_114", uraian: "Kertas folio 70 gr", satuan: "Rim", volume: 0.02, hpp: 37600 },
      { itemId: "M_115", uraian: "Ball point", satuan: "Bh", volume: 0.02, hpp: 550 }
    ]
  },

  {
    id: "AHS3",
    deskripsi: "Pekerjaan Uitzet / Pengukuran Ulang",
    satuan: "Unit",
    provinsi: "Jawa Timur",
    kab: "Madiun",
    tahun: "2024",

    merek: "Bosch",
    deskripsi_produk: "Jasa pengukuran dan penandaan lapangan",
    spesifikasi: {
      teks: "Pengukuran sesuai standar PU, akurasi tinggi, menggunakan alat ukur digital.",
      dokumen: "spesifikasi-survey.pdf"
    },
    foto: null,

    vendor: {
      vendor_name: "PT Survey Nusantara"
    },

    items: [
      { itemId: "M_100", uraian: "Sewa Motor", satuan: "Hr", volume: 0.05, hpp: 24000 },
      { itemId: "M_101", uraian: "Alat Ukur", satuan: "Bh", volume: 0.05, hpp: 70000 }
    ]
  }
];
