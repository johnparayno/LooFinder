/**
 * BottomSheet - Snap between collapsed, half, and expanded states.
 * Airbnb-inspired: smooth transitions, premium feel.
 */
import { ReactNode, useRef, useState, useCallback, useEffect } from 'react';

export type BottomSheetSnap = 'collapsed' | 'half' | 'expanded';

interface BottomSheetProps {
  children: ReactNode;
  snap: BottomSheetSnap;
  onSnapChange?: (snap: BottomSheetSnap) => void;
  /** Height in vh when collapsed (peek) */
  collapsedHeight?: number;
  /** Height in vh when half */
  halfHeight?: number;
  /** Height in vh when expanded */
  expandedHeight?: number;
  /** Whether to show drag handle */
  showHandle?: boolean;
}

export function BottomSheet({
  children,
  snap,
  onSnapChange,
  collapsedHeight = 28,
  halfHeight = 50,
  expandedHeight = 85,
  showHandle = true,
}: BottomSheetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startSnapRef = useRef<BottomSheetSnap>(snap);

  const getHeight = useCallback(() => {
    switch (snap) {
      case 'collapsed':
        return collapsedHeight;
      case 'half':
        return halfHeight;
      case 'expanded':
        return expandedHeight;
      default:
        return halfHeight;
    }
  }, [snap, collapsedHeight, halfHeight, expandedHeight]);

  const cycleSnap = useCallback(() => {
    const next: BottomSheetSnap =
      snap === 'collapsed' ? 'half' : snap === 'half' ? 'expanded' : 'collapsed';
    onSnapChange?.(next);
  }, [snap, onSnapChange]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      startYRef.current = e.touches[0].clientY;
      startSnapRef.current = snap;
      setIsDragging(true);
    },
    [snap]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startYRef.current = e.clientY;
      startSnapRef.current = snap;
      setIsDragging(true);
    },
    [snap]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (clientY: number) => {
      const dy = clientY - startYRef.current;
      const threshold = 40;
      if (dy < -threshold && startSnapRef.current !== 'expanded') {
        const next: BottomSheetSnap =
          startSnapRef.current === 'collapsed' ? 'half' : 'expanded';
        onSnapChange?.(next);
        startSnapRef.current = next;
        startYRef.current = clientY;
      } else if (dy > threshold && startSnapRef.current !== 'collapsed') {
        const next: BottomSheetSnap =
          startSnapRef.current === 'expanded' ? 'half' : 'collapsed';
        onSnapChange?.(next);
        startSnapRef.current = next;
        startYRef.current = clientY;
      }
    };
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientY);
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientY);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onSnapChange, handleTouchEnd, handleMouseUp]);

  return (
    <div
      className="map-bottom-sheet"
      style={{
        height: `min(${getHeight()}vh, 90vh)`,
      }}
    >
      {showHandle && (
        <div
          className="map-bottom-sheet-handle"
          role="button"
          tabIndex={0}
          onClick={cycleSnap}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onKeyDown={(e) => e.key === 'Enter' && cycleSnap()}
          aria-label={`Expand sheet (currently ${snap})`}
        >
          <span className="map-bottom-sheet-handle-bar" />
        </div>
      )}
      <div className="map-bottom-sheet-content">{children}</div>
    </div>
  );
}
