import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

import CalendarPage from './pages/CalendarPage'
import HistoryPage from './pages/HistoryPage'
import ChartPage from './pages/ChartPage'
import ImportPage from './pages/ImportPage'
import StatisticsPage from './pages/StatisticsPage'
import ProfitGraphPage from './pages/ProfitGraphPage'

import './index.css'
import { UpdaterFooter } from './components/UpdaterFooter'
import { getVersion } from '@tauri-apps/api/app'

function App() {
  const [version, setVersion] = useState('')

  useEffect(() => {
    getVersion().then(setVersion).catch(console.error)
  }, [])

  return (
    <Router>
      <div className="flex h-screen font-sans">
        {/* サイドバー */}
        <aside className="w-64 bg-gray-800 text-white flex flex-col h-full shadow-lg border-r border-gray-700">
          <div className="text-2xl font-bold p-4 border-b border-gray-700">
            FX Manager
          </div>

          {/* ナビゲーション */}
          <nav className="flex-1 p-2 flex flex-col gap-2">
            <Link
              to="/calendar"
              className="w-full text-left p-3 rounded hover:bg-gray-700 transition"
            >
              📅 カレンダー
            </Link>

            <Link
              to="/history"
              className="w-full text-left p-3 rounded hover:bg-gray-700 transition"
            >
              📊 取引履歴
            </Link>

            <Link
              to="/chart"
              className="w-full text-left p-3 rounded hover:bg-gray-700 transition"
            >
              📈 チャート
            </Link>

            <Link
              to="/import"
              className="w-full text-left p-3 rounded hover:bg-gray-700 transition"
            >
              💼 インポート
            </Link>

            <Link
              to="/profit"
              className="w-full text-left p-3 rounded hover:bg-gray-700 transition"
            >
              🏦 収益
            </Link>
          </nav>

          {/* フッター */}
          <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
            <UpdaterFooter />
            © 2025 FX Manager v{version}
          </div>
        </aside>

        {/* メインコンテンツ */}
        <main className="flex-1 bg-gray-100 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<CalendarPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/history" element={<HistoryPage />} />

            {/* 行クリックから遷移するとここに入る */}
            {/* /chart/:tradeId/:timestamp */}
            <Route path="/chart" element={<ChartPage />} />
            <Route path="/chart/:tradeId/:timestamp" element={<ChartPage />} />

            <Route path="/import" element={<ImportPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/profit" element={<ProfitGraphPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
