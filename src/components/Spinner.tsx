import React from "react";
import "./Spinner.css";

const Spinner: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="sk-chase">
        <div className="sk-chase-dot"></div>
        <div className="sk-chase-dot"></div>
        <div className="sk-chase-dot"></div>
        <div className="sk-chase-dot"></div>
        <div className="sk-chase-dot"></div>
        <div className="sk-chase-dot"></div>
      </div>
    </div>
  );
};

export default Spinner;
