import { createAction, props } from '@ngrx/store';

export const tabDataLoaded = createAction('[Tabs] Tab Data Loaded', props<{ tabId: string, data: any }>());

export const tabDataClear = createAction('[Tabs] Clear Tab Data');