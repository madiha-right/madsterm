import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNotificationStore } from "../notificationStore";

describe("notificationStore", () => {
  beforeEach(() => {
    useNotificationStore.setState({ notifications: [] });
    vi.useFakeTimers();
  });

  it("should add a notification", () => {
    useNotificationStore.getState().addNotification({
      type: "error",
      message: "Something went wrong",
    });
    expect(useNotificationStore.getState().notifications).toHaveLength(1);
    expect(useNotificationStore.getState().notifications[0].message).toBe("Something went wrong");
  });

  it("should remove a notification", () => {
    useNotificationStore.getState().addNotification({
      type: "info",
      message: "Hello",
      duration: 0,
    });
    const id = useNotificationStore.getState().notifications[0].id;
    useNotificationStore.getState().removeNotification(id);
    expect(useNotificationStore.getState().notifications).toHaveLength(0);
  });

  it("should auto-dismiss after duration", () => {
    useNotificationStore.getState().addNotification({
      type: "success",
      message: "Done",
      duration: 3000,
    });
    expect(useNotificationStore.getState().notifications).toHaveLength(1);

    vi.advanceTimersByTime(3000);
    expect(useNotificationStore.getState().notifications).toHaveLength(0);
  });
});
