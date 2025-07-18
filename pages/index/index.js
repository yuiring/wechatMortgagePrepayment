// pages/index/index.js
const calculator = require('../../utils/calculator.js');
const util = require('../../utils/util.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // Picker 选择器的数据源
    termRange: Array.from({length: 26}, (v, k) => k + 5),
    // Picker 当前选择的索引
    termIndex: 25,
    // 贷款利率
    rate: 3.95,
    // 用于日期选择器的边界值
    today: '',
    startDate: '',
    prepaymentDate: '',
    farFutureDate: '2099-12-31',
    // 将输入框数据统一管理，便于整体操作
    formData: {
      totalAmount: null,
      prepaymentAmount: null
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    // 初始化日期选择器的默认值
    const today = util.formatDate(new Date());
    const oneYearAgo = util.formatDate(new Date(new Date().setFullYear(new Date().getFullYear() - 1)));
    this.setData({
      today: today,
      startDate: oneYearAgo,
      prepaymentDate: today
    });
  },

  /**
   * 生命周期函数--监听页面显示
   * onShow 会在每次页面展示时触发，包括从其他Tab切换回来
   */
  onShow: function() {
    // 检查全局是否有从历史页通过 TabBar 跳转传递过来的数据
    const app = getApp();
    if (app.globalData.tabBarRedirectionData) {
      const dataToLoad = app.globalData.tabBarRedirectionData;
      // 将历史数据填充到表单中
      this.setData({
        'formData.totalAmount': dataToLoad.formData.totalAmount,
        'formData.prepaymentAmount': dataToLoad.formData.prepaymentAmount,
        termIndex: this.data.termRange.indexOf(dataToLoad.loanTerm),
        rate: dataToLoad.rate,
        startDate: dataToLoad.startDate,
        prepaymentDate: dataToLoad.prepaymentDate,
      });
      // 数据使用后立即清空，防止下次切换时重复加载
      app.globalData.tabBarRedirectionData = null;
      wx.showToast({ title: '已载入历史数据', icon: 'none' });
    }
  },

  /**
   * 贷款年限 Picker 改变事件
   */
  bindTermChange: function(e) {
    this.setData({
      termIndex: e.detail.value
    });
  },

  /**
   * 贷款利率输入事件
   */
  bindRateInput: function(e) {
    this.setData({
      rate: e.detail.value
    });
  },

  /**
   * 日期 Picker 改变事件
   */
  bindDateChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [field]: e.detail.value
    });
  },
  
  /**
   * 统一处理输入框事件，将值同步到 formData 中
   */
  handleInput: function(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  /**
   * 点击“一键智能分析”按钮
   */
  onCalculate(e) {
    const values = this.data.formData;
    
    // 校验所有必填项
    if (!values.totalAmount || !this.data.rate || !values.prepaymentAmount) {
      wx.showToast({ title: '请填写所有必填项', icon: 'none' });
      return;
    }
    
    // 校验日期逻辑
    const monthsPaid = util.getMonthsDifference(this.data.startDate, this.data.prepaymentDate);
    if (monthsPaid < 0) {
      wx.showToast({ title: '计划还款时间不能早于首次还款时间', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '智能分析中...', mask: true });

    // 使用 setTimeout 确保 Loading 提示有时间渲染
    setTimeout(() => {
      // 准备传递给计算核心的参数
      const params = {
        totalAmount: parseFloat(values.totalAmount) * 10000,
        loanTerm: this.data.termRange[this.data.termIndex] * 12,
        rate: parseFloat(this.data.rate) / 100 / 12,
        monthsPaid: monthsPaid,
        prepaymentAmount: parseFloat(values.prepaymentAmount) * 10000,
      };
      
      // 调用核心算法
      const results = calculator.analyze(params);
      wx.hideLoading();

      if (results.error) {
        wx.showToast({ title: results.error, icon: 'none', duration: 2000 });
        return;
      }
      
      // 将本次计算存入历史记录
      this.saveToHistory({
        formData: values,
        loanTerm: this.data.termRange[this.data.termIndex],
        rate: this.data.rate,
        startDate: this.data.startDate,
        prepaymentDate: this.data.prepaymentDate,
        results: results
      });
      
      // 准备通过URL传递给结果页的数据
      const resultsStr = encodeURIComponent(JSON.stringify(results));
      const prepaymentAmount = values.prepaymentAmount; // 额外传递还款额用于投资分析

      // 使用 setTimeout 增强导航稳定性，防止页面跳转错误
      setTimeout(() => {
        wx.navigateTo({
          url: `/pages/result/result?results=${resultsStr}&prepaymentAmount=${prepaymentAmount}`
        });
      }, 100);

    }, 100);
  },

  /**
   * 保存计算记录到本地存储
   */
  saveToHistory(record) {
    const history = wx.getStorageSync('calculation_history') || [];
    const newRecord = {
      id: Date.now(), // 使用时间戳作为简单唯一ID
      date: util.formatDate(new Date()),
      ...record
    };
    // 将新记录插入到数组开头
    history.unshift(newRecord);
    // 只保留最近20条记录
    if (history.length > 20) {
      history.pop();
    }
    wx.setStorageSync('calculation_history', history);
  },
});
