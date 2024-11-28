import { createFeatureSelector, createSelector } from "@ngrx/store";
import { TabState } from "./file.reducer";

export const selectTabState = createFeatureSelector<TabState>('file');

export const selectTabData = createSelector(
  selectTabState,
  (state: TabState) => state
);
