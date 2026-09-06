import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CloudSync } from './services/cloudSync'

async function boot() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )

  // Keep the UI responsive when the network is slow or unavailable.
  void Promise.race([
    CloudSync.hydrate(),
    new Promise<void>(resolve => setTimeout(resolve, 5000)),
  ]).catch(() => undefined)
}

void boot()
