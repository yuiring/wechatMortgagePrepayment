// app.js
App({
  onLaunch() {
    // 移除了 logs 相关代码
  },
  // V2.0 重构：移除了所有用于页面间导航的 globalData，
  // 避免小程序在后台被销毁后，再次打开时因数据丢失而产生页面错误。
  globalData: {
    // 我们可以保留一个字段，用于在 Tab 页面间临时传递数据
    // 因为 wx.switchTab 不支持传递参数
    tabBarRedirectionData: null
  }
})