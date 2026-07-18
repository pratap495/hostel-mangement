import { Platform, PixelRatio } from 'react-native';

const fontScale = PixelRatio.getFontScale();

export const typography = {
  fontFamily: Platform.select({
    ios: 'System',
    android: 'System',
    default: 'System',
  }),
  sizes: {
    xs: 11 / fontScale,
    sm: 13 / fontScale,
    md: 15 / fontScale,
    lg: 18 / fontScale,
    xl: 22 / fontScale,
    xxl: 26 / fontScale,
    xxxl: 32 / fontScale,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  lineHeights: {
    xs: 16,
    sm: 18,
    md: 22,
    lg: 26,
    xl: 30,
    xxl: 36,
    xxxl: 42,
  },
};
