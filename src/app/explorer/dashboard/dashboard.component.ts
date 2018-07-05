import { Component, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';

import { CypherService } from '../../charts/cypher.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  transactions: Transaction[] = [];

  columnsToDisplay = ["image", "txid", "time"];

  txCount24h: number;
  instantSendTxCount24h: number;
  privateSendTxCount24h: number;
  hashRate24h: number;

  private pstype2img = {
    0:"png2/64x64/dual_color/tx.png",
    1:"png2/64x64/create_denominations.png",
    2:"png2/64x64/private_send.png",
    3:"png2/64x64/dual_color/tx.png",//no image for 100.0
    4:"png2/64x64/dual_color/private_send_10-0_black.png",
    5:"png2/64x64/dual_color/private_send_1-0_black.png",
    6:"png2/64x64/dual_color/private_send_0-1_black.png",
    7:"png2/64x64/dual_color/private_send_0-01_black.png"
  };

  interval: Subscription;
  mempoolSub: Subscription;

  constructor(private cypherService: CypherService) { }

  ngOnDestroy() {
    if (this.interval !== undefined) this.interval.unsubscribe();
    if (this.mempoolSub !== undefined) this.mempoolSub.unsubscribe();
  }  


  updateTransactions(newTxArray: Transaction[]) {
    let oldtxids: string[] = this.transactions.map(e => e.txid);
    let newtxids: string[] = newTxArray.map(e => e.txid);
    let addTransactions: Transaction[] = newTxArray.filter(tx => !oldtxids.includes(tx.txid));
    let keepTransations: Transaction[] = this.transactions.filter(tx => newtxids.includes(tx.txid));
    this.transactions = addTransactions.concat(keepTransations);
  }

  load24hStats() {
    let txQuery: string = "OPTIONAL MATCH (tx:Transaction)-[:INCLUDED_IN]->(b:Block) "+
    "WHERE b.time >= datetime().epochSeconds-86400 "+
    "WITH count(tx) as confirmedTxCount "+
    "OPTIONAL MATCH (tx:Transaction)-[:INCLUDED_IN]->(:Mempool) "+
    "WHERE tx.receivedTime >= datetime().epochSeconds-86400 "+
    "RETURN confirmedTxCount+count(tx) as txcount;"

    let instantSendQuery: string = "OPTIONAL MATCH (tx:Transaction)-[:INCLUDED_IN]->(b:Block) "+
    "WHERE b.time >= datetime().epochSeconds-86400 AND tx.txlock=true "+
    "WITH count(tx) as confirmedTxCount "+
    "OPTIONAL MATCH (tx:Transaction)-[:INCLUDED_IN]->(:Mempool) "+
    "WHERE tx.receivedTime >= datetime().epochSeconds-86400 AND tx.txlock=true "+
    "RETURN confirmedTxCount+count(tx) as txcount;"

    let privateSendQuery: string = "OPTIONAL MATCH (tx:Transaction)-[:INCLUDED_IN]->(b:Block) "+
    "WHERE b.time >= datetime().epochSeconds-86400 AND tx.pstype=2 "+
    "WITH count(tx) as confirmedTxCount "+
    "OPTIONAL MATCH (tx:Transaction)-[:INCLUDED_IN]->(:Mempool) "+
    "WHERE tx.receivedTime >= datetime().epochSeconds-86400 AND tx.pstype=2 "+
    "RETURN confirmedTxCount+count(tx) as txcount;"

    let hashrateQuery: string = "MATCH (b:Block) "+
    "WHERE b.time >= datetime().epochSeconds-86400 "+
    "RETURN avg(b.difficulty) * (2^32) / (86400/count(b)) as hashrate;"

    this.cypherService.executeQuery(txQuery, {}).subscribe(e => {
      this.txCount24h = e.data[0][0];
    });

    this.cypherService.executeQuery(instantSendQuery, {}).subscribe(e => {
      this.instantSendTxCount24h = e.data[0][0];
    });

    this.cypherService.executeQuery(privateSendQuery, {}).subscribe(e => {
      this.privateSendTxCount24h = e.data[0][0];
    });

    this.cypherService.executeQuery(hashrateQuery, {}).subscribe(e => {
      this.hashRate24h = e.data[0][0]/Math.pow(10, 15);
    });
  }

  loadUnconfirmedTransactions() {
    let query: string = "MATCH (tx:Transaction)-[INCLUDED_IN]->(:Mempool) RETURN tx.txid as txid, tx.receivedTime as time, tx.pstype as pstype, tx.txlock as txlock ORDER BY time DESC;"
    if (this.mempoolSub == undefined || this.mempoolSub.closed) {
      this.mempoolSub = this.cypherService.executeQuery(query, {}).subscribe(e => {
        let newTxs = e.data.map(row => {
          let pstype: number = row[2];
          let txlock: boolean = row[3];
          let image: string;
          if (txlock && pstype === 2) {
            image = "png2/64x64/private_instant_send.png";
          } else if (txlock && pstype === 0) {
            image = "SVG/instantx_black.svg";
          } else {
            image = this.pstype2img[pstype];
          }
          return {txid: row[0], time: row[1], pstype: row[2], image:image};
        });
        this.updateTransactions(newTxs);
      });
    }
  }

  ngOnInit() {

    this.interval = Observable.interval(2000).pipe(startWith(0)).subscribe((sequence) => {
      this.loadUnconfirmedTransactions();
      if (sequence%30 == 0) {
        this.load24hStats();
      }
    });
  }

}

export interface Transaction {
  txid: string, 
  time: number, 
  pstype: number, 
  image: string
}
