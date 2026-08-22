import type { Directive } from 'vue'
import { usePermissionStore } from '@/stores/modules/permission'

export const permission: Directive = {
  mounted(el, binding) {
    const { value } = binding
    const permissionStore = usePermissionStore()
    const buttons = permissionStore.buttons

    if (value && Array.isArray(value)) {
      const hasPermission = value.some((code) => buttons.includes(code))
      if (!hasPermission) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else if (typeof value === 'string') {
      if (!buttons.includes(value)) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    }
  },
}
