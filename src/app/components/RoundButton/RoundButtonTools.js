import React from "react";
import styles from "./RoundButton.module.scss";

export const RoundButtonTools = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{ border: "3px solid black" }}
      className={[styles.button, styles.buttonHover].join(" ")}
    >
      {children}
    </button>
  );
};

export const RoundButtonInputArt = ({
  border = "3px solid black",
  children,
  onClick,
  width,
  height,
  borderRadius,
  padding,
  cursor = "text",
  disabled,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        border: border,
        width: width,
        height: height,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: borderRadius,
        padding: padding,
        cursor: cursor,
      }}
      className={[styles.button].join(" ")}
    >
      {" "}
      {children}
    </button>
  );
};
