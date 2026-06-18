import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: "history",
        loadComponent: () => import('./components/history/history').then(m => m.History)
    },
    {
        path: "compare",
        loadComponent: () => import('./components/compare/compare').then(m => m.Compare)
    },
    {
        path: "favorites",
        loadComponent: () => import('./components/favorites/favorites').then(m => m.Favorites)
    },
    {
        path: "log",
        loadComponent: () => import('./components/log/log').then(m => m.Log)
    },
    {
        path: "**",
        redirectTo: "history",
        pathMatch: "full"
    }
];
