// pages/profile/profile.js
Page({
  data: {
    userInfo: null,
    canIUseGetUserProfile: wx.canIUse('getUserProfile')
  },
  onLoad: function() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
  },
  getUserProfile: function(e) {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        this.setData({ userInfo: res.userInfo });
        wx.setStorageSync('userInfo', res.userInfo);
      }
    })
  },
  clearStorage: function() {
    wx.showModal({
      title: '确认操作',
      content: '这将清除您的计算历史和个人信息，确定吗？',
      success: (res) => {
        if(res.confirm) {
          wx.clearStorageSync();
          this.setData({ userInfo: null });
          wx.showToast({ title: '已退出登录' });
        }
      }
    })
  }
});