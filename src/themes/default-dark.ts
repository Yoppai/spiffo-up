export interface ThemePalette {
  primary: string;
  secondary: string;
  background: string;
  success: string;
  warning: string;
  error: string;
  focus: string;
  text: string;
  accent: string;
}

export const defaultDarkTheme: ThemePalette = {
  primary: 'cyan',
  secondary: 'magenta',
  background: 'black',
  success: 'green',
  warning: 'yellow',
  error: 'red',
  focus: 'blue',
  text: 'white',
  accent: 'green',
};
