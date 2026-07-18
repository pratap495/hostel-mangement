import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FoodMenuEntry } from '../../types';

interface FoodMenuState {
  entries: FoodMenuEntry[];
  loading: boolean;
  error: string | null;
}

const mockFoodMenu: FoodMenuEntry[] = [
  // Mock data for Green View Hostel (hostel-1) - 19 May to 25 May 2025
  { id: 'fm-1', hostelId: 'hostel-1', date: '2025-05-19', mealType: 'breakfast', menuItems: 'Idli, Sambar, Chutney, Tea' },
  { id: 'fm-2', hostelId: 'hostel-1', date: '2025-05-20', mealType: 'breakfast', menuItems: 'Poha, Banana, Tea' },
  { id: 'fm-3', hostelId: 'hostel-1', date: '2025-05-21', mealType: 'breakfast', menuItems: 'Poori, Chana Masala, Tea' },
  { id: 'fm-4', hostelId: 'hostel-1', date: '2025-05-22', mealType: 'breakfast', menuItems: 'Upma, Coconut Chutney, Tea' },
  { id: 'fm-5', hostelId: 'hostel-1', date: '2025-05-23', mealType: 'breakfast', menuItems: 'Paratha, Curd, Pickle' },
  { id: 'fm-6', hostelId: 'hostel-1', date: '2025-05-24', mealType: 'breakfast', menuItems: 'Dosa, Sambar, Chutney' },
  { id: 'fm-7', hostelId: 'hostel-1', date: '2025-05-25', mealType: 'breakfast', menuItems: 'Pongal, Sambar, Chutney' },

  { id: 'fm-8', hostelId: 'hostel-1', date: '2025-05-19', mealType: 'lunch', menuItems: 'Rice, Pappu, Veg Fry, Curd' },
  { id: 'fm-9', hostelId: 'hostel-1', date: '2025-05-20', mealType: 'lunch', menuItems: 'Veg Biryani, Raita, Gulab Jamun' },
  { id: 'fm-10', hostelId: 'hostel-1', date: '2025-05-21', mealType: 'lunch', menuItems: 'Rice, Sambar, Potato Fry, Papad' },
  { id: 'fm-11', hostelId: 'hostel-1', date: '2025-05-22', mealType: 'lunch', menuItems: 'Roti, Paneer Butter Masala, Rice, Dal' },
  { id: 'fm-12', hostelId: 'hostel-1', date: '2025-05-23', mealType: 'lunch', menuItems: 'Rice, Rasam, Cabbage Fry, Curd' },
  { id: 'fm-13', hostelId: 'hostel-1', date: '2025-05-24', mealType: 'lunch', menuItems: 'Roti, Dal Tadka, Jeera Rice' },
  { id: 'fm-14', hostelId: 'hostel-1', date: '2025-05-25', mealType: 'lunch', menuItems: 'Special Meals, Sweet, Ice Cream' },

  { id: 'fm-15', hostelId: 'hostel-1', date: '2025-05-19', mealType: 'dinner', menuItems: 'Roti, Mixed Veg Curry, Khichdi' },
  { id: 'fm-16', hostelId: 'hostel-1', date: '2025-05-20', mealType: 'dinner', menuItems: 'Roti, Dal Fry, Rice' },
  { id: 'fm-17', hostelId: 'hostel-1', date: '2025-05-21', mealType: 'dinner', menuItems: 'Egg Masala, Chapati, Rice' },
  { id: 'fm-18', hostelId: 'hostel-1', date: '2025-05-22', mealType: 'dinner', menuItems: 'Roti, Aloo Gobi, Rice, Dal' },
  { id: 'fm-19', hostelId: 'hostel-1', date: '2025-05-23', mealType: 'dinner', menuItems: 'Roti, Bhindi Masala, Rice, Rasam' },
  { id: 'fm-20', hostelId: 'hostel-1', date: '2025-05-24', mealType: 'dinner', menuItems: 'Fried Rice, Manchurian, Soup' },
  { id: 'fm-21', hostelId: 'hostel-1', date: '2025-05-25', mealType: 'dinner', menuItems: 'Roti, Kadai Paneer, Rice, Dal' },

  // Mock data for Comfort Living (hostel-2) - 19 May to 25 May 2025
  { id: 'fm-2-1', hostelId: 'hostel-2', date: '2025-05-19', mealType: 'breakfast', menuItems: 'Idli, Sambar, Chutney, Tea' },
  { id: 'fm-2-2', hostelId: 'hostel-2', date: '2025-05-20', mealType: 'breakfast', menuItems: 'Poha, Banana, Tea' },
  { id: 'fm-2-3', hostelId: 'hostel-2', date: '2025-05-21', mealType: 'breakfast', menuItems: 'Poori, Chana Masala, Tea' },
  { id: 'fm-2-4', hostelId: 'hostel-2', date: '2025-05-22', mealType: 'breakfast', menuItems: 'Upma, Coconut Chutney, Tea' },
  { id: 'fm-2-5', hostelId: 'hostel-2', date: '2025-05-23', mealType: 'breakfast', menuItems: 'Paratha, Curd, Pickle' },
  { id: 'fm-2-6', hostelId: 'hostel-2', date: '2025-05-24', mealType: 'breakfast', menuItems: 'Dosa, Sambar, Chutney' },
  { id: 'fm-2-7', hostelId: 'hostel-2', date: '2025-05-25', mealType: 'breakfast', menuItems: 'Pongal, Sambar, Chutney' },

  // Mock data for Green View Hostel (hostel-1) - Current Week (13 July to 19 July 2026)
  { id: 'fm-c1', hostelId: 'hostel-1', date: '2026-07-13', mealType: 'breakfast', menuItems: 'Idli, Sambar, Chutney, Tea' },
  { id: 'fm-c2', hostelId: 'hostel-1', date: '2026-07-14', mealType: 'breakfast', menuItems: 'Poha, Banana, Tea' },
  { id: 'fm-c3', hostelId: 'hostel-1', date: '2026-07-15', mealType: 'breakfast', menuItems: 'Poori, Chana Masala, Tea' },
  { id: 'fm-c4', hostelId: 'hostel-1', date: '2026-07-16', mealType: 'breakfast', menuItems: 'Upma, Coconut Chutney, Tea' },
  { id: 'fm-c5', hostelId: 'hostel-1', date: '2026-07-17', mealType: 'breakfast', menuItems: 'Paratha, Curd, Pickle' },
  { id: 'fm-c6', hostelId: 'hostel-1', date: '2026-07-18', mealType: 'breakfast', menuItems: 'Dosa, Sambar, Chutney' },
  { id: 'fm-c7', hostelId: 'hostel-1', date: '2026-07-19', mealType: 'breakfast', menuItems: 'Pongal, Sambar, Chutney' },

  { id: 'fm-c8', hostelId: 'hostel-1', date: '2026-07-13', mealType: 'lunch', menuItems: 'Rice, Pappu, Veg Fry, Curd' },
  { id: 'fm-c9', hostelId: 'hostel-1', date: '2026-07-14', mealType: 'lunch', menuItems: 'Veg Biryani, Raita, Gulab Jamun' },
  { id: 'fm-c10', hostelId: 'hostel-1', date: '2026-07-15', mealType: 'lunch', menuItems: 'Rice, Sambar, Potato Fry, Papad' },
  { id: 'fm-c11', hostelId: 'hostel-1', date: '2026-07-16', mealType: 'lunch', menuItems: 'Roti, Paneer Butter Masala, Rice, Dal' },
  { id: 'fm-c12', hostelId: 'hostel-1', date: '2026-07-17', mealType: 'lunch', menuItems: 'Rice, Rasam, Cabbage Fry, Curd' },
  { id: 'fm-c13', hostelId: 'hostel-1', date: '2026-07-18', mealType: 'lunch', menuItems: 'Roti, Dal Tadka, Jeera Rice' },
  { id: 'fm-c14', hostelId: 'hostel-1', date: '2026-07-19', mealType: 'lunch', menuItems: 'Special Meals, Sweet, Ice Cream' },

  { id: 'fm-c15', hostelId: 'hostel-1', date: '2026-07-13', mealType: 'dinner', menuItems: 'Roti, Mixed Veg Curry, Khichdi' },
  { id: 'fm-c16', hostelId: 'hostel-1', date: '2026-07-14', mealType: 'dinner', menuItems: 'Roti, Dal Fry, Rice' },
  { id: 'fm-c17', hostelId: 'hostel-1', date: '2026-07-15', mealType: 'dinner', menuItems: 'Egg Masala, Chapati, Rice' },
  { id: 'fm-c18', hostelId: 'hostel-1', date: '2026-07-16', mealType: 'dinner', menuItems: 'Roti, Aloo Gobi, Rice, Dal' },
  { id: 'fm-c19', hostelId: 'hostel-1', date: '2026-07-17', mealType: 'dinner', menuItems: 'Roti, Bhindi Masala, Rice, Rasam' },
  { id: 'fm-c20', hostelId: 'hostel-1', date: '2026-07-18', mealType: 'dinner', menuItems: 'Fried Rice, Manchurian, Soup' },
  { id: 'fm-c21', hostelId: 'hostel-1', date: '2026-07-19', mealType: 'dinner', menuItems: 'Roti, Kadai Paneer, Rice, Dal' },

  // Mock data for Comfort Living (hostel-2) - Current Week (13 July to 19 July 2026)
  { id: 'fm-c2-1', hostelId: 'hostel-2', date: '2026-07-13', mealType: 'breakfast', menuItems: 'Idli, Sambar, Chutney, Tea' },
  { id: 'fm-c2-2', hostelId: 'hostel-2', date: '2026-07-14', mealType: 'breakfast', menuItems: 'Poha, Banana, Tea' },
  { id: 'fm-c2-3', hostelId: 'hostel-2', date: '2026-07-15', mealType: 'breakfast', menuItems: 'Poori, Chana Masala, Tea' },
  { id: 'fm-c2-4', hostelId: 'hostel-2', date: '2026-07-16', mealType: 'breakfast', menuItems: 'Upma, Coconut Chutney, Tea' },
  { id: 'fm-c2-5', hostelId: 'hostel-2', date: '2026-07-17', mealType: 'breakfast', menuItems: 'Paratha, Curd, Pickle' },
  { id: 'fm-c2-6', hostelId: 'hostel-2', date: '2026-07-18', mealType: 'breakfast', menuItems: 'Dosa, Sambar, Chutney' },
  { id: 'fm-c2-7', hostelId: 'hostel-2', date: '2026-07-19', mealType: 'breakfast', menuItems: 'Pongal, Sambar, Chutney' },
];

interface FoodMenuState {
  entries: FoodMenuEntry[];
  loading: boolean;
  error: string | null;
}

const initialState: FoodMenuState = {
  entries: mockFoodMenu,
  loading: false,
  error: null,
};

const foodMenuSlice = createSlice({
  name: 'foodMenu',
  initialState,
  reducers: {
    addFoodMenuEntry(state, action: PayloadAction<Omit<FoodMenuEntry, 'id'>>) {
      const newId = `fm-${state.entries.length + 1}`;
      state.entries.push({
        ...action.payload,
        id: newId,
      });
    },
    updateFoodMenuEntry(state, action: PayloadAction<FoodMenuEntry>) {
      const index = state.entries.findIndex(
        entry => entry.id === action.payload.id
      );
      if (index !== -1) {
        state.entries[index] = action.payload;
      }
    },
    deleteFoodMenuEntry(state, action: PayloadAction<{ id: string }>) {
      state.entries = state.entries.filter(entry => entry.id !== action.payload.id);
    },
  },
});

export const { addFoodMenuEntry, updateFoodMenuEntry, deleteFoodMenuEntry } = foodMenuSlice.actions;
export default foodMenuSlice.reducer;
