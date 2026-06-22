import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './sidebar/sidebar';
import { TopHeader } from './header/header';
import { LayoutService } from '../services/layout.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Sidebar, TopHeader],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  readonly layout = inject(LayoutService);
}
