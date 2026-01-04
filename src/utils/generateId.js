// src/utils/generateId.js
export const generateId = () => {
  return 'AHS_' + Math.floor(Math.random() * 10000);
};

export const generateAHS = () => {
  // Bisa diisi otomatis sesuai kebutuhan, misal berdasarkan kategori
  return 'Material';
};
