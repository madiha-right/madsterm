import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { type Notification, useNotificationStore } from "../../stores/notificationStore";
import { useThemeStore } from "../../stores/themeStore";

const iconMap = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const colorMap = {
  error: "#ff6b6b",
  warning: "#ffa94d",
  info: "#74c0fc",
  success: "#69db7c",
};

const ToastItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  const theme = useThemeStore((s) => s.theme);
  const removeNotification = useNotificationStore((s) => s.removeNotification);
  const Icon = iconMap[notification.type];
  const color = colorMap[notification.type];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        padding: "10px 12px",
        backgroundColor: theme.bgSurface,
        border: `1px solid ${theme.border}`,
        borderLeft: `3px solid ${color}`,
        minWidth: 280,
        maxWidth: 400,
        fontSize: 12,
        color: theme.text,
        fontFamily: "var(--font-ui)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      <Icon size={14} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ flex: 1, lineHeight: "18px", wordBreak: "break-word" }}>
        {notification.message}
      </span>
      <button
        onClick={() => removeNotification(notification.id)}
        style={{
          background: "none",
          border: "none",
          color: theme.textMuted,
          cursor: "pointer",
          padding: 0,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
        }}
      >
        <X size={12} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const notifications = useNotificationStore((s) => s.notifications);

  if (notifications.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        right: 12,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 9999,
        pointerEvents: "auto",
      }}
    >
      {notifications.map((n) => (
        <ToastItem key={n.id} notification={n} />
      ))}
    </div>
  );
};
