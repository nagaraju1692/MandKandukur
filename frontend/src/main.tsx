import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import Home from './pages/Home'
import Categories from './pages/Categories'
import Businesses from './pages/Businesses'
import BusinessDetails from './pages/BusinessDetails'
import Favorites from './pages/Favorites'
import Search from './pages/Search'
import Profile from './pages/Profile'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="categories" element={<Categories />} />
          <Route path="businesses" element={<Businesses />} />
          <Route path="business/:id" element={<BusinessDetails />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="search" element={<Search />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
