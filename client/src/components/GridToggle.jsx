import { useAppContext } from '../provider/AppStates';

export default function GridToggle() {
  const { showGrid, setShowGrid } = useAppContext();

  const toggleGrid = () => {
    setShowGrid(!showGrid);
  };
  return (
    <button
      className={`zoom grid-toggle ${showGrid ? 'active' : ''}`}
      onClick={toggleGrid}
      title={showGrid ? "Hide Grid" : "Show Grid"}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="currentColor"
      >
        <circle cx="2" cy="2" r="0.8" />
        <circle cx="8" cy="2" r="0.8" />
        <circle cx="14" cy="2" r="0.8" />
        <circle cx="2" cy="8" r="0.8" />
        <circle cx="8" cy="8" r="0.8" />
        <circle cx="14" cy="8" r="0.8" />
        <circle cx="2" cy="14" r="0.8" />
        <circle cx="8" cy="14" r="0.8" />
        <circle cx="14" cy="14" r="0.8" />
      </svg>
    </button>
  );
}
