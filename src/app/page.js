'use client'
import Footer from './components/Footer/Footer'
import Navbar from './components/Navbar/Navbar'
import Config from './config'
import './styles/Home.css'
export default function Home({ children }) {
  return (
    <>
      <div>
        <div>
          <Navbar />
        </div>
        Home page
        <div>
          <Footer />
        </div>
      </div>
    </>
  )
}
