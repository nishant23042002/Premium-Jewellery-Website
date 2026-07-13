import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Cross-cutting UI state that genuinely benefits from Redux's devtools/
 * predictability (things multiple, unrelated parts of the tree read and
 * write) — e.g. the mega menu / cart-drawer-equivalent shortlist drawer.
 * Purely local, single-component state stays as useState; ephemeral
 * client-only widgets (mobile nav open, cursor variant) live in Zustand
 * instead (store/zustand) since they don't need Redux's ceremony.
 */
export interface UiState {
  isShortlistDrawerOpen: boolean;
  activeMegaMenu: string | null;
}

const initialState: UiState = {
  isShortlistDrawerOpen: false,
  activeMegaMenu: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openShortlistDrawer(state) {
      state.isShortlistDrawerOpen = true;
    },
    closeShortlistDrawer(state) {
      state.isShortlistDrawerOpen = false;
    },
    setActiveMegaMenu(state, action: PayloadAction<string | null>) {
      state.activeMegaMenu = action.payload;
    },
  },
});

export const { openShortlistDrawer, closeShortlistDrawer, setActiveMegaMenu } =
  uiSlice.actions;
export default uiSlice.reducer;
