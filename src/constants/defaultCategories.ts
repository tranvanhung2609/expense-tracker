import { COLORS } from './theme';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'EXPENSE' | 'INCOME' | 'BOTH';
  isDefault: number; // 1 = true, 0 = false
}

export const DEFAULT_CATEGORIES: Category[] = [
  // EXPENSE categories
  { id: 'cat_food', name: 'Ăn uống', icon: 'food', color: '#FF6B6B', type: 'EXPENSE', isDefault: 1 },
  { id: 'cat_transport', name: 'Đi lại', icon: 'car', color: '#FFA940', type: 'EXPENSE', isDefault: 1 },
  { id: 'cat_shopping', name: 'Mua sắm', icon: 'shopping', color: '#C471ED', type: 'EXPENSE', isDefault: 1 },
  { id: 'cat_housing', name: 'Nhà ở', icon: 'home', color: '#56CCF2', type: 'EXPENSE', isDefault: 1 },
  { id: 'cat_health', name: 'Sức khỏe', icon: 'heart-pulse', color: '#FF5C7C', type: 'EXPENSE', isDefault: 1 },
  { id: 'cat_education', name: 'Học tập', icon: 'school', color: '#43E97B', type: 'EXPENSE', isDefault: 1 },
  { id: 'cat_entertainment', name: 'Giải trí', icon: 'gamepad-variant', color: '#6C63FF', type: 'EXPENSE', isDefault: 1 },
  { id: 'cat_bills', name: 'Hóa đơn', icon: 'receipt', color: '#FA8231', type: 'EXPENSE', isDefault: 1 },
  { id: 'cat_coffee', name: 'Cà phê', icon: 'coffee', color: '#795548', type: 'EXPENSE', isDefault: 1 },
  { id: 'cat_clothing', name: 'Quần áo', icon: 'tshirt-crew', color: '#EC407A', type: 'EXPENSE', isDefault: 1 },
  { id: 'cat_travel', name: 'Du lịch', icon: 'airplane', color: '#26C6DA', type: 'EXPENSE', isDefault: 1 },
  { id: 'cat_pets', name: 'Thú cưng', icon: 'paw', color: '#A8E063', type: 'EXPENSE', isDefault: 1 },
  { id: 'cat_beauty', name: 'Làm đẹp', icon: 'lipstick', color: '#F06292', type: 'EXPENSE', isDefault: 1 },
  { id: 'cat_gym', name: 'Gym / Thể thao', icon: 'dumbbell', color: '#FF8E53', type: 'EXPENSE', isDefault: 1 },
  { id: 'cat_tech', name: 'Công nghệ', icon: 'laptop', color: '#42A5F5', type: 'EXPENSE', isDefault: 1 },
  { id: 'cat_gift', name: 'Quà tặng', icon: 'gift', color: '#EF5350', type: 'EXPENSE', isDefault: 1 },
  { id: 'cat_other_expense', name: 'Khác', icon: 'dots-horizontal-circle', color: '#9CA3AF', type: 'EXPENSE', isDefault: 1 },
  // INCOME categories
  { id: 'cat_salary', name: 'Lương', icon: 'briefcase', color: '#00C896', type: 'INCOME', isDefault: 1 },
  { id: 'cat_freelance', name: 'Freelance', icon: 'laptop-account', color: '#26A69A', type: 'INCOME', isDefault: 1 },
  { id: 'cat_investment', name: 'Đầu tư', icon: 'chart-line', color: '#66BB6A', type: 'INCOME', isDefault: 1 },
  { id: 'cat_bonus', name: 'Thưởng', icon: 'star-circle', color: '#FFD700', type: 'INCOME', isDefault: 1 },
  { id: 'cat_other_income', name: 'Thu nhập khác', icon: 'cash-plus', color: '#43A047', type: 'INCOME', isDefault: 1 },
];

export const DEFAULT_WALLET = {
  id: 'wallet_cash',
  name: 'Tiền mặt',
  icon: 'wallet',
  color: COLORS.primary,
  initialBalance: 0,
};
