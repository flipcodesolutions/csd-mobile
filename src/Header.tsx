import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from './colors';

interface HeaderProps {
  title: string;
  onOpenDrawer: () => void;
  onAddNew?: () => void;
  addLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onOpenDrawer,
  onAddNew,
  addLabel = '+ Add New',
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.leftRow}>
        {/* Hamburger Menu Button */}
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={onOpenDrawer}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {/* Optional Top Right Add Action Button */}
      {onAddNew && (
        <TouchableOpacity
          style={styles.addBtn}
          onPress={onAddNew}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>{addLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 56,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 20,
    color: colors.textWhite,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.textWhite,
    flex: 1,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryHover,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addBtnText: {
    color: colors.textWhite,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
