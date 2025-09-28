import React from 'react'
import { Outlet } from 'react-router-dom'
import './App.scss'

function App() {
  return (
    <React.Fragment>
      <Outlet />
    </React.Fragment>
  )
}

export default App
