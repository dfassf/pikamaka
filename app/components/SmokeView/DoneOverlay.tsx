import Button from '@/app/components/Button/Button';
import styles from './SmokeView.module.css';

interface Props {
  message: string;
  onNewCig: () => void;
  onViewRecord: () => void;
}

export default function DoneOverlay({ message, onNewCig, onViewRecord }: Props) {
  return (
    <div className={styles.doneOverlay}>
      <h2>한 개비 완료</h2>
      <p>{message}</p>
      <Button variant="primary" size="lg" fullWidth onClick={onNewCig}>새 담배 피우기</Button>
      <Button variant="ghost" size="lg" fullWidth onClick={onViewRecord}>기록 보기</Button>
    </div>
  );
}
