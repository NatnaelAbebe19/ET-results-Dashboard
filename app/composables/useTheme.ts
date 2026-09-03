export type ThemeMode = 'dark' | 'light'

export function useTheme() {
  const theme = useState<ThemeMode>('theme-mode', () => 'dark')

  function setTheme(newTheme: ThemeMode) {
    theme.value = newTheme
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', newTheme)
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
      document.documentElement.classList.toggle('light', newTheme === 'light')
      try {
        localStorage.setItem('et-theme', newTheme)
      } catch {}
    }
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  function initTheme() {
    if (import.meta.client) {
      let saved: ThemeMode | null = null
      try {
        saved = localStorage.getItem('et-theme') as ThemeMode | null
      } catch {}

      if (saved === 'light' || saved === 'dark') {
        setTheme(saved)
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        setTheme('light')
      } else {
        setTheme('dark')
      }
    }
  }

  return {
    theme,
    toggleTheme,
    setTheme,
    initTheme
  }
}
