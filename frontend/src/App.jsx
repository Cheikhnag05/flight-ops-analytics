import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import FlightBoard from './pages/FlightBoard'
import OTP        from './pages/OTP'
import Delays     from './pages/Delays'
import Turnaround from './pages/Turnaround'
import Routes     from './pages/Routes'
import Passenger  from './pages/Passenger'
import { api }    from './api'

const PAGES = { flightboard:FlightBoard, otp:OTP, delays:Delays, turnaround:Turnaround, routes:Routes, passenger:Passenger }

export default function App() {
  const [page,   setPage]   = useState('flightboard')
  const [health, setHealth] = useState(false)
  const Page = PAGES[page]

  useEffect(() => {
    api.health().then(h => setHealth(h.data_loaded || h.flights_loaded)).catch(() => setHealth(false))
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-cockpit-black">
      <Navbar current={page} onChange={setPage} health={health} />
      <main className="flex-1 overflow-y-auto">
        <Page />
      </main>
    </div>
  )
}
