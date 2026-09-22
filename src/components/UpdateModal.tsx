import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReleaseInfo, openDownloadUrl, getAppCurrentVersion } from '../services/updateService';
import { useAppTheme } from '../hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';

interface UpdateModalProps {
  visible: boolean;
  release: ReleaseInfo | null;
  onClose: () => void;
}

export default function UpdateModal({ visible, release, onClose }: UpdateModalProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const currentVersion = getAppCurrentVersion();

  if (!release) return null;

  const handleUpdatePress = async () => {
    const opened = await openDownloadUrl(release.downloadUrl);
    if (opened && !release.mandatory) {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={() => (!release.mandatory ? onClose() : null)}
          activeOpacity={1}
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              paddingBottom: Math.max(insets.bottom, SPACING.lg),
            },
          ]}
        >
          {/* Header Visual */}
          <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
            <MaterialCommunityIcons name="rocket-launch" size={38} color={theme.primary} />
          </View>

          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Có bản cập nhật mới!
          </Text>

          {/* Version badge */}
          <View style={styles.versionRow}>
            <View style={[styles.badgeOld, { backgroundColor: theme.surfaceVariant }]}>
              <Text style={[styles.badgeTextOld, { color: theme.textTertiary }]}>
                v{currentVersion}
              </Text>
            </View>
            <MaterialCommunityIcons name="arrow-right" size={16} color={theme.textTertiary} />
            <View style={[styles.badgeNew, { backgroundColor: theme.primary }]}>
              <Text style={styles.badgeTextNew}>v{release.version}</Text>
            </View>
          </View>

          {release.releaseDate ? (
            <Text style={[styles.releaseDate, { color: theme.textTertiary }]}>
              Phát hành: {release.releaseDate}
            </Text>
          ) : null}

          {/* Changelog */}
          <View style={[styles.changelogBox, { backgroundColor: theme.surfaceVariant }]}>
            <Text style={[styles.changelogTitle, { color: theme.textPrimary }]}>
              {release.title || 'Điểm mới trong phiên bản này:'}
            </Text>
            <ScrollView style={styles.changelogScroll} showsVerticalScrollIndicator={false}>
              {release.changelog.map((item, idx) => (
                <View key={idx} style={styles.changelogItem}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={theme.primary} />
                  <Text style={[styles.changelogText, { color: theme.textSecondary }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Buttons */}
          <View style={styles.buttonCol}>
            <TouchableOpacity
              style={[styles.updateBtn, { backgroundColor: theme.primary }]}
              onPress={handleUpdatePress}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="download" size={20} color="#FFF" />
              <Text style={styles.updateBtnText}>Tải & Cập nhật ngay</Text>
            </TouchableOpacity>

            {!release.mandatory && (
              <TouchableOpacity style={styles.laterBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={[styles.laterBtnText, { color: theme.textTertiary }]}>
                  Để sau
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h2,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  badgeOld: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeTextOld: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeNew: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeTextNew: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  releaseDate: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.md,
  },
  changelogBox: {
    width: '100%',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  changelogTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  changelogScroll: {
    maxHeight: 140,
  },
  changelogItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: 6,
  },
  changelogText: {
    ...TYPOGRAPHY.bodySmall,
    flex: 1,
    lineHeight: 18,
  },
  buttonCol: {
    width: '100%',
    gap: SPACING.sm,
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  updateBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  laterBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  laterBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
