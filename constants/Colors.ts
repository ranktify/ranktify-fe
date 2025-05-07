/**
* Below are the colors that are used in the app. The colors are defined in the light and dark mode.
* There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
*/

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';
const primaryColor = '#6200ee';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    cardBackground: '#ffffff',
    inputBackground: '#f5f5f5',
    border: '#e0e0e0',
    placeholder: '#9e9e9e',
    primary: primaryColor,
    secondary: '#616161',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    cardBackground: '#1e1e1e',
    inputBackground: '#2d2d2d',
    border: '#404040',
    placeholder: '#666666',
    primary: '#bb86fc',
    secondary: '#9e9e9e',
  },
};
