// src/components/Header.js

import React, { useState, useEffect } from 'react'; // Tambah useEffect
import { useNavigate } from 'react-router-dom';
import './header.css';

const Header = () => {
    const navigate = useNavigate();
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [username, setUsername] = useState('User'); // State untuk menampung nama

    // --- LOGIKA MENGAMBIL USERNAME ---
    useEffect(() => {
        // Ambil data 'username' yang disimpan di localStorage saat login
        const storedUsername = localStorage.getItem('username');
        
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, []); // Array kosong artinya dijalankan sekali saat komponen dimuat
    // ---------------------------------

    const handleProfileClick = () => {
        setDropdownVisible(prev => !prev);
    };

    const handleLogout = async () => {
        const token = localStorage.getItem('token');

        try {
            await fetch('http://127.0.0.1:8000/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // --- BERSIHKAN DATA SESI ---
            localStorage.removeItem('token');     // Hapus Token
            localStorage.removeItem('username');  // Hapus Username (PENTING)
            
            setDropdownVisible(false);
            navigate('/'); 
        }
    };

    return (
        <header 
            className="header-bar" 
            style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                padding: '10px 25px', 
                background: 'white', 
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                position: 'relative',
                zIndex: 100
            }}
        >
            <div className="profile-container">
                {/* Ikon Profil (Button) */}
                <button 
                    className="profile-icon" 
                    onClick={handleProfileClick}
                    title={username} // Tooltip nama user saat di-hover
                >
                    👤
                </button>

                {/* Dropdown Profil */}
                {isDropdownVisible && (
                    <div className="profile-dropdown">
                        {/* Tampilkan variable username di sini */}
                        <p className="admin-name" style={{ fontWeight: 'bold', padding: '0 10px' }}>
                            Hi, {username}
                        </p>
                        <hr />
                        <button 
                            className="logout-button" 
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;