import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export interface StartAlignedInputProps extends React.ComponentProps<typeof TextInput> {
  containerStyle?: any;
}

export const StartAlignedInput: React.FC<StartAlignedInputProps> = ({
  style,
  value,
  placeholder,
  placeholderTextColor,
  onFocus,
  onBlur,
  editable = true,
  multiline,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (isFocused) {
      // Ensure focus is requested immediately after component switch
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isFocused]);

  // If multiline, standard TextInput handles wrapping naturally
  if (multiline) {
    return (
      <TextInput
        {...props}
        multiline
        value={value}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        editable={editable}
        onFocus={onFocus}
        onBlur={onBlur}
        style={style}
      />
    );
  }

  const flatStyle = StyleSheet.flatten(style) || {};
  const {
    backgroundColor = 'transparent',
    borderColor = 'transparent',
    borderWidth = 0,
    borderRadius = 6,
    borderTopLeftRadius,
    borderTopRightRadius,
    borderBottomLeftRadius,
    borderBottomRightRadius,
    borderLeftWidth,
    borderRightWidth,
    borderTopWidth,
    borderBottomWidth,
    paddingHorizontal = 10,
    height = 38,
    color = '#1F2933',
    fontSize = 13,
    fontWeight = '600',
    flex,
    width,
    ...restStyle
  } = flatStyle;

  if (!isFocused && editable !== false) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsFocused(true)}
        style={[
          {
            height,
            backgroundColor,
            borderColor,
            borderWidth,
            borderRadius,
            borderTopLeftRadius,
            borderTopRightRadius,
            borderBottomLeftRadius,
            borderBottomRightRadius,
            borderLeftWidth,
            borderRightWidth,
            borderTopWidth,
            borderBottomWidth,
            paddingHorizontal,
            justifyContent: 'center',
            flex,
            width,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            color: value ? color : placeholderTextColor || '#94A3B8',
            fontSize,
            fontWeight,
            includeFontPadding: false,
            textAlign: 'left',
          }}
        >
          {value || placeholder || ''}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TextInput
      ref={inputRef}
      {...props}
      value={value}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      editable={editable}
      onFocus={(e) => {
        setIsFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        onBlur?.(e);
      }}
      style={[
        style,
        {
          textAlign: 'left',
          textAlignVertical: 'center',
          includeFontPadding: false,
        },
      ]}
    />
  );
};
