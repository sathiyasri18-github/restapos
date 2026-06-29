import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarMenu } from '../../model/sidebar-mode';
import { LayoutService } from '../../services/layout.service';
import { MenuService } from '../../services/menu.service';

interface MenuTreeNode {
  id: number;
  parentMenuId: number | null;
  menuCode: string;
  menuName: string;
  routePath: string | null;
  icon: string | null;
  sortOrder: number;
  children?: MenuTreeNode[];
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar implements OnInit {
  readonly layout = inject(LayoutService);
  private readonly menuService = inject(MenuService);

  menuItems: SidebarMenu[] = [];
  isLoadingMenus = true;
  menuLoadError = false;

  ngOnInit(): void {
    const cached = this.menuService.getCachedMyTree();
    if (cached != null) {
      this.applyMenuTree(cached);
      this.isLoadingMenus = false;
    }
    this.loadMenus();
  }

  loadMenus(): void {
    if (!this.menuItems.length) {
      this.isLoadingMenus = true;
    }
    this.menuLoadError = false;

    this.menuService.loadMyTree().subscribe({
      next: (res) => {
        this.applyMenuTree(res);
        this.isLoadingMenus = false;
      },
      error: () => {
        if (!this.menuItems.length) {
          this.menuItems = [];
          this.menuLoadError = true;
        }
        this.isLoadingMenus = false;
      }
    });
  }

  private applyMenuTree(res: unknown): void {
    const tree = Array.isArray(res) ? res : Array.isArray((res as { items?: unknown[] })?.items) ? (res as { items: MenuTreeNode[] }).items : [];
    this.menuItems = this.mapTree(tree);
  }

  private mapTree(nodes: MenuTreeNode[]): SidebarMenu[] {
    return nodes.map(node => this.mapNode(node));
  }

  private mapNode(node: MenuTreeNode): SidebarMenu {
    const children = node.children?.length
      ? node.children.map(child => this.mapNode(child))
      : undefined;

    const hasChildren = !!children?.length;
    const route = node.routePath?.startsWith('/') ? node.routePath : node.routePath ? `/${node.routePath}` : undefined;

    return {
      label: node.menuName,
      icon: this.resolveIcon(node),
      routerLink: hasChildren ? undefined : route,
      expanded: false,
      children: hasChildren ? children : undefined,
    };
  }

  private resolveIcon(node: MenuTreeNode): string {
    const raw = node.icon ?? (node as { Icon?: string | null }).Icon;
    const icon = raw?.trim();
    return icon || 'pi pi-circle';
  }

  iconClasses(menu: SidebarMenu, depth: number): string {
    const sizeClass = depth === 0 ? 'menu-icon' : 'menu-icon-child';
    return `${menu.icon} ${sizeClass}`.trim();
  }

  toggleMenu(menu: SidebarMenu): void {
    menu.expanded = !menu.expanded;
  }

  trackMenu(_index: number, menu: SidebarMenu): string {
    return `${menu.label}-${menu.routerLink ?? ''}`;
  }
}
