import { useEffect } from "react";
import { List, useListRef } from "react-window";
import type { FileNode } from "../../types";
import { FileTreeItem } from "./FileTreeItem";

interface FileTreeProps {
  items: { node: FileNode; depth: number }[];
  focusedIndex: number;
  expandedPaths: Set<string>;
  onItemClick: (index: number) => void;
}

const ITEM_HEIGHT = 26;

interface RowProps {
  items: { node: FileNode; depth: number }[];
  focusedIndex: number;
  expandedPaths: Set<string>;
  onItemClick: (index: number) => void;
}

function FileRow({
  index,
  style,
  items,
  focusedIndex,
  expandedPaths,
  onItemClick,
}: {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
} & RowProps) {
  const item = items[index];
  if (!item) return null;
  return (
    <div style={style}>
      <FileTreeItem
        node={item.node}
        depth={item.depth}
        isFocused={index === focusedIndex}
        isExpanded={expandedPaths.has(item.node.path)}
        onClick={() => onItemClick(index)}
      />
    </div>
  );
}

export const FileTree: React.FC<FileTreeProps> = ({
  items,
  focusedIndex,
  expandedPaths,
  onItemClick,
}) => {
  const listRef = useListRef(null);

  // Scroll focused item into view
  useEffect(() => {
    if (listRef.current && focusedIndex >= 0 && focusedIndex < items.length) {
      listRef.current.scrollToRow({ index: focusedIndex, align: "smart" });
    }
  }, [focusedIndex, listRef, items.length]);

  return (
    <List<RowProps>
      listRef={listRef}
      rowComponent={FileRow}
      rowCount={items.length}
      rowHeight={ITEM_HEIGHT}
      rowProps={{ items, focusedIndex, expandedPaths, onItemClick }}
      overscanCount={10}
      style={{ width: "100%", height: "100%" }}
    />
  );
};
