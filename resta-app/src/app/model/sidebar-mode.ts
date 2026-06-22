// sidebar-menu.model.ts

export interface SidebarMenu {
    label: string;
    icon: string;
    routerLink?: string;
    children?: SidebarMenu[];
    expanded?: boolean;
}