import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  },
  {
    path: 'entry',
    loadComponent: () => import('./components/score-entry/score-entry.component').then(m => m.ScoreEntryComponent)
  },
  {
    path: 'history',
    loadComponent: () => import('./components/score-history/score-history.component').then(m => m.ScoreHistoryComponent)
  },
  {
    path: 'course-lookup',
    loadComponent: () => import('./components/course-lookup/course-lookup.component').then(m => m.CourseLookupComponent)
  },
  {
    path: 'score/:id/edit',
    loadComponent: () => import('./components/score-edit/score-edit.component').then(m => m.ScoreEditComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
