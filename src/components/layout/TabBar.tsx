import { useRef, useState, useCallback } from "react";
import { X, Plus } from "lucide-react";
import { useTabStore } from "../../stores/tabStore";
import { useThemeStore } from "../../stores/themeStore";

interface TabBarProps {
  onNewTab: () => void;
}

const AppLogo = () => {
  const theme = useThemeStore((s) => s.theme);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        paddingLeft: 10,
        paddingRight: 14,
        flexShrink: 0,
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="0.5"
          y="0.5"
          width="15"
          height="15"
          stroke={theme.accent}
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M4 11L7 8L4 5"
          stroke={theme.accent}
          strokeWidth="1.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        <line
          x1="9"
          y1="11"
          x2="12"
          y2="11"
          stroke={theme.accent}
          strokeWidth="1.5"
          strokeLinecap="square"
        />
      </svg>
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: theme.textBright,
          letterSpacing: 1.5,
          fontFamily: "var(--font-ui)",
          userSelect: "none",
          textTransform: "uppercase",
        }}
      >
        madsterm
      </span>
    </div>
  );
};

const Separator = () => {
  const theme = useThemeStore((s) => s.theme);
  return (
    <div
      style={{
        width: 1,
        height: 20,
        backgroundColor: theme.tabBorder,
        flexShrink: 0,
        marginRight: 8,
      }}
    />
  );
};

export const TabBar: React.FC<TabBarProps> = ({ onNewTab }) => {
  const { tabs, activeTabId, setActiveTab, removeTab, moveTab } = useTabStore();
  const theme = useThemeStore((s) => s.theme);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);
  const [newTabHovered, setNewTabHovered] = useState(false);

  // Scroll tabs horizontally with mouse wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  }, []);

  const handleDragStart = useCallback((index: number, e: React.DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Make drag image transparent (we show visual feedback via state)
    const img = new Image();
    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";
    e.dataTransfer.setDragImage(img, 0, 0);
  }, []);

  const handleDragOver = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (toIndex: number) => {
      if (dragIndex !== null && dragIndex !== toIndex) {
        moveTab(dragIndex, toIndex);
      }
      setDragIndex(null);
      setDragOverIndex(null);
    },
    [dragIndex, moveTab],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  return (
    <div
      data-tauri-drag-region
      role="tablist"
      aria-label="Terminal tabs"
      style={{
        display: "flex",
        alignItems: "center",
        backgroundColor: theme.statusBarBg,
        borderBottom: `1px solid ${theme.border}`,
        height: 40,
        minHeight: 40,
        overflow: "hidden",
        // Extra padding on macOS to account for traffic light buttons
        paddingLeft: navigator.platform.includes("Mac") ? 80 : 8,
      }}
    >
      <AppLogo />
      <Separator />

      <div
        ref={scrollRef}
        onWheel={handleWheel}
        style={{
          display: "flex",
          alignItems: "center",
          flex: 1,
          overflow: "hidden",
          scrollBehavior: "smooth",
        }}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;
          const isDragging = dragIndex === index;
          const isDragOver = dragOverIndex === index && dragIndex !== index;
          const isHovered = hoveredTabId === tab.id;
          const showClose = isActive || isHovered;

          return (
            <div
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-label={`Tab ${index + 1}: ${tab.title || "Terminal"}`}
              draggable
              onDragStart={(e) => handleDragStart(index, e)}
              onDragOver={(e) => handleDragOver(index, e)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              onClick={() => setActiveTab(tab.id)}
              onMouseDown={(e) => {
                // Middle-click to close tab
                if (e.button === 1) {
                  e.preventDefault();
                  removeTab(tab.id);
                }
              }}
              onMouseEnter={() => setHoveredTabId(tab.id)}
              onMouseLeave={() => setHoveredTabId(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 12px",
                height: 36,
                width: 160,
                flexShrink: 0,
                cursor: "pointer",
                backgroundColor: isActive
                  ? theme.tabActiveBg
                  : isHovered
                    ? theme.bgHover
                    : "transparent",
                borderBottom: isActive ? `2px solid ${theme.accent}` : "2px solid transparent",
                borderLeft: isDragOver ? `2px solid ${theme.accent}` : "2px solid transparent",
                borderTop: "2px solid transparent",
                borderRight: "none",
                borderRadius: 0,
                color: isActive ? theme.textBright : theme.textMuted,
                fontSize: 12,
                fontFamily: "var(--font-ui)",
                whiteSpace: "nowrap",
                marginRight: 2,
                opacity: isDragging ? 0.5 : 1,
                transition: "background-color 0.15s ease, opacity 0.15s ease, color 0.15s ease",
                boxSizing: "border-box",
              }}
            >
              {/* Tab index number */}
              <span
                style={{
                  fontSize: 10,
                  color: theme.textMuted,
                  fontFamily: "var(--font-ui)",
                  flexShrink: 0,
                  minWidth: 10,
                  textAlign: "center",
                  userSelect: "none",
                }}
              >
                {index + 1}
              </span>

              {/* Tab title */}
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  flex: 1,
                }}
              >
                {tab.title || "Terminal"}
              </span>

              {/* Close button */}
              <button
                aria-label={`Close tab ${index + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeTab(tab.id);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  border: "none",
                  background: "transparent",
                  color: theme.textMuted,
                  cursor: "pointer",
                  borderRadius: 0,
                  padding: 0,
                  flexShrink: 0,
                  opacity: showClose ? 0.7 : 0,
                  transition: "opacity 0.15s ease, background-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.opacity = showClose ? "0.7" : "0";
                }}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}

        {/* New Tab Button */}
        <button
          aria-label="New tab"
          title="New tab (Cmd+T)"
          onClick={onNewTab}
          onMouseEnter={() => setNewTabHovered(true)}
          onMouseLeave={() => setNewTabHovered(false)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            border: "none",
            background: newTabHovered ? theme.bgHover : "transparent",
            color: newTabHovered ? theme.textBright : theme.textMuted,
            cursor: "pointer",
            borderRadius: 0,
            marginLeft: 6,
            flexShrink: 0,
            transition: "background-color 0.15s ease, color 0.15s ease",
          }}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};
