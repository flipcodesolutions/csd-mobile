import React, { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Bike, Car, Edit3, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { getImageUrl } from '../../../core/api/client';
import { Brand } from '../types';

interface BrandCardProps {
  item: Brand;
  index: number;
  onEdit: (item: Brand) => void;
  onDelete: (item: Brand) => void;
}

export const BrandCard: React.FC<BrandCardProps> = ({
  item,
  index,
  onEdit,
  onDelete,
}) => {
  const { colors, isDark } = useTheme();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [item.logo]);

  const initial = item.name ? item.name.trim().charAt(0).toUpperCase() : 'B';
  const hasFourWheeler = item.vehicle_type?.includes('4 Wheeler');
  const hasTwoWheeler = item.vehicle_type?.includes('2 Wheeler');
  const isActive = item.status === 'Active';

  const logoUri = getImageUrl(item.logo);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#101726' : '#FFFFFF',
          borderColor: isDark ? '#1E293B' : '#E2E8F0',
        },
      ]}
    >
      <View style={styles.cardInner}>
        {/* Brand Logo Avatar */}
        <View
          style={[
            styles.avatarBox,
            {
              backgroundColor: isDark ? '#162030' : '#F8FAFC',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
        >
          {logoUri && !imageError ? (
            <Image
              source={{ uri: logoUri }}
              style={styles.logoImage}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <Text
              style={[
                styles.avatarInitial,
                { color: colors.primaryDark },
              ]}
            >
              {initial}
            </Text>
          )}
        </View>

        {/* Brand Info */}
        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.brandName,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>
            {/* Minimal Status Dot */}
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isActive ? '#16A34A' : '#94A3B8' },
              ]}
            />
          </View>

          {/* Vehicle Types Tags & Status */}
          <View style={styles.metaRow}>
            {hasFourWheeler && (
              <View
                style={[
                  styles.typePill,
                  {
                    backgroundColor: isDark
                      ? 'rgba(59, 130, 246, 0.12)'
                      : '#EFF6FF',
                    borderColor: isDark ? '#1D4ED8' : '#BFDBFE',
                  },
                ]}
              >
                <Car size={9} color="#2563EB" strokeWidth={2.4} />
                <Text style={[styles.typeText, { color: '#1D4ED8' }]}>
                  4 Wheeler
                </Text>
              </View>
            )}

            {hasTwoWheeler && (
              <View
                style={[
                  styles.typePill,
                  {
                    backgroundColor: isDark
                      ? 'rgba(238, 104, 0, 0.12)'
                      : '#FFF7ED',
                    borderColor: isDark ? '#C2410C' : '#FFEDD5',
                  },
                ]}
              >
                <Bike size={9} color="#EA580C" strokeWidth={2.4} />
                <Text style={[styles.typeText, { color: '#C2410C' }]}>
                  2 Wheeler
                </Text>
              </View>
            )}

            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: isActive
                    ? 'rgba(22, 163, 74, 0.08)'
                    : 'rgba(148, 163, 184, 0.12)',
                  borderColor: isActive
                    ? 'rgba(22, 163, 74, 0.3)'
                    : 'rgba(148, 163, 184, 0.3)',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusSubText,
                  { color: isActive ? '#16A34A' : '#94A3B8' },
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Inline Action Buttons */}
        <View style={styles.actionBtns}>
          <TouchableOpacity
            style={[
              styles.iconBtn,
              {
                backgroundColor: isDark ? '#162030' : '#F1F5F9',
                borderColor: isDark ? '#1E293B' : '#CBD5E1',
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic('selection');
              onEdit(item);
            }}
          >
            <Edit3 size={13} color={colors.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(239, 68, 68, 0.12)'
                  : '#FEF2F2',
                borderColor: isDark ? '#991B1B' : '#FCA5A5',
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic('impactLight');
              onDelete(item);
            }}
          >
            <Trash2 size={13} color="#DC2626" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '800',
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    fontSize: 13.5,
    fontWeight: '700',
    flexShrink: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.8,
    gap: 3,
  },
  typeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 0.8,
  },
  statusSubText: {
    fontSize: 9,
    fontWeight: '600',
  },
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
