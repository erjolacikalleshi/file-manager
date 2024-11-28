import { createReducer, on } from '@ngrx/store';
import { tabDataClear, tabDataLoaded } from './file.actions';

export interface TabState {
  [tabId: string]: {
    data: any;
  };
}

export const initialState: TabState = {};

export const fileReducer = createReducer(
    initialState,
    on(tabDataLoaded, (state, action) => ({
        ...state,
        [action.tabId]: {
        data: action.data
        }
    })),
    on(tabDataClear, (state, action) => initialState)
    
);