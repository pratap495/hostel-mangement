import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import {
  addFoodMenuEntry,
  updateFoodMenuEntry,
  deleteFoodMenuEntry,
} from '../../redux/slices/foodMenuSlice';
import { MealType, FoodMenuEntry } from '../../types';
import { colors, typography, radius } from '../../theme';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthsFull = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const weekdaysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Helper: Get start of the week (Monday)
const getStartOfWeek = (d: Date): Date => {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

// Helper: Get 7 days starting from Monday
const getWeekDays = (startOfWeek: Date): Date[] => {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }
  return days;
};

// Helper: Format date range "19 May – 25 May 2025"
const formatDateRange = (start: Date, end: Date): string => {
  const startDay = start.getDate();
  const startMonth = months[start.getMonth()];
  const startYear = start.getFullYear();

  const endDay = end.getDate();
  const endMonth = months[end.getMonth()];
  const endYear = end.getFullYear();

  if (startYear !== endYear) {
    return `${startDay} ${startMonth} ${startYear} – ${endDay} ${endMonth} ${endYear}`;
  }
  if (startMonth !== endMonth) {
    return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${startYear}`;
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${startYear}`;
};

// Helper: Format day row "Mon, 19 May"
const formatDayRow = (d: Date): string => {
  const dayName = weekdaysShort[d.getDay()];
  const dayDate = d.getDate();
  const monthName = months[d.getMonth()];
  return `${dayName}, ${dayDate} ${monthName}`;
};

// Helper: Format full date "Wednesday, 21 May 2025"
const formatFullDate = (d: Date): string => {
  const daysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = daysFull[d.getDay()];
  const dayDate = d.getDate();
  const monthName = monthsFull[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${dayDate} ${monthName} ${year}`;
};

// Helper: Format Date object to YYYY-MM-DD
const formatDateISO = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Parse YYYY-MM-DD to Date object
const parseDateISO = (str: string): Date => {
  const [year, month, day] = str.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function FoodMenuScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { activeHostelId } = useAppSelector(state => state.auth);
  const entries = useAppSelector(state => state.foodMenu.entries);

  // States
  const [selectedTab, setSelectedTab] = useState<MealType>('breakfast');
  const [currentWeekMonday, setCurrentWeekMonday] = useState<Date>(() => getStartOfWeek(new Date('2025-05-19')));

  // Add Meal Sheet states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [addDate, setAddDate] = useState<Date | null>(null);
  const [addMeal, setAddMeal] = useState<MealType | null>(null);
  const [addMenuItems, setAddMenuItems] = useState('');

  // Edit Meal Sheet states
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [editingEntry, setEditingEntry] = useState<FoodMenuEntry | null>(null);
  const [editMenuItems, setEditMenuItems] = useState('');

  // Custom Calendar Modal states
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMode, setCalendarMode] = useState<'add' | 'edit'>('add');

  // Custom Dropdown Modal states
  const [isMealDropdownVisible, setIsMealDropdownVisible] = useState(false);

  // Week navigation
  const handlePrevWeek = () => {
    const prev = new Date(currentWeekMonday);
    prev.setDate(currentWeekMonday.getDate() - 7);
    setCurrentWeekMonday(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekMonday);
    next.setDate(currentWeekMonday.getDate() + 7);
    setCurrentWeekMonday(next);
  };

  const weekDays = getWeekDays(currentWeekMonday);
  const weekEndDay = new Date(currentWeekMonday);
  weekEndDay.setDate(currentWeekMonday.getDate() + 6);

  // Open Edit or Add when tapping 3-dot menu
  const handleRowMenuPress = (day: Date, entry: FoodMenuEntry | undefined) => {
    setSelectedDayDate(day);
    if (entry) {
      setEditingEntry(entry);
      setEditMenuItems(entry.menuItems);
      setIsEditModalVisible(true);
    } else {
      // Pre-fill Add Meal sheet with selected day and current meal tab!
      setAddDate(day);
      setAddMeal(selectedTab);
      setAddMenuItems('');
      setIsAddModalVisible(true);
    }
  };

  // Add Meal functions
  const handleSaveMeal = () => {
    if (!addDate) {
      Alert.alert('Error', 'Please select a date.');
      return;
    }
    if (!addMeal) {
      Alert.alert('Error', 'Please select a meal type.');
      return;
    }
    if (!addMenuItems.trim()) {
      Alert.alert('Error', 'Please enter menu items.');
      return;
    }
    if (!activeHostelId) {
      Alert.alert('Error', 'No active hostel selected.');
      return;
    }

    const dateStr = formatDateISO(addDate);

    // Check if entry already exists
    const exists = entries.some(
      e => e.hostelId === activeHostelId && e.date === dateStr && e.mealType === addMeal
    );
    if (exists) {
      Alert.alert(
        'Entry Exists',
        `A menu entry already exists for ${addMeal.toUpperCase()} on this day. Use the edit menu to modify it.`
      );
      return;
    }

    dispatch(
      addFoodMenuEntry({
        hostelId: activeHostelId,
        date: dateStr,
        mealType: addMeal,
        menuItems: addMenuItems.trim(),
      })
    );

    Alert.alert('Success', 'Meal menu added successfully.');
    setIsAddModalVisible(false);
    // Reset states
    setAddDate(null);
    setAddMeal(null);
    setAddMenuItems('');
  };

  // Edit Meal functions
  const handleUpdateMeal = () => {
    if (!editingEntry) return;
    if (!editMenuItems.trim()) {
      Alert.alert('Error', 'Please enter menu items.');
      return;
    }

    dispatch(
      updateFoodMenuEntry({
        ...editingEntry,
        menuItems: editMenuItems.trim(),
      })
    );

    Alert.alert('Success', 'Meal menu updated successfully.');
    setIsEditModalVisible(false);
  };

  const handleDeleteMeal = () => {
    if (!editingEntry) return;

    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to clear the menu items for this meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteFoodMenuEntry({ id: editingEntry.id }));
            Alert.alert('Success', 'Meal menu cleared successfully.');
            setIsEditModalVisible(false);
          },
        },
      ]
    );
  };

  // Calendar Modal logic
  const openCalendar = (mode: 'add' | 'edit') => {
    setCalendarMode(mode);
    const initialDate = mode === 'add' ? (addDate || new Date()) : (selectedDayDate || new Date());
    setCalendarMonth(initialDate.getMonth());
    setCalendarYear(initialDate.getFullYear());
    setIsCalendarVisible(true);
  };

  const handleCalendarDaySelect = (day: Date) => {
    if (calendarMode === 'add') {
      setAddDate(day);
    } else {
      setSelectedDayDate(day);
    }
    setIsCalendarVisible(false);
  };

  // Generate Calendar cells
  const getDaysInMonth = (year: number, month: number): Date[] => {
    const date = new Date(year, month, 1);
    const days: Date[] = [];
    const startDay = date.getDay();
    // Align: Monday (1) to Sunday (0 -> offset 6)
    const startOffset = startDay === 0 ? 6 : startDay - 1;

    for (let i = 0; i < startOffset; i++) {
      days.push(null as any);
    }
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const calendarDays = getDaysInMonth(calendarYear, calendarMonth);

  const changeCalendarMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (calendarMonth === 0) {
        setCalendarMonth(11);
        setCalendarYear(y => y - 1);
      } else {
        setCalendarMonth(m => m - 1);
      }
    } else {
      if (calendarMonth === 11) {
        setCalendarMonth(0);
        setCalendarYear(y => y + 1);
      } else {
        setCalendarMonth(m => m + 1);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Custom Header matching mockups */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.white} />
          <Text style={styles.headerTitle}>Food Menu</Text>
        </TouchableOpacity>
      </View>

      {/* Meal Tabs */}
      <View style={styles.tabContainer}>
        {(['breakfast', 'lunch', 'dinner'] as MealType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, selectedTab === tab && styles.tabButtonActive]}
            onPress={() => setSelectedTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, selectedTab === tab && styles.tabButtonTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Week Selector */}
      <View style={styles.weekSelectorContainer}>
        <TouchableOpacity onPress={handlePrevWeek} style={styles.arrowBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={styles.weekRangeText}>
          {formatDateRange(currentWeekMonday, weekEndDay)}
        </Text>
        <TouchableOpacity onPress={handleNextWeek} style={styles.arrowBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Days List */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <View style={styles.daysListCard}>
          {weekDays.map((day, idx) => {
            const dateStr = formatDateISO(day);
            const entry = entries.find(
              e => e.hostelId === activeHostelId && e.date === dateStr && e.mealType === selectedTab
            );
            const isLast = idx === weekDays.length - 1;

            return (
              <View key={idx} style={[styles.dayRow, isLast && styles.dayRowLast]}>
                <View style={styles.dayInfoCol}>
                  <Text style={styles.dayNameText}>{formatDayRow(day)}</Text>
                </View>
                <View style={styles.menuCol}>
                  <Text
                    style={[styles.menuItemsText, !entry && styles.menuItemsTextEmpty]}
                    numberOfLines={2}
                  >
                    {entry ? entry.menuItems : 'Not Configured'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRowMenuPress(day, entry)}
                  style={styles.overflowBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="ellipsis-vertical" size={16} color={colors.textFaint} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* FAB Floating action button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsAddModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      {/* ================= ADD MEAL BOTTOM SHEET ================= */}
      <Modal
        visible={isAddModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsAddModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.sheetContent}
              >
                {/* Drag Indicator handle */}
                <View style={styles.sheetHandle} />

                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Add Meal</Text>
                  <TouchableOpacity onPress={() => setIsAddModalVisible(false)} style={styles.closeBtn}>
                    <Ionicons name="close-outline" size={22} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.sheetScroll} keyboardShouldPersistTaps="handled">
                  {/* Day Selection */}
                  <Text style={styles.inputLabel}>Day</Text>
                  <TouchableOpacity
                    style={styles.selectionField}
                    onPress={() => openCalendar('add')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.selectionValueText, !addDate && styles.selectionPlaceholder]}>
                      {addDate ? formatFullDate(addDate) : 'Select Day'}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color={colors.textFaint} />
                  </TouchableOpacity>

                  {/* Meal Type Selection */}
                  <Text style={styles.inputLabel}>Meal</Text>
                  <TouchableOpacity
                    style={styles.selectionField}
                    onPress={() => setIsMealDropdownVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.selectionValueText, !addMeal && styles.selectionPlaceholder]}>
                      {addMeal ? addMeal.charAt(0).toUpperCase() + addMeal.slice(1) : 'Select Meal'}
                    </Text>
                    <Ionicons name="chevron-down-outline" size={18} color={colors.textFaint} />
                  </TouchableOpacity>

                  {/* Menu Items Text Area */}
                  <Text style={styles.inputLabel}>Menu Items</Text>
                  <View style={styles.textAreaContainer}>
                    <TextInput
                      style={styles.textArea}
                      multiline
                      numberOfLines={4}
                      placeholder="e.g., Idli, Sambar, Chutney"
                      placeholderTextColor={colors.textFaint}
                      value={addMenuItems}
                      onChangeText={setAddMenuItems}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Actions */}
                  <TouchableOpacity style={styles.submitBtn} onPress={handleSaveMeal} activeOpacity={0.8}>
                    <Text style={styles.submitBtnText}>Save Meal</Text>
                  </TouchableOpacity>
                </ScrollView>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ================= EDIT MEAL BOTTOM SHEET ================= */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsEditModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.sheetContent}
              >
                {/* Drag Indicator handle */}
                <View style={styles.sheetHandle} />

                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Edit Meal</Text>
                  <TouchableOpacity onPress={() => setIsEditModalVisible(false)} style={styles.closeBtn}>
                    <Ionicons name="close-outline" size={22} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.sheetScroll} keyboardShouldPersistTaps="handled">
                  {/* Day (Read-only showing selected date) */}
                  <Text style={styles.inputLabel}>Day</Text>
                  <View style={[styles.selectionField, styles.selectionFieldDisabled]}>
                    <Text style={styles.selectionValueText}>
                      {selectedDayDate ? formatFullDate(selectedDayDate) : ''}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color={colors.textFaint} />
                  </View>

                  {/* Meal Type (Dropdown pre-set to relevant meal type) */}
                  <Text style={styles.inputLabel}>Meal</Text>
                  <View style={[styles.selectionField, styles.selectionFieldDisabled]}>
                    <Text style={styles.selectionValueText}>
                      {editingEntry ? editingEntry.mealType.charAt(0).toUpperCase() + editingEntry.mealType.slice(1) : ''}
                    </Text>
                    <Ionicons name="chevron-down-outline" size={18} color={colors.textFaint} />
                  </View>

                  {/* Menu Items Text Area */}
                  <Text style={styles.inputLabel}>Menu Items</Text>
                  <View style={styles.textAreaContainer}>
                    <TextInput
                      style={styles.textArea}
                      multiline
                      numberOfLines={4}
                      placeholder="e.g., Idli, Sambar, Chutney"
                      placeholderTextColor={colors.textFaint}
                      value={editMenuItems}
                      onChangeText={setEditMenuItems}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Action Buttons */}
                  <TouchableOpacity style={styles.submitBtn} onPress={handleUpdateMeal} activeOpacity={0.8}>
                    <Text style={styles.submitBtnText}>Update Meal</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={handleDeleteMeal}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.deleteBtnText}>Delete Meal</Text>
                  </TouchableOpacity>
                </ScrollView>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ================= CUSTOM CALENDAR MODAL ================= */}
      <Modal
        visible={isCalendarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCalendarVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsCalendarVisible(false)}>
          <View style={styles.calendarOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.calendarBox}>
                {/* Header */}
                <View style={styles.calendarHeader}>
                  <TouchableOpacity onPress={() => changeCalendarMonth('prev')} style={styles.calendarMonthArrow}>
                    <Ionicons name="chevron-back" size={20} color={colors.white} />
                  </TouchableOpacity>
                  <Text style={styles.calendarMonthTitle}>
                    {monthsFull[calendarMonth]} {calendarYear}
                  </Text>
                  <TouchableOpacity onPress={() => changeCalendarMonth('next')} style={styles.calendarMonthArrow}>
                    <Ionicons name="chevron-forward" size={20} color={colors.white} />
                  </TouchableOpacity>
                </View>

                {/* Weekdays Row */}
                <View style={styles.calendarWeekdaysRow}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((wd, i) => (
                    <Text key={i} style={styles.calendarWeekdayText}>{wd}</Text>
                  ))}
                </View>

                {/* Days Grid */}
                <View style={styles.calendarGrid}>
                  {calendarDays.map((day, idx) => {
                    if (!day) {
                      return <View key={idx} style={styles.calendarDayCellEmpty} />;
                    }

                    const isSelected = calendarMode === 'add'
                      ? (addDate && formatDateISO(addDate) === formatDateISO(day))
                      : (selectedDayDate && formatDateISO(selectedDayDate) === formatDateISO(day));

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.calendarDayCell, isSelected && styles.calendarDayCellActive]}
                        onPress={() => handleCalendarDaySelect(day)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextActive]}>
                          {day.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ================= CUSTOM MEAL TYPE SELECTOR MODAL ================= */}
      <Modal
        visible={isMealDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMealDropdownVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsMealDropdownVisible(false)}>
          <View style={styles.dropdownOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownBox}>
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownTitle}>Select Meal</Text>
                  <TouchableOpacity onPress={() => setIsMealDropdownVisible(false)}>
                    <Ionicons name="close-outline" size={24} color={colors.white} />
                  </TouchableOpacity>
                </View>
                {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((m, idx) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.dropdownItemRow, addMeal === m && styles.dropdownItemSelectedRow]}
                    onPress={() => {
                      setAddMeal(m);
                      setIsMealDropdownVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dropdownItemText, addMeal === m && styles.dropdownItemSelectedText]}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </Text>
                    {addMeal === m && (
                      <Ionicons name="checkmark" size={18} color={colors.gold} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    ...Platform.select({
      ios: {
        marginTop: 40,
      },
      android: {
        marginTop: 15,
      },
    }),
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop:30,
    gap: 4,
  },
  headerTitle: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    backgroundColor: colors.card,
    height: 40,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  tabButtonActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  tabButtonText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  tabButtonTextActive: {
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  weekSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  weekRangeText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  daysListCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  dayRowLast: {
    borderBottomWidth: 0,
  },
  dayInfoCol: {
    width: '32%',
  },
  dayNameText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  menuCol: {
    flex: 1,
    paddingRight: 8,
  },
  menuItemsText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  menuItemsTextEmpty: {
    color: colors.textFaint,
    fontStyle: 'italic',
  },
  overflowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderColor: colors.divider,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  sheetTitle: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetScroll: {
    padding: 20,
  },
  inputLabel: {
    color: colors.gold,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  selectionField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#201915',
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.md,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  selectionFieldDisabled: {
    opacity: 0.6,
    backgroundColor: '#1b1512',
  },
  selectionValueText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  selectionPlaceholder: {
    color: colors.textFaint,
  },
  textAreaContainer: {
    backgroundColor: '#201915',
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 24,
  },
  textArea: {
    color: colors.white,
    fontSize: typography.sizes.md,
    height: 100,
  },
  submitBtn: {
    backgroundColor: colors.gold,
    height: 52,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  submitBtnText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.error,
    height: 52,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  deleteBtnText: {
    color: colors.error,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  // Calendar styles
  calendarOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  calendarBox: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    width: '100%',
    maxWidth: 350,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarMonthArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  calendarMonthTitle: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  calendarWeekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  calendarWeekdayText: {
    color: colors.gold,
    width: 36,
    textAlign: 'center',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.xs,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  calendarDayCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  calendarDayCellEmpty: {
    width: 36,
    height: 36,
    marginVertical: 4,
  },
  calendarDayCellActive: {
    backgroundColor: colors.gold,
  },
  calendarDayText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  calendarDayTextActive: {
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  // Dropdown overlay styles
  dropdownOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dropdownBox: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    width: '100%',
    maxWidth: 320,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  dropdownTitle: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  dropdownItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  dropdownItemSelectedRow: {
    backgroundColor: 'rgba(199, 150, 42, 0.08)',
  },
  dropdownItemText: {
    color: colors.textMuted,
    fontSize: typography.sizes.md,
  },
  dropdownItemSelectedText: {
    color: colors.gold,
    fontWeight: typography.weights.semibold,
  },
});
