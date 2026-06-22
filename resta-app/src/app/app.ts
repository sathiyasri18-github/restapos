import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {  MenuItem } from 'primeng/api';
import { AppModule } from './module/app.module';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('system-service');

    items: MenuItem[] = [];
    sidebarItems: MenuItem[] = [];

  ngOnInit() {

    this.items = [
      {
        label: 'Dashboard',
        icon: 'pi pi-home'
      },
      {
        label: 'Settings',
        icon: 'pi pi-cog'
      }
    ];

    this.sidebarItems = [
      {
        label: 'Products',
        icon: 'pi pi-box',
        items: [
          {
            label: 'Add Product',
            icon: 'pi pi-plus'
          },
          {
            label: 'List Products',
            icon: 'pi pi-list'
          }
        ]
      },
      {
        label: 'Users',
        icon: 'pi pi-users'
      }
    ];
  }
}
