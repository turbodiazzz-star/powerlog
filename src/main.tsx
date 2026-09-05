import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CloudSync } from './services/cloudSync'

async function boot() {
  try {
    await CloudSync.hydrate()
  } catch {
    // local data still works
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void boot()
