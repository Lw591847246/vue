import authRequest from '../index'

// 菜单项类型（根据真实数据调整）
export interface MenuItem {
  id: number
  parentId: number
  name: string
  code: string
  level: number
  type?: number | null
  menuType?: string | null
  path?: string | null
  component?: string | null
  icon?: string | null
  sort?: number | null
  status?: string | null
  children?: MenuItem[] | null
}

// 子系统类型
export interface Subsystem {
  systemName: string
  systemCode: string
  description: string
  baseUrl: string
  logo: string | null
}

// 权限接口返回的数据结构
export interface PermissionData {
  routes: MenuItem[] // 菜单树（含根节点）
  buttons: string[] // 按钮权限码
  subsystems: Subsystem[] // 外部子系统列表
}

// 获取当前用户权限信息
export function getPermission(userId: number) {
  return authRequest.get<PermissionData>('/front/v1/menu/user/list', {
    params: { userId },
  })
}
