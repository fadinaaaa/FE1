// src/components/Sidebar.js

import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";
import LogoImg from "../assets/logo.png"; // Pastikan path ini benar

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="sidebar">
      <div>
        {/* 🔹 Logo dan Teks */}
        <div className="logo">
          <img src={LogoImg} alt="Logo TTMT" />
        </div>

        {/* 🔹 Menu Navigasi */}
        <ul>
          <li>
            <Link
              to="/dashboard"
              className={location.pathname.startsWith("/dashboard") ? "active" : ""}
            >
              DASHBOARD
            </Link>
          </li>
          <li>
            <Link
              to="/vendor"
              className={location.pathname.startsWith("/vendor") ? "active" : ""}
            >
              VENDOR
            </Link>
          </li>
          <li>
            <Link
              to="/item"
              className={location.pathname.startsWith("/item") ? "active" : ""}
            >
              ITEM
            </Link>
          </li>
          <li>
            <Link
              to="/ahs"
              className={location.pathname.startsWith("/ahs") ? "active" : ""}
            >
              AHS
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;