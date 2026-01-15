import { useColorScheme } from "react-native";

export function getThemeColors(scheme: "light" | "dark" | null) {
  const dark = scheme === "dark";
  return {
    background: dark ? "#0b0b0c" : "#ffffff",
    surface: dark ? "#141416" : "#f6f7f9",
    text: dark ? "#ffffff" : "#111111",
    muted: dark ? "#a0a0a5" : "#666666",
    border: dark ? "#2a2a2f" : "#e6e6e6",
    primary: dark ? "#7ab7ff" : "#0b5fff",
  };
}

export function useTheme() {
  const scheme = useColorScheme();
  return getThemeColors(scheme ?? null);
}
