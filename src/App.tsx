import { useState, useEffect } from 'react'
import CalendarPage from './pages/CalendarPage'
import HistoryPage from './pages/HistoryPage'
import ChartPage from './pages/ChartPage'
import ImportPage from './pages/ImportPage'
import StatisticsPage from './pages/StatisticsPage'
import ProfitGraphPage from './pages/ProfitGraphPage'
import { Tab } from './types'
import './index.css'
import { UpdaterDialog } from './components/UpdaterDialog'
import { getVersion } from '@tauri-apps/api/app'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('calendar')
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    getVersion().then(setVersion).catch(console.error)
  }, [])

  return (
    <div className="flex h-screen font-sans">
      {/* サイドバー */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col h-full shadow-lg border-r border-gray-700">
        {/* タイトル */}
        <div className="text-2xl font-bold p-4 border-b border-gray-700">
          FX Manager
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 p-2 flex flex-col gap-2">
          <button
            className={`w-full text-left p-3 rounded hover:bg-gray-700 transition ${
              activeTab === 'calendar' ? 'bg-gray-700' : ''
            }`}
            onClick={() => setActiveTab('calendar')}
          >
            📅 カレンダー
          </button>
          <button
            className={`w-full text-left p-3 rounded hover:bg-gray-700 transition ${
              activeTab === 'history' ? 'bg-gray-700' : ''
            }`}
            onClick={() => setActiveTab('history')}
          >
            📊 取引履歴
          </button>
          <button
            className={`w-full text-left p-3 rounded hover:bg-gray-700 transition ${
              activeTab === 'chart' ? 'bg-gray-700' : ''
            }`}
            onClick={() => setActiveTab('chart')}
          >
            📈 チャート
          </button>
          <button
            className={`w-full text-left p-3 rounded hover:bg-gray-700 transition ${
              activeTab === 'import' ? 'bg-gray-700' : ''
            }`}
            onClick={() => setActiveTab('import')}
          >
            💼 インポート
          </button>
          <button
            className={`w-full text-left p-3 rounded hover:bg-gray-700 transition ${
              activeTab === 'statistics' ? 'bg-gray-700' : ''
            }`}
            onClick={() => setActiveTab('statistics')}
          >
            🔎 統計
          </button>

          <button
            className={`w-full text-left p-3 rounded hover:bg-gray-700 transition ${
              activeTab === 'profit' ? 'bg-gray-700' : ''
            }`}
            onClick={() => setActiveTab('profit')}
          >
            🏦 収益
          </button>
        </nav>

        {/* フッター */}
        <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
          © 2025 FX Manager v{version}
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 bg-gray-100 p-6 overflow-auto">
        <UpdaterDialog />
        {activeTab === 'calendar' && <CalendarPage />}
        {activeTab === 'history' && <HistoryPage />}
        {activeTab === 'chart' && <ChartPage />}
        {activeTab === 'import' && <ImportPage />}
        {activeTab === 'statistics' && <StatisticsPage />}
        {activeTab === 'profit' && <ProfitGraphPage />}
      </main>
    </div>
  )
}

export default App
