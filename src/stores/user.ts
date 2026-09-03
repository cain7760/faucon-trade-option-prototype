import { reactive } from 'vue'

const state = reactive({
  userInfo: { username: 'admin', real_name: '系统管理员' } as {
    username: string
    real_name: string
  } | null,
  loggedIn: true,
})

export function useUserStore() {
  return {
    get userInfo() {
      return state.userInfo
    },
    get isLoggedIn() {
      return state.loggedIn
    },
    hasPermission: (_permission: string) => true,
    async fetchUser() {
      state.userInfo ||= { username: 'admin', real_name: '系统管理员' }
      state.loggedIn = true
      return state.userInfo
    },
    logout() {
      state.loggedIn = false
      state.userInfo = null
    },
  }
}
