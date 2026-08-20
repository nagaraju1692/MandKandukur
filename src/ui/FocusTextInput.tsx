import React, { useState } from 'react'
import { StyleSheet, TextInput, TextInputProps } from 'react-native'

export default function FocusTextInput({ onBlur, onFocus, style, ...props }: TextInputProps) {
  const [focused, setFocused] = useState(false)

  return (
    <TextInput
      {...props}
      style={[style, focused && styles.focused]}
      onFocus={(event) => {
        setFocused(true)
        onFocus?.(event)
      }}
      onBlur={(event) => {
        setFocused(false)
        onBlur?.(event)
      }}
    />
  )
}

const styles = StyleSheet.create({
  focused: {
    borderColor: '#514BD5',
    borderWidth: 2,
  },
})