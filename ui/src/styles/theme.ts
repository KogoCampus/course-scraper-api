import { DefaultTheme } from 'styled-components';

export const theme: DefaultTheme = {
  colors: {
    primary: '#111827',
    secondary: '#4b5563',
    background: '#f8f9fa',
    white: '#ffffff',
    border: '#e5e7eb',
    action: '#3b82f6',
    danger: '#dc2626',
  },
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  transitions: {
    default: 'all 0.2s ease-in-out',
  },
}; 