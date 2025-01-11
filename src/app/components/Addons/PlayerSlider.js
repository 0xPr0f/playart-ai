import React from "react";

export const PlayerSlider = ({ children }) => {
  //5480E9
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "1em 0.5em",
          width: "100%",
          gap: "1.5em",
          height: "4em",
          border: "2px solid black",
          margin: "2em 0.6em",
          borderRadius: "50px",
          backgroundColor: "#8860CE",
          textAlign: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
};
