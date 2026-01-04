import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav style={{ padding: "10px", background: "#2E1878", color: "white" }}>
      <Link to="/ahs" style={{ marginRight: "20px", color: "white", textDecoration: "none" }}>
        
      </Link>
    </nav>
  );
};

export default Navbar;
