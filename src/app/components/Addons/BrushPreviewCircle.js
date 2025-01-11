import React, { useEffect } from 'react'
import styles from './styles/BrushPreviewCircle.module.scss'

export const BrushPreviewCircle = ({ color, height, width, border }) => {
  return (
    <span
      className={[styles.circle].join(' ')}
      style={{
        backgroundColor: color,
        width: width,
        height: height,
        border: border,
      }}
    ></span>
  )
}

export const BrushPreviewCircleWithIcon = ({
  color,
  height,
  width,
  border,
  children,
  onClick,
}) => {
  return (
    <span
      onClick={onClick}
      className={[styles.circle, styles.circleHover].join(' ')}
      style={{
        cursor: 'pointer',
        backgroundColor: color,
        width: width,
        height: height,
        border: border,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </span>
  )
}
