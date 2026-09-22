import { create } from 'zustand';
import { CategoryRepository, Category } from '../repositories/CategoryRepository';
import { CATEGORY_TYPES, CategoryType } from '../constants/enums';

interface CategoryState {
  categories: Category[];
  expenseCategories: Category[];
  incomeCategories: Category[];

  load: () => void;
  add: (input: { name: string; icon: string; color: string; type: CategoryType }) => Category;
  update: (id: string, input: Partial<{ name: string; icon: string; color: string; type: CategoryType }>) => Category;
  remove: (id: string) => void;
}

const repo = new CategoryRepository();

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  expenseCategories: [],
  incomeCategories: [],

  load: () => {
    try {
      const categories = repo.getAll();
      const expenseCategories = repo.getByType(CATEGORY_TYPES.EXPENSE);
      const incomeCategories = repo.getByType(CATEGORY_TYPES.INCOME);
      set({ categories, expenseCategories, incomeCategories });
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  },

  add: (input) => {
    try {
      const cat = repo.create(input);
      get().load();
      return cat;
    } catch (err) {
      console.error('Failed to create category:', err);
      throw err;
    }
  },

  update: (id, input) => {
    try {
      const cat = repo.update(id, input);
      get().load();
      return cat;
    } catch (err) {
      console.error('Failed to update category:', err);
      throw err;
    }
  },

  remove: (id) => {
    try {
      repo.delete(id);
      set(state => ({
        categories: state.categories.filter(c => c.id !== id),
        expenseCategories: state.expenseCategories.filter(c => c.id !== id),
        incomeCategories: state.incomeCategories.filter(c => c.id !== id),
      }));
    } catch (err) {
      console.error('Failed to delete category:', err);
      throw err;
    }
  },
}));
