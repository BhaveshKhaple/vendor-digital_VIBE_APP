import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/useColorScheme";

export function useTheme() {
  // Force light theme for clean, minimalistic look
  const colorScheme = 'light'; // Always use light theme
  const isDark = false;
  const theme = Colors.light;

  return {
    theme,
    isDark,
  };
}

