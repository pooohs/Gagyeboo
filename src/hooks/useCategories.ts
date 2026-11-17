import { useState, useEffect, useCallback } from 'react';
import { CategoryLookup, TransactionType } from '../types/transaction';
import {
  loadCategoriesFromStorage,
  saveCategoriesToStorage,
} from '../utils/storage';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '../constants/defaultCategories';

export function useCategories() {
  const [expenseCategories, setExpenseCategories] = useState<CategoryLookup>(() => {
    return loadCategoriesFromStorage().expenseCategories;
  });

  const [incomeCategories, setIncomeCategories] = useState<CategoryLookup>(() => {
    return loadCategoriesFromStorage().incomeCategories;
  });

  // 변경 시 storage 저장
  useEffect(() => {
    saveCategoriesToStorage(expenseCategories, incomeCategories);
  }, [expenseCategories, incomeCategories]);

  const getCategoriesByType = useCallback(
    (type: TransactionType): CategoryLookup => {
      return type === 'income' ? incomeCategories : expenseCategories;
    },
    [expenseCategories, incomeCategories]
  );

  const addSubCategory = useCallback(
    (type: TransactionType, mainCategory: string, newSubCategory: string) => {
      const trimmed = newSubCategory.trim();
      if (!trimmed) return false;

      if (type === 'expense') {
        if (!expenseCategories[mainCategory]) return false;
        if (expenseCategories[mainCategory].subCategories.includes(trimmed)) return false;

        setExpenseCategories((prev) => ({
          ...prev,
          [mainCategory]: {
            ...prev[mainCategory],
            subCategories: [...prev[mainCategory].subCategories, trimmed],
          },
        }));
        return true;
      } else {
        if (!incomeCategories[mainCategory]) return false;
        if (incomeCategories[mainCategory].subCategories.includes(trimmed)) return false;

        setIncomeCategories((prev) => ({
          ...prev,
          [mainCategory]: {
            ...prev[mainCategory],
            subCategories: [...prev[mainCategory].subCategories, trimmed],
          },
        }));
        return true;
      }
    },
    [expenseCategories, incomeCategories]
  );

  const deleteSubCategory = useCallback(
    (type: TransactionType, mainCategory: string, subCategory: string) => {
      const setter = type === 'income' ? setIncomeCategories : setExpenseCategories;
      setter((prev) => {
        if (!prev[mainCategory]) return prev;
        return {
          ...prev,
          [mainCategory]: {
            ...prev[mainCategory],
            subCategories: prev[mainCategory].subCategories.filter(
              (s) => s !== subCategory
            ),
          },
        };
      });
    },
    []
  );

  const resetToDefaults = useCallback(() => {
    setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
    setIncomeCategories(DEFAULT_INCOME_CATEGORIES);
    saveCategoriesToStorage(DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES);
  }, []);

  return {
    expenseCategories,
    incomeCategories,
    getCategoriesByType,
    addSubCategory,
    deleteSubCategory,
    resetToDefaults,
  };
}
