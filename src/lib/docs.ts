/**
 * Shared types for documentation. 
 * This file is safe to import in both browser and server code.
 */

/* --------------------------------------------- 
 * 递归的 Sidebar 节点类型
 * --------------------------------------------- */
export type SidebarItem = {
  title: string;
  slug?: string;
  _path: string; // 内部用于唯一匹配路径
  order: number;
  items?: SidebarItem[];
};

export type Group = SidebarItem;
