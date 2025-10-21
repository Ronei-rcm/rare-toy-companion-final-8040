import { useState, useEffect, useRef } from 'react';

interface TouchPosition {
  x: number;
  y: number;
}

interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
  velocity: number;
}

export const useTouchGestures = (threshold = 50, velocityThreshold = 0.3) => {
  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPosition | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>({
    direction: null,
    distance: 0,
    velocity: 0
  });
  const [isScrolling, setIsScrolling] = useState(false);
  const touchStartTime = useRef<number>(0);

  const minSwipeDistance = threshold;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
    touchStartTime.current = Date.now();
    setIsScrolling(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
    
    const deltaX = Math.abs(currentTouch.x - touchStart.x);
    const deltaY = Math.abs(currentTouch.y - touchStart.y);
    
    // Se o movimento vertical for maior que o horizontal, é scroll
    if (deltaY > deltaX) {
      setIsScrolling(true);
    }
    
    setTouchEnd(currentTouch);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || isScrolling) {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const timeElapsed = Date.now() - touchStartTime.current;
    const velocity = Math.sqrt(distanceX * distanceX + distanceY * distanceY) / timeElapsed;

    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe || isUpSwipe || isDownSwipe) {
      let direction: 'left' | 'right' | 'up' | 'down' | null = null;
      let distance = 0;

      if (Math.abs(distanceX) > Math.abs(distanceY)) {
        // Horizontal swipe
        direction = isLeftSwipe ? 'left' : 'right';
        distance = Math.abs(distanceX);
      } else {
        // Vertical swipe
        direction = isUpSwipe ? 'up' : 'down';
        distance = Math.abs(distanceY);
      }

      setSwipeDirection({
        direction,
        distance,
        velocity
      });

      // Reset after a short delay
      setTimeout(() => {
        setSwipeDirection({
          direction: null,
          distance: 0,
          velocity: 0
        });
      }, 100);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Reset swipe direction when component unmounts
  useEffect(() => {
    return () => {
      setSwipeDirection({
        direction: null,
        distance: 0,
        velocity: 0
      });
    };
  }, []);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    swipeDirection,
    isScrolling
  };
};

export default useTouchGestures;
