import React from 'react';

const Notification = ({ message, onConfirm, onCancel }) => {
    // Style untuk background gelap (Overlay)
    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Hitam transparan
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000 // Agar selalu di paling atas
    };

    // Style untuk kotak putih (Modal)
    const modalStyle = {
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        minWidth: '350px',
        textAlign: 'center'
    };

    // Style tombol
    const buttonStyle = {
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        marginLeft: '10px'
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <h3 style={{ marginTop: 0, color: '#333' }}>Konfirmasi</h3>
                <p style={{ marginBottom: '25px', color: '#555' }}>{message}</p>
                
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {/* Tombol Batal */}
                    <button 
                        onClick={onCancel} 
                        style={{ ...buttonStyle, backgroundColor: '#e0e0e0', color: '#333' }}
                    >
                        Batal
                    </button>

                    {/* Tombol Ya/Simpan */}
                    <button 
                        onClick={onConfirm} 
                        style={{ ...buttonStyle, backgroundColor: '#28a745', color: 'white' }}
                    >
                        Ya, Simpan
                    </button>
                </div>
            </div>
        </div>
    );
};

// PENTING: Gunakan export default agar cocok dengan import di AddAHS.js
export default Notification;