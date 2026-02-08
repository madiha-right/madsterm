import { FileTreeItem } from "./FileTreeItem";
import { FileNode } from "../../types";

interface FileTreeProps {
  items: { node: FileNode; depth: number }[];
  focusedIndex: number;
  expandedPaths: Set<string>;
  onItemClick: (index: number) => void;
}

// Note: For very large directories (1000+ visible items), consider adding
// windowed/virtualized rendering via react-window or @tanstack/virtual.
// The current flat-list approach works well for typical project sizes.

export const FileTree: React.FC<FileTreeProps> = ({
  items,
  focusedIndex,
  expandedPaths,
  onItemClick,
}) => {
  return (
    <div>
      {items.map((item, index) => (
        <FileTreeItem
          key={item.node.path}
          node={item.node}
          depth={item.depth}
          isFocused={index === focusedIndex}
          isExpanded={expandedPaths.has(item.node.path)}
          onClick={() => onItemClick(index)}
        />
      ))}
    </div>
  );
};
