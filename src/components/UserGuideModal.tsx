import React, { useState } from 'react';
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
import { useAppTheme } from '../hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';

interface UserGuideModalProps {
  visible: boolean;
  onClose: () => void;
}

interface GuideTopic {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  tag: string;
  description: string;
  tips: { title: string; desc: string; icon: string }[];
}

const TOPICS: GuideTopic[] = [
  {
    id: 'input',
    icon: 'lightning-bolt',
    iconColor: '#F59E0B',
    title: 'Ghi chép giao dịch siêu tốc',
    tag: 'Cơ bản • 3 giây',
    description:
      'Ghi lại mỗi khoản chi ngay khi phát sinh là thói quen cốt lõi để quản lý tài chính thành công.',
    tips: [
      {
        title: 'Phím tắt mệnh giá nhanh',
        desc: 'Sử dụng các nút +50K, +100K, +200K, +500K, +1M trên bàn phím để cộng tiền nhanh mà không cần bấm từng số 0.',
        icon: 'cash-fast',
      },
      {
        title: 'Chọn danh mục 1 chạm',
        desc: 'Chạm biểu tượng danh mục có sẵn. Danh mục được phân màu sắc rõ ràng giúp nhận biết loại chi tiêu trong tích tắc.',
        icon: 'shape',
      },
      {
        title: 'Ghi ngày linh hoạt',
        desc: 'Dễ dàng bấm nút "Hôm nay", "Hôm qua" hoặc chọn bất kỳ ngày nào trong quá khứ nếu bạn quên ghi chép.',
        icon: 'calendar-clock',
      },
    ],
  },
  {
    id: 'wallets',
    icon: 'wallet-outline',
    iconColor: '#4F46E5',
    title: 'Quản lý đa ví & Chuyển tiền',
    tag: 'Tài khoản & Dòng tiền',
    description:
      'Tách bạch tiền mặt, tài khoản ngân hàng và ví điện tử để nắm rõ chính xác mình đang có bao nhiêu tiền.',
    tips: [
      {
        title: 'Tạo ví theo tài khoản thực tế',
        desc: 'Ví dụ: Ví Tiền Mặt, Vietcombank, Techcombank, MoMo. Cập nhật số dư ban đầu sát với thực tế.',
        icon: 'bank',
      },
      {
        title: 'Chuyển tiền giữa các ví',
        desc: 'Khi rút ATM hoặc nạp tiền ví điện tử, dùng tính năng "Chuyển tiền" (nút ⇄). Tiền sẽ chuyển từ ví nguồn sang ví đích mà không bị tính nhầm là một khoản chi tiêu!',
        icon: 'swap-horizontal',
      },
      {
        title: 'Thanh phân bổ tài sản',
        desc: 'Thanh màu ở tab "Ví tiền" cho bạn thấy tỷ lệ phần trăm tiền đang nằm ở ngân hàng hay tiền mặt.',
        icon: 'chart-box-outline',
      },
    ],
  },
  {
    id: 'budget',
    icon: 'target',
    iconColor: '#10B981',
    title: 'Hạn mức ngân sách thông minh',
    tag: 'Kiểm soát chi tiêu',
    description:
      'Đặt trần chi tiêu cho từng nhóm để không bao giờ bị "cháy túi" vào cuối tháng.',
    tips: [
      {
        title: 'Đặt trần cho danh mục dễ chi quá tay',
        desc: 'Ưu tiên đặt hạn mức cho các khoản như "Ăn uống ngoài", "Mua sắm", "Giải trí".',
        icon: 'alert-decagram-outline',
      },
      {
        title: 'Hệ thống cảnh báo 3 cấp độ màu',
        desc: 'Xanh lá: Chi tiêu an toàn (<80%) • Vàng hổ phách: Sắp chạm trần (80%-99%) • Đỏ: Vượt ngân sách (≥100%).',
        icon: 'traffic-light',
      },
      {
        title: 'Quy tắc vàng 50 / 30 / 20',
        desc: '50% cho nhu cầu thiết yếu (nhà, ăn uống, điện nước) • 30% cho sở thích & giải trí • 20% cho tiết kiệm & đầu tư.',
        icon: 'scale-balance',
      },
    ],
  },
  {
    id: 'analytics',
    icon: 'chart-donut',
    iconColor: '#06B6D4',
    title: 'Báo cáo & Tiết kiệm ròng',
    tag: 'Đánh giá sức khỏe tài chính',
    description:
      'Hiểu rõ dòng tiền của bạn đang chảy đi đâu mỗi tuần, mỗi tháng và mỗi năm.',
    tips: [
      {
        title: 'Thẻ Tiết kiệm ròng (Net Savings)',
        desc: 'Lấy Tổng Thu trừ đi Tổng Chi. Nếu số dương màu xanh, bạn đang có thặng dư tài chính tốt. Nếu số âm màu đỏ, cần giảm bớt chi tiêu ngay.',
        icon: 'piggy-bank-outline',
      },
      {
        title: 'Biểu đồ Donut & Bảng xếp hạng',
        desc: 'Biểu đồ tròn trực quan chỉ ra danh mục ngốn nhiều tiền nhất của bạn trong kỳ.',
        icon: 'podium-gold',
      },
      {
        title: 'Bộ lọc thời gian',
        desc: 'Chuyển đổi nhanh giữa "Tuần này", "Tháng này" và "Năm nay" bằng thanh chuyển đổi ở đầu màn hình.',
        icon: 'calendar-range',
      },
    ],
  },
  {
    id: 'security',
    icon: 'shield-check-outline',
    iconColor: '#8B5CF6',
    title: 'Bảo mật & Sao lưu an toàn',
    tag: 'Riêng tư & Dữ liệu',
    description:
      'Dữ liệu tài chính là tài sản cá nhân nhạy cảm, được bảo vệ tuyệt đối theo chuẩn Offline-First.',
    tips: [
      {
        title: 'Bảo mật vân tay & Face ID',
        desc: 'Bật xác thực sinh trắc học trong phần Cài đặt. Ứng dụng sẽ tự động khóa ngay khi bạn thoát màn hình.',
        icon: 'fingerprint',
      },
      {
        title: 'Ẩn số dư khi ở nơi đông người',
        desc: 'Nhấn vào biểu tượng con mắt trên thẻ số dư để ẩn toàn bộ số tiền thành dạng •••••••• ₫.',
        icon: 'eye-off-outline',
      },
      {
        title: 'Sao lưu JSON & Xuất bảng tính Excel',
        desc: 'Bạn có thể xuất toàn bộ dữ liệu ra tệp JSON để chuyển sang điện thoại mới hoặc xuất Excel CSV để tự phân tích trên máy tính.',
        icon: 'cloud-upload-outline',
      },
    ],
  },
];

