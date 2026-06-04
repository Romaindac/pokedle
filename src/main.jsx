import { StrictMode } from 'react'
    import { createRoot } from 'react-dom/client'
    import App from './App.jsx'
    import ErrorBoundary from './ErrorBoundary.jsx'   
    import './App.css'
 
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <ErrorBoundary cleSauvegarde="pokedex-idle-save-v11">   
          <App />
        </ErrorBoundary>                                         
      </StrictMode>,
    )