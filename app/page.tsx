'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [showTutorial, setShowTutorial] = useState(false);
  const [showMicTip, setShowMicTip] = useState(false);
  const [settings, setSettings] = useState(loadSettings);
  const beforeLeaveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isTutorialSeen()) setShowTutorial(true);
  }, []);

  function handleViewChange(view: ViewId) {
    if (currentView === 'smoke' && view !== 'smoke') {
      beforeLeaveRef.current?.();
    }
    setCurrentView(view);
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}><span>필까말까</span></h1>
      </header>

      <div className={styles.view}>
        {currentView === 'smoke' && <SmokeView settings={settings} onViewRecord={() => handleViewChange('record')} beforeLeaveRef={beforeLeaveRef} showMicTip={showMicTip} onMicTipDismiss={() => setShowMicTip(false)} />}
        {currentView === 'record' && <RecordView settings={settings} />}
        {currentView === 'stats' && <StatsView settings={settings} />}
        {currentView === 'settings' && <SettingsPanel settings={settings} onSettingsChange={setSettings} />}
      </div>

      <BottomNav
        currentView={currentView}
        onChangeView={handleViewChange}
      />
      {showTutorial && (
        <Tutorial
          onClose={() => { setShowTutorial(false); setShowMicTip(true); }}
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
