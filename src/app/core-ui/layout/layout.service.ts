import { inject, Injectable } from '@angular/core';
import {
  hideAddTaskBar,
  hideIssuePanel,
  hideNonTaskSidePanelContent,
  hideSideNav,
  hideTaskViewCustomizerPanel,
  showAddTaskBar,
  toggleAddTaskBar,
  toggleIssuePanel,
  toggleShowNotes,
  toggleSideNav,
  toggleTaskViewCustomizerPanel,
} from './store/layout.actions';
import { BehaviorSubject, EMPTY, merge, Observable, of } from 'rxjs';
import { select, Store } from '@ngrx/store';
import {
  LayoutState,
  selectIsShowAddTaskBar,
  selectIsShowIssuePanel,
  selectIsShowNotes,
  selectIsShowSideNav,
  selectIsShowTaskViewCustomizerPanel,
} from './store/layout.reducer';
import { filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { BreakpointObserver } from '@angular/cdk/layout';
import { NavigationStart, Router } from '@angular/router';
import { WorkContextService } from '../../features/work-context/work-context.service';
import { selectMiscConfig } from '../../features/config/store/global-config.reducer';

const NAV_ALWAYS_VISIBLE = 1200;
const NAV_OVER_RIGHT_PANEL_NEXT = 800;
const BOTH_OVER = 720;
const XS_MAX = 599;

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private _store$ = inject<Store<LayoutState>>(Store);
  private _router = inject(Router);
  private _workContextService = inject(WorkContextService);
  private _breakPointObserver = inject(BreakpointObserver);

  private _selectedTimeView$ = new BehaviorSubject<'week' | 'month'>('week');
  readonly selectedTimeView$ = this._selectedTimeView$.asObservable();

  isScreenXs$: Observable<boolean> = this._breakPointObserver
    .observe([`(max-width: ${XS_MAX}px)`])
    .pipe(map((result) => result.matches));

  isShowAddTaskBar$: Observable<boolean> = this._store$.pipe(
    select(selectIsShowAddTaskBar),
  );

  isNavAlwaysVisible$: Observable<boolean> = this._breakPointObserver
    .observe([`(min-width: ${NAV_ALWAYS_VISIBLE}px)`])
    .pipe(map((result) => result.matches));
  isRightPanelNextNavOver$: Observable<boolean> = this._breakPointObserver
    .observe([`(min-width: ${NAV_OVER_RIGHT_PANEL_NEXT}px)`])
    .pipe(map((result) => result.matches));
  isRightPanelOver$: Observable<boolean> = this._breakPointObserver
    .observe([`(min-width: ${BOTH_OVER}px)`])
    .pipe(map((result) => !result.matches));
  isNavOver$: Observable<boolean> = this._store$.select(selectMiscConfig).pipe(
    switchMap((miscCfg) => {
      if (miscCfg.isUseMinimalNav) {
        return of(false);
      }
      return this.isRightPanelNextNavOver$.pipe(map((v) => !v));
    }),
  );
  isScrolled$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private _isShowSideNav$: Observable<boolean> = this._store$.pipe(
    select(selectIsShowSideNav),
  );
  isShowSideNav$: Observable<boolean> = this._isShowSideNav$.pipe(
    switchMap((isShow) => {
      return isShow ? of(isShow) : this.isNavAlwaysVisible$;
    }),
  );

  private _isShowNotes$: Observable<boolean> = this._store$.pipe(
    select(selectIsShowNotes),
  );
  isShowNotes$: Observable<boolean> = this._isShowNotes$.pipe();

  private _isShowTaskViewCustomizerPanel$: Observable<boolean> = this._store$.pipe(
    select(selectIsShowTaskViewCustomizerPanel),
  );
  isShowTaskViewCustomizerPanel$: Observable<boolean> =
    this._isShowTaskViewCustomizerPanel$.pipe();

  private _isShowIssuePanel$: Observable<boolean> = this._store$.pipe(
    select(selectIsShowIssuePanel),
  );
  isShowIssuePanel$: Observable<boolean> = this._isShowIssuePanel$.pipe();

  constructor() {
    this.setTimeView('week');

    this.isNavOver$
      .pipe(
        switchMap((isNavOver) =>
          isNavOver
            ? merge(
                this._router.events.pipe(filter((ev) => ev instanceof NavigationStart)),
                this._workContextService.onWorkContextChange$,
              ).pipe(
                withLatestFrom(this._isShowSideNav$),
                filter(([, isShowSideNav]) => isShowSideNav),
              )
            : EMPTY,
        ),
      )
      .subscribe(() => {
        this.hideSideNav();
      });
  }

  showAddTaskBar(): void {
    this._store$.dispatch(showAddTaskBar());
  }

  hideAddTaskBar(): void {
    this._store$.dispatch(hideAddTaskBar());
  }

  toggleAddTaskBar(): void {
    this._store$.dispatch(toggleAddTaskBar());
  }

  toggleSideNav(): void {
    this._store$.dispatch(toggleSideNav());
  }

  hideSideNav(): void {
    this._store$.dispatch(hideSideNav());
  }

  toggleNotes(): void {
    this._store$.dispatch(toggleShowNotes());
  }

  hideNotes(): void {
    this._store$.dispatch(hideNonTaskSidePanelContent());
  }

  toggleAddTaskPanel(): void {
    this._store$.dispatch(toggleIssuePanel());
  }

  hideAddTaskPanel(): void {
    this._store$.dispatch(hideIssuePanel());
  }

  getSelectedTimeView(): 'week' | 'month' {
    return this._selectedTimeView$.value;
  }

  setTimeView(view: 'week' | 'month'): void {
    this._selectedTimeView$.next(view);
  }

  toggleTaskViewCustomizerPanel(): void {
    this._store$.dispatch(toggleTaskViewCustomizerPanel());
  }

  hideTaskViewCustomizerPanel(): void {
    this._store$.dispatch(hideTaskViewCustomizerPanel());
  }
}
