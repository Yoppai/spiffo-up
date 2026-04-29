import rawPalette from './default-dark.json';

export interface ThemePalette {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    success: string;
    warning: string;
    error: string;
    focus: string;
    text: string;
    accent: string;
    border: string;
  };
}

export const defaultDarkTheme: ThemePalette = {
  name: rawPalette.name,
  colors: rawPalette.colors,
};