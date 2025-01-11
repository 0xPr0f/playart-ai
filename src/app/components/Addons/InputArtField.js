import React from 'react'
import { RoundButtonInputArt } from '../RoundButton/RoundButtonTools'
import styles from './styles/InputArtField.module.scss'

const InputArtField = ({
  placeholder,
  icon,
  value,
  onChange,
  defaultValue,
  width,
  height,
}) => {
  return (
    <form className={styles.formArt}>
      <input
        spellCheck={false}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        defaultValue={defaultValue}
        className={styles.textInputArt}
        style={{ width: width, height: height }}
      />
      <RoundButtonInputArt
        onClick={(e) => {
          e.preventDefault()
        }}
        width="40px"
        height="40px"
      >
        {icon}
      </RoundButtonInputArt>
    </form>
  )
}

export default InputArtField

export const TextareaArtField = ({
  placeholder,
  icon,
  value,
  onChange,
  defaultValue,
  width,
  height,
  maxHeight,
  minHeight,
  minWidth,
  maxWidth,
}) => {
  return (
    <form className={styles.formAreaArt}>
      <textarea
        spellCheck={false}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        defaultValue={defaultValue}
        className={styles.textareaInputArt}
        style={{
          paddingLeft: '1em',
          paddingRight: '1em',
          width: width,
          height: height,
          minHeight: minHeight,
          maxHeight: maxHeight,
          minWidth: minWidth,
          maxWidth: maxWidth,
        }}
      />
      <RoundButtonInputArt
        onClick={(e) => {
          e.preventDefault()
        }}
        width="40px"
        height="40px"
      >
        {icon}
      </RoundButtonInputArt>
    </form>
  )
}
