import { Component } from '@angular/core';
import { AssetListComponent } from './asset-list/asset-list.component';

@Component({
  selector: 'app-root',
  imports: [AssetListComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
