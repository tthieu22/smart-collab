/**
 * ScrollController - Manages auto-scroll during drag operations
 *
 * Features:
 * - Single requestAnimationFrame loop for smooth scrolling
 * - Priority system: column scroll first, board scroll as fallback
 * - Proximity-based speed calculation
 * - Proper cleanup on drag end/cancel
 * - Edge detection with scroll validation
 */

interface ScrollTarget {
  container: HTMLElement;
  direction: 'up' | 'down' | 'left' | 'right';
  speed: number;
}

interface PointerPosition {
  x: number;
  y: number;
}

interface ScrollConfig {
  // Edge detection thresholds (pixels from edge)
  verticalThreshold: number;
  horizontalThreshold: number;

  // Speed limits (pixels per frame)
  minSpeed: number;
  maxSpeed: number;

  // Speed calculation zone (pixels)
  // Speed increases from minSpeed to maxSpeed as pointer approaches edge
  speedZone: number;
}

const DEFAULT_CONFIG: ScrollConfig = {
  verticalThreshold: 80,
  horizontalThreshold: 120,
  minSpeed: 2,
  maxSpeed: 20,
  speedZone: 100, // Speed increases over this distance
};

export class ScrollController {
  private rafId: number | null = null;
  private currentTarget: ScrollTarget | null = null;
  private config: ScrollConfig;
  private isActive = false;

  constructor(config: Partial<ScrollConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start scroll loop if not already running
   */
  private startScrollLoop(): void {
    if (this.rafId !== null) return;

    this.isActive = true;
    const scroll = () => {
      if (!this.isActive || !this.currentTarget) {
        this.stop();
        return;
      }

      const { container, direction, speed } = this.currentTarget;

      // Validate container still exists and is scrollable
      if (!container.isConnected) {
        this.stop();
        return;
      }

      // Apply scroll based on direction
      switch (direction) {
        case 'up':
          if (this.canScrollUp(container)) {
            container.scrollTop = Math.max(0, container.scrollTop - speed);
          } else {
            this.stop();
          }
          break;
        case 'down':
          if (this.canScrollDown(container)) {
            container.scrollTop = Math.min(
              container.scrollHeight - container.clientHeight,
              container.scrollTop + speed
            );
          } else {
            this.stop();
          }
          break;
        case 'left':
          if (this.canScrollLeft(container)) {
            container.scrollLeft = Math.max(0, container.scrollLeft - speed);
          } else {
            this.stop();
          }
          break;
        case 'right':
          if (this.canScrollRight(container)) {
            container.scrollLeft = Math.min(
              container.scrollWidth - container.clientWidth,
              container.scrollLeft + speed
            );
          } else {
            this.stop();
          }
          break;
      }

      this.rafId = requestAnimationFrame(scroll);
    };

    this.rafId = requestAnimationFrame(scroll);
  }

  /**
   * Calculate scroll speed based on proximity to edge
   * Closer to edge = faster scroll
   */
  private calculateSpeed(distance: number): number {
    const { minSpeed, maxSpeed, speedZone } = this.config;

    if (distance <= 0) return maxSpeed;
    if (distance >= speedZone) return minSpeed;

    // Linear interpolation: closer = faster
    const ratio = 1 - distance / speedZone;
    return minSpeed + (maxSpeed - minSpeed) * ratio;
  }

  /**
   * Check if container can scroll up
   */
  private canScrollUp(container: HTMLElement): boolean {
    return container.scrollTop > 0;
  }

  /**
   * Check if container can scroll down
   */
  private canScrollDown(container: HTMLElement): boolean {
    return (
      container.scrollTop < container.scrollHeight - container.clientHeight - 1
    );
  }

  /**
   * Check if container can scroll left
   */
  private canScrollLeft(container: HTMLElement): boolean {
    return container.scrollLeft > 0;
  }

  /**
   * Check if container can scroll right
   */
  private canScrollRight(container: HTMLElement): boolean {
    return (
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  }

  /**
   * Update scroll target based on pointer position
   * Returns true if scroll was started/updated, false otherwise
   */
  updateScrollTarget(
    pointer: PointerPosition,
    columnContainer: HTMLElement | null,
    boardContainer: HTMLElement | null,
    isDraggingColumn: boolean
  ): boolean {
    // Stop current scroll if no valid containers
    if (!columnContainer && !boardContainer) {
      this.stop();
      return false;
    }

    // For column drag: only horizontal board scroll
    if (isDraggingColumn) {
      if (!boardContainer) {
        this.stop();
        return false;
      }
      return this.updateBoardScroll(pointer, boardContainer);
    }

    // For card drag: column scroll first (priority), board scroll as fallback
    if (columnContainer) {
      const columnScroll = this.updateColumnScroll(pointer, columnContainer);
      if (columnScroll) {
        // Column scroll active, don't scroll board
        return true;
      }
    }

    // Column cannot scroll or not near edge, try board scroll
    if (boardContainer) {
      return this.updateBoardScroll(pointer, boardContainer);
    }

    // No valid scroll target
    this.stop();
    return false;
  }

  /**
   * Update vertical column scroll
   */
  private updateColumnScroll(
    pointer: PointerPosition,
    container: HTMLElement
  ): boolean {
    const rect = container.getBoundingClientRect();
    const { top, bottom } = rect;
    const { verticalThreshold } = this.config;

    const distanceFromTop = pointer.y - top;
    const distanceFromBottom = bottom - pointer.y;

    // Check top edge
    if (distanceFromTop < verticalThreshold && this.canScrollUp(container)) {
      const speed = this.calculateSpeed(distanceFromTop);
      this.setTarget(container, 'up', speed);
      return true;
    }

    // Check bottom edge
    if (
      distanceFromBottom < verticalThreshold &&
      this.canScrollDown(container)
    ) {
      const speed = this.calculateSpeed(distanceFromBottom);
      this.setTarget(container, 'down', speed);
      return true;
    }

    // Not near edge or cannot scroll
    this.stop();
    return false;
  }

  /**
   * Update horizontal board scroll
   */
  private updateBoardScroll(
    pointer: PointerPosition,
    container: HTMLElement
  ): boolean {
    const rect = container.getBoundingClientRect();
    const { left, right } = rect;
    const { horizontalThreshold } = this.config;

    const distanceFromLeft = pointer.x - left;
    const distanceFromRight = right - pointer.x;

    // Check left edge
    if (
      distanceFromLeft < horizontalThreshold &&
      this.canScrollLeft(container)
    ) {
      const speed = this.calculateSpeed(distanceFromLeft);
      this.setTarget(container, 'left', speed);
      return true;
    }

    // Check right edge
    if (
      distanceFromRight < horizontalThreshold &&
      this.canScrollRight(container)
    ) {
      const speed = this.calculateSpeed(distanceFromRight);
      this.setTarget(container, 'right', speed);
      return true;
    }

    // Not near edge or cannot scroll
    this.stop();
    return false;
  }

  /**
   * Set new scroll target and start loop if needed
   */
  private setTarget(
    container: HTMLElement,
    direction: ScrollTarget['direction'],
    speed: number
  ): void {
    // Only update if target changed
    if (
      this.currentTarget?.container === container &&
      this.currentTarget?.direction === direction
    ) {
      // Update speed only (smooth speed changes)
      this.currentTarget.speed = speed;
      return;
    }

    this.currentTarget = { container, direction, speed };
    this.startScrollLoop();
  }

  /**
   * Stop scrolling immediately
   */
  stop(): void {
    this.isActive = false;
    this.currentTarget = null;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Cleanup on unmount
   */
  destroy(): void {
    this.stop();
  }
}
