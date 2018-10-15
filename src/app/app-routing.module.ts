import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

export const routes: Routes = [
  { path: 'charts', loadChildren: './charts/charts.module#ChartsModule' },
  { path: 'explorer', loadChildren: './explorer/explorer.module#ExplorerModule' },
  { path: 'nodes', loadChildren: './nodes/nodes.module#NodesModule' },
  { path: 'cypher', redirectTo: '/charts/editor?query=:query', pathMatch: 'prefix'},
  { path: '', loadChildren: './graph/graph.module#GraphModule' },
  { path: '**', component: PageNotFoundComponent }
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}