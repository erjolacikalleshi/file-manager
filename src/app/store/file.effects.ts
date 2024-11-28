import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';
import { tabDataClear } from './file.actions'; 

@Injectable()
export class FileEffects {

  clearTabData$ = createEffect(() => this.actions$.pipe(
    ofType('[Tabs] Tab Data Loaded'), 
    delay(3600000), 
    map(() => {
        return tabDataClear()}), 
    catchError(() => of({ type: 'Error in clearing tab data' })) 
  ));

  constructor(
    private actions$: Actions,
    private store: Store
  ) {}
}