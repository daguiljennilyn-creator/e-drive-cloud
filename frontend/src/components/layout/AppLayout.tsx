import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setSidebarOpen(false)
    mainRef.current?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
  }, [location.pathname, location.search])

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[90] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-700 focus:shadow-lg"
      >
        Skip to content
      </a>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-0 flex-1 flex-col lg:pl-[252px]">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="app-scroll min-h-0 flex-1 overflow-y-auto pb-24 outline-none lg:pb-10"
        >
          <div className="mx-auto w-full max-w-[1460px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            <div key={location.pathname} className="animate-fade">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
