import './styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { I18nProvider } from 'react-aria-components'
import { createRoot } from 'react-dom/client'
import { router } from './app/router'
import { applyTheme } from './lib/prefs'
import { ToastProvider } from './ui/feedback'

const queryClient = new QueryClient({
  defaultOptions: {
    // Data is local and invalidated after every command; no background refetch storms.
    queries: { retry: false, refetchOnWindowFocus: false, staleTime: 30_000 },
    mutations: { retry: false }
  }
})

document.documentElement.dataset.platform = window.bridge.platform
applyTheme()

const container = document.getElementById('root')
if (!container) throw new Error('root element missing')

createRoot(container).render(
  <StrictMode>
    {/* fa-IR with the Persian calendar: Jalali date pickers and Persian digits everywhere. */}
    <I18nProvider locale="fa-IR-u-ca-persian">
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryClientProvider>
    </I18nProvider>
  </StrictMode>
)
