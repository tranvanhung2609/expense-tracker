import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';
import { BackupData, restoreDatabaseFromJSONString } from '../utils/backup';

interface RestoreModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RestoreModal({ visible, onClose, onSuccess }: RestoreModalProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const [jsonInput, setJsonInput] = useState('');
  const [parsedData, setParsedData] = useState<BackupData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePickDocument = async () => {
    try {
      // Dynamic import expo-document-picker if available
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileAsset = result.assets[0];
        const FileSystem = await import('expo-file-system');
        const content = await FileSystem.readAsStringAsync(fileAsset.uri);
        handleValidateJson(content);
      }
    } catch (err: any) {
      Alert.alert(
        'Thông báo',
        'Vui lòng dán trực tiếp nội dung file sao lưu JSON vào khung bên dưới để khôi phục nhanh chóng.'
      );
    }
  };

  const handleValidateJson = (raw: string) => {
    setJsonInput(raw);
    setErrorMessage(null);

    const trimmed = raw.trim();
    if (!trimmed) {
      setParsedData(null);
      return;
    }

    try {
      const data: BackupData = JSON.parse(trimmed);
      if (!data.data || !Array.isArray(data.data.wallets) || !Array.isArray(data.data.transactions)) {
        setErrorMessage('Tệp không đúng định dạng sao lưu của Expense Tracker.');
        setParsedData(null);
        return;
      }
      setParsedData(data);
    } catch (e: any) {
      setErrorMessage('Nội dung không phải là chuỗi JSON hợp lệ.');
      setParsedData(null);
    }
  };

  const handleConfirmRestore = () => {
    if (!parsedData) return;

    Alert.alert(
      '⚠️ Xác nhận khôi phục',
      'Toàn bộ dữ liệu chi tiêu hiện tại trên máy sẽ bị thay thế bởi dữ liệu từ bản sao lưu này. Bạn có chắc chắn muốn tiếp tục?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Khôi phục ngay',
          style: 'destructive',
          onPress: () => {
            setIsProcessing(true);
            setTimeout(() => {
              const res = restoreDatabaseFromJSONString(jsonInput);
              setIsProcessing(false);

              if (res.success) {
                Alert.alert('✅ Thành công', 'Toàn bộ dữ liệu đã được khôi phục nguyên vẹn!');
                setJsonInput('');
                setParsedData(null);
                onSuccess();
                onClose();
              } else {
                Alert.alert('Lỗi', res.error || 'Không thể khôi phục dữ liệu.');
              }
            }, 300);
          },
        },
      ]
    );
  };

  const handleClose = () => {
    setJsonInput('');
    setParsedData(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />

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
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
              <MaterialCommunityIcons name="cloud-download-outline" size={24} color={theme.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Khôi phục dữ liệu
              </Text>
              <Text style={[styles.subtitle, { color: theme.textTertiary }]}>
                Nạp lại dữ liệu từ tệp sao lưu JSON
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Pick File Button */}
            <TouchableOpacity
              style={[styles.pickBtn, { borderColor: theme.primary, backgroundColor: theme.primary + '10' }]}
              onPress={handlePickDocument}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="file-document-outline" size={22} color={theme.primary} />
              <Text style={[styles.pickBtnText, { color: theme.primary }]}>
                Chọn tệp sao lưu (.json) từ máy
              </Text>
            </TouchableOpacity>

            <View style={styles.orRow}>
              <View style={[styles.orLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.orText, { color: theme.textTertiary }]}>HOẶC DÁN NỘI DUNG</Text>
              <View style={[styles.orLine, { backgroundColor: theme.border }]} />
            </View>

            {/* Input JSON area */}
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.surfaceVariant,
                  color: theme.textPrimary,
                  borderColor: errorMessage ? theme.expense : theme.border,
                },
              ]}
              multiline
              numberOfLines={4}
              placeholder="Dán chuỗi JSON đã sao lưu vào đây..."
              placeholderTextColor={theme.textTertiary}
              value={jsonInput}
              onChangeText={handleValidateJson}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {errorMessage && (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={theme.expense} />
                <Text style={[styles.errorText, { color: theme.expense }]}>{errorMessage}</Text>
              </View>
            )}

            {/* Preview Backup Data */}
            {parsedData && (
              <View style={[styles.previewCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
                <View style={styles.previewHeader}>
                  <MaterialCommunityIcons name="check-decagram" size={18} color={theme.income} />
                  <Text style={[styles.previewTitle, { color: theme.income }]}>
                    Bản sao lưu hợp lệ
                  </Text>
                </View>

                {parsedData.exportedAt && (
                  <Text style={[styles.previewDate, { color: theme.textTertiary }]}>
                    Ngày sao lưu: {new Date(parsedData.exportedAt).toLocaleString('vi-VN')}
                  </Text>
                )}

                <View style={styles.statGrid}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statVal, { color: theme.textPrimary }]}>
                      {parsedData.data.wallets?.length ?? 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Ví tiền</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statVal, { color: theme.textPrimary }]}>
                      {parsedData.data.categories?.length ?? 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Danh mục</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statVal, { color: theme.textPrimary }]}>
                      {parsedData.data.transactions?.length ?? 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Giao dịch</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statVal, { color: theme.textPrimary }]}>
                      {parsedData.data.budgets?.length ?? 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Hạn mức</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={[styles.cancelBtnText, { color: theme.textTertiary }]}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.restoreBtn,
                {
                  backgroundColor: parsedData ? theme.primary : theme.border,
                  opacity: parsedData ? 1 : 0.6,
                },
              ]}
              disabled={!parsedData || isProcessing}
              onPress={handleConfirmRestore}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="backup-restore" size={18} color="#FFF" />
                  <Text style={styles.restoreBtnText}>Khôi phục ngay</Text>
                </>
              )}
            </TouchableOpacity>
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
    maxWidth: 400,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    maxHeight: '85%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.h3,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    maxHeight: 380,
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: SPACING.sm,
  },
  pickBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginVertical: SPACING.xs,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textArea: {
    height: 90,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.sm,
    textAlignVertical: 'top',
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: SPACING.xs,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
  },
  previewCard: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewTitle: {
    fontWeight: '700',
    fontSize: 13,
  },
  previewDate: {
    ...TYPOGRAPHY.caption,
    marginTop: 4,
    marginBottom: SPACING.sm,
  },
  statGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  statItem: {
    alignItems: 'center',
  },
  statVal: {
    fontWeight: '700',
    fontSize: 16,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  cancelBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  cancelBtnText: {
    fontWeight: '600',
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  restoreBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
