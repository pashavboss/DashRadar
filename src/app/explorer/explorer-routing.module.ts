import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AddressComponent } from './../addresses/address/address.component';
import { BlockComponent } from './../blocks/block/block.component';
import { BlocksTable2Component } from './../blocks/blocks-table2/blocks-table2.component';
import { TransactionComponent } from './../transactions/transaction/transaction.component';
import { ExplorerComponent } from './explorer.component';

const routes: Routes = [
	{ path: '', component: ExplorerComponent, children: [
    { path: '', component: BlocksTable2Component },
    { path: 'blocks', component: BlocksTable2Component },
    { path: 'blocks/:hash',   component: BlockComponent },
    { path: 'tx/:txid', component: TransactionComponent},
    { path: 'address/:addr', component: AddressComponent},
  ] },
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExplorerRoutingModule { }
