import React, { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'

const Dashboard = React.lazy(() => import('./pages/Dashboard.jsx'))
const Calculator = React.lazy(() => import('./pages/Calculator.jsx'))
const Tips = React.lazy(() => import('./pages/Tips.jsx'))
const History = React.lazy(() => import('./pages/History.jsx'))
const About = React.lazy(() => import('./pages/About.jsx'))

function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-pulse" aria-hidden="true">
      {/* Hero banner skeleton */}
      <div className="h-36 bg-gray-200 rounded-2xl w-full"></div>
      
      {/* Stats/Cards grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-44 bg-gray-200 rounded-2xl"></div>
        <div className="h-44 bg-gray-200 rounded-2xl"></div>
        <div className="h-44 bg-gray-200 rounded-2xl"></div>
      </div>
      
      {/* Content area skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-8 bg-gray-200 rounded-lg w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded-lg w-1/2"></div>
          <div className="h-48 bg-gray-200 rounded-2xl"></div>
          <div className="h-48 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <Navbar />
      <main id="main-content" className="pt-20">
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/tips" element={<Tips />} />
            <Route path="/history" element={<History />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

export default App
