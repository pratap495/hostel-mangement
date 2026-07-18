import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const sizes = {
  width,
  height,
  headerHeight: Platform.OS === 'ios' ? 88 : 64,
  inputHeight: 52,
  buttonHeight: 52,
  cardElevation: 4,
  isSmallDevice: width < 375,
  isTablet: width >= 768,
  isWeb: Platform.OS === 'web',
};
