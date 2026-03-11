'use client';

import { useRef, useEffect, useCallback } from 'react';
import styles from './DatePicker.module.css';

interface Props {
  value: string; // 'YYYY-MM-DD' or ''
  onChange: (date: string) => void;
  maxDate?: string; // 'YYYY-MM-DD'
}

const CELL_H = 40;

function range(start: number, end: number): number[] {
  const arr: number[] = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function DrumColumn({
  items,
  selected,
  onSelect,
  formatter,
}: {
  items: number[];
  selected: number;
  onSelect: (v: number) => void;
  formatter: (v: number) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const scrollToIndex = useCallback((idx: number, smooth = false) => {
    if (!ref.current) return;
    const top = idx * CELL_H;
    ref.current.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // Initial scroll
  useEffect(() => {
    const idx = items.indexOf(selected);
    if (idx >= 0) scrollToIndex(idx);
  }, [items, selected, scrollToIndex]);

  function handleScroll() {
    isScrolling.current = true;
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      isScrolling.current = false;
      if (!ref.current) return;
      const idx = Math.round(ref.current.scrollTop / CELL_H);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      if (items[clamped] !== selected) {
        onSelect(items[clamped]);
      }
    }, 80);
  }

  function handleClick(v: number) {
    onSelect(v);
    const idx = items.indexOf(v);
    if (idx >= 0) scrollToIndex(idx, true);
  }

  return (
    <div className={styles.column} ref={ref} onScroll={handleScroll}>
      <div className={styles.spacer} />
      {items.map(v => (
        <div
          key={v}
          className={`${styles.cell} ${v === selected ? styles.cellActive : ''}`}
          onClick={() => handleClick(v)}
        >
          {formatter(v)}
        </div>
      ))}
      <div className={styles.spacer} />
    </div>
  );
}

export default function DatePicker({ value, onChange, maxDate }: Props) {
  const today = maxDate || new Date().toISOString().split('T')[0];
  const [maxY, maxM, maxD] = today.split('-').map(Number);

  const parsed = value ? value.split('-').map(Number) : [maxY, maxM, maxD];
  const year = parsed[0];
  const month = parsed[1];
  const day = parsed[2];

  const years = range(maxY - 10, maxY);
  const months = range(1, year === maxY ? maxM : 12);
  const maxDay = daysInMonth(year, month);
  const dayLimit = (year === maxY && month === maxM) ? Math.min(maxDay, maxD) : maxDay;
  const days = range(1, dayLimit);

  function emit(y: number, m: number, d: number) {
    const clampedM = Math.min(m, year === maxY ? maxM : 12);
    const dm = daysInMonth(y, clampedM);
    const clampedD = Math.min(d, dm);
    const finalD = (y === maxY && clampedM === maxM) ? Math.min(clampedD, maxD) : clampedD;
    onChange(`${y}-${pad(clampedM)}-${pad(finalD)}`);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>
        <span>년</span>
        <span>월</span>
        <span>일</span>
      </div>
      <div className={styles.drums}>
        <DrumColumn
          items={years}
          selected={year}
          onSelect={y => emit(y, month, day)}
          formatter={v => `${v}`}
        />
        <DrumColumn
          items={months}
          selected={Math.min(month, months[months.length - 1])}
          onSelect={m => emit(year, m, day)}
          formatter={v => `${pad(v)}`}
        />
        <DrumColumn
          items={days}
          selected={Math.min(day, days[days.length - 1])}
          onSelect={d => emit(year, month, d)}
          formatter={v => `${pad(v)}`}
        />
      </div>
    </div>
  );
}
