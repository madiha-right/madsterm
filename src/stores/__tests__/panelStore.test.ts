import { beforeEach, describe, expect, it } from "vitest";
import { usePanelStore } from "../panelStore";

describe("panelStore", () => {
  beforeEach(() => {
    usePanelStore.setState({
      leftPanelVisible: true,
      rightPanelVisible: false,
      settingsOpen: false,
      focusedPanel: "terminal",
    });
  });

  it("should toggle left panel and update focused panel", () => {
    usePanelStore.getState().toggleLeftPanel();
    let state = usePanelStore.getState();
    expect(state.leftPanelVisible).toBe(false);
    expect(state.focusedPanel).toBe("terminal");

    usePanelStore.getState().toggleLeftPanel();
    state = usePanelStore.getState();
    expect(state.leftPanelVisible).toBe(true);
    expect(state.focusedPanel).toBe("explorer");
  });

  it("should toggle right panel and update focused panel", () => {
    usePanelStore.getState().toggleRightPanel();
    let state = usePanelStore.getState();
    expect(state.rightPanelVisible).toBe(true);
    expect(state.focusedPanel).toBe("diff");

    usePanelStore.getState().toggleRightPanel();
    state = usePanelStore.getState();
    expect(state.rightPanelVisible).toBe(false);
    expect(state.focusedPanel).toBe("terminal");
  });

  it("should open and close settings", () => {
    usePanelStore.getState().setSettingsOpen(true);
    expect(usePanelStore.getState().settingsOpen).toBe(true);

    usePanelStore.getState().setSettingsOpen(false);
    expect(usePanelStore.getState().settingsOpen).toBe(false);
  });

  it("should set focused panel", () => {
    usePanelStore.getState().setFocusedPanel("explorer");
    expect(usePanelStore.getState().focusedPanel).toBe("explorer");

    usePanelStore.getState().setFocusedPanel("diff");
    expect(usePanelStore.getState().focusedPanel).toBe("diff");
  });
});
