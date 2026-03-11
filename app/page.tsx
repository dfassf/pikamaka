'use client';

import { useState, useEffect } from 'react';
import { ViewId, AppSettings } from '@/app/lib/types';
import { isTutorialSeen, loadSettings, saveSettings } from '@/app/lib/storage';
import BottomNav from '@/app/components/BottomNav/BottomNav';
import RecordView from '@/app/components/RecordView/RecordView';
import StatsView from '@/app/components/StatsView/StatsView';
import SmokeView from '@/app/components/SmokeView/SmokeView';
import SettingsPanel from '@/app/components/Settings/SettingsPanel';
import Tutorial from '@/app/components/Tutorial/Tutorial';
import styles from './page.module.css';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewId>('smoke');
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    if (!isTutorialSeen()) setShowTutorial(true);
  }, []);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}><span>한 모금</span></h1>
      </header>

      <div className={styles.view}>
        {currentView === 'smoke' && <SmokeView settings={settings} onViewRecord={() => setCurrentView('record')} />}
        {currentView === 'record' && <RecordView settings={settings} />}
        {currentView === 'stats' && <StatsView />}
      </div>

      <BottomNav
        currentView={currentView}
        onChangeView={setCurrentView}
        onOpenSettings={() => setShowSettings(true)}
      />

      {showSettings && <SettingsPanel onClose={() => { setShowSettings(false); setSettings(loadSettings()); }} />}
      {showTutorial && (
        <Tutorial
          onClose={() => setShowTutorial(false)}
          onSaveSettings={(partial: Partial<AppSettings>) => {
            const updated = { ...settings, ...partial };
            saveSettings(updated);
            setSettings(updated);
          }}
        />
      )}
    </div>
  );
}