export default function UserGuideModal({ visible, onClose }: UserGuideModalProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(TOPICS[0].id);

  const selectedTopic = TOPICS.find((t) => t.id === activeTab) || TOPICS[0];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.guideIconBadge, { backgroundColor: theme.primary + '18' }]}>
                <MaterialCommunityIcons name="book-open-page-variant-outline" size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.textPrimary }]}>Cẩm nang sử dụng</Text>
                <Text style={[styles.subtitle, { color: theme.textTertiary }]}>
                  Mẹo và hướng dẫn tính năng quan trọng
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Horizontal Topic Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topicTabList}
            style={[styles.tabScrollView, { borderBottomColor: theme.border }]}
          >
            {TOPICS.map((topic) => {
              const isSelected = topic.id === activeTab;
              return (
                <TouchableOpacity
                  key={topic.id}
                  style={[
                    styles.topicTab,
                    {
                      backgroundColor: isSelected ? topic.iconColor + '18' : theme.surfaceVariant,
                      borderColor: isSelected ? topic.iconColor : 'transparent',
                    },
                  ]}
                  onPress={() => setActiveTab(topic.id)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={topic.icon as any}
                    size={16}
                    color={isSelected ? topic.iconColor : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.topicTabText,
                      {
                        color: isSelected ? topic.iconColor : theme.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {topic.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Topic Detail Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: Math.max(insets.bottom, 24) + SPACING.lg },
            ]}
          >
            {/* Banner Overview */}
            <View
              style={[
                styles.banner,
                { backgroundColor: selectedTopic.iconColor + '12', borderColor: selectedTopic.iconColor + '30' },
              ]}
            >
              <View style={[styles.bannerIconCircle, { backgroundColor: selectedTopic.iconColor }]}>
                <MaterialCommunityIcons name={selectedTopic.icon as any} size={28} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.tagWrapper}>
                  <Text style={[styles.bannerTag, { color: selectedTopic.iconColor }]}>
                    {selectedTopic.tag}
                  </Text>
                </View>
                <Text style={[styles.bannerTitle, { color: theme.textPrimary }]}>
                  {selectedTopic.title}
                </Text>
                <Text style={[styles.bannerDesc, { color: theme.textSecondary }]}>
                  {selectedTopic.description}
                </Text>
              </View>
            </View>

            {/* Tips & Instructions List */}
            <Text style={[styles.tipsHeader, { color: theme.textSecondary }]}>
              HƯỚNG DẪN & MẸO CẦN CHÚ Ý
            </Text>

            <View style={styles.tipsList}>
              {selectedTopic.tips.map((tip, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.tipCard,
                    { backgroundColor: theme.surfaceVariant, borderColor: theme.border },
                  ]}
                >
                  <View style={[styles.tipIconWrap, { backgroundColor: selectedTopic.iconColor + '20' }]}>
                    <MaterialCommunityIcons
                      name={tip.icon as any}
                      size={20}
                      color={selectedTopic.iconColor}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[styles.tipTitle, { color: theme.textPrimary }]}>
                      {tip.title}
                    </Text>
                    <Text style={[styles.tipDesc, { color: theme.textSecondary }]}>
                      {tip.desc}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Close / Action Button */}
            <TouchableOpacity
              style={[styles.gotItBtn, { backgroundColor: theme.primary }]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="check" size={18} color="#FFF" />
              <Text style={styles.gotItText}>Đã hiểu & Tiếp tục</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    maxHeight: '92%',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm + 2,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guideIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  tabScrollView: {
    borderBottomWidth: 1,
    flexGrow: 0,
  },
  topicTabList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 8,
  },
  topicTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
  },
  topicTabText: {
    fontSize: 12,
  },
  content: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  banner: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  bannerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagWrapper: {
    marginBottom: 2,
  },
  bannerTag: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  tipsHeader: {
    ...TYPOGRAPHY.label,
    letterSpacing: 0.8,
    marginTop: SPACING.xs,
  },
  tipsList: {
    gap: SPACING.sm + 2,
  },
  tipCard: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  tipIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.xs + 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  tipDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  gotItBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.sm,
  },
  gotItText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
