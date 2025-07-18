// utils/calculator.js
// V2.2 算法升级: 返回更丰富的财务数据
/**
 * 内部收益率 (IRR) 计算函数 (牛顿迭代法)
 * @param {number[]} cashFlows - 现金流数组, 第一个为负数投资
 * @returns {number} - 年化IRR (百分比)
 */
function calculateIRR(cashFlows) {
  const maxIterations = 1000;
  const tolerance = 1e-7;
  let guess = 0.005; // 月利率初始猜测值

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0.0;
    let derivative = 0.0;
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + guess, t);
      if (t > 0) {
        derivative -= t * cashFlows[t] / Math.pow(1 + guess, t + 1);
      }
    }
    if (Math.abs(derivative) < tolerance) break;
    const newGuess = guess - npv / derivative;
    if (Math.abs(newGuess - guess) < tolerance) {
      guess = newGuess;
      break;
    }
    guess = newGuess;
  }
  return (Math.pow(1 + guess, 12) - 1) * 100;
}


/**
 * 主分析函数
 * @param {object} params - 输入参数
 */
function analyze(params) {
  try {
    const scenarios = {};
    const methods = [{ key: 'AC', name: '等额本息' }, { key: 'AP', name: '等额本金' }];
    const options = [{ key: 'shortenTerm', name: '缩短期限' }, { key: 'reducePayment', name: '减少月供' }];

    methods.forEach(method => {
      options.forEach(option => {
        const scenarioKey = `${method.key}_${option.key}`;
        const result = calculateSingleScenario({ ...params, repaymentMethod: method.key, prepaymentOption: option.key });
        if (result && !result.error) {
          result.leverage = params.prepaymentAmount > 0 ? (result.interestSaved / (params.prepaymentAmount / 10000)).toFixed(2) : '0.00';
          scenarios[scenarioKey] = { ...result, name: `${method.name} · ${option.name}` };
        }
      });
    });
    return scenarios;
  } catch (e) {
    console.error("计算出错:", e);
    return { error: "计算发生未知错误，请检查输入" };
  }
}

/**
 * 单个场景计算（内部函数）
 */
function calculateSingleScenario(params) {
  const { totalAmount, loanTerm, rate, monthsPaid, prepaymentAmount, repaymentMethod, prepaymentOption } = params;
  
  // 1. 计算原始方案
  let originalFutureCashFlow = [];
  let originalTotalInterest = 0;
  let remainingPrincipal = 0;
  let alreadyPaidInterest = 0;
  const originalRemainingTerm = loanTerm - monthsPaid;

  if (repaymentMethod === 'AC') {
    const monthlyPayment = totalAmount * rate * Math.pow(1 + rate, loanTerm) / (Math.pow(1 + rate, loanTerm) - 1);
    originalTotalInterest = monthlyPayment * loanTerm - totalAmount;
    remainingPrincipal = totalAmount * (Math.pow(1 + rate, loanTerm) - Math.pow(1 + rate, monthsPaid)) / (Math.pow(1 + rate, loanTerm) - 1);
    alreadyPaidInterest = monthlyPayment * monthsPaid - (totalAmount - remainingPrincipal);
    for(let i=0; i < originalRemainingTerm; i++) originalFutureCashFlow.push(monthlyPayment);
  } else { // AP
    const monthlyPrincipalPayment = totalAmount / loanTerm;
    let tempPrincipal = totalAmount;
    for (let i = 1; i <= loanTerm; i++) {
        const interest = tempPrincipal * rate;
        originalTotalInterest += interest;
        if (i <= monthsPaid) {
            alreadyPaidInterest += interest;
        } else {
            originalFutureCashFlow.push(monthlyPrincipalPayment + interest);
        }
        tempPrincipal -= monthlyPrincipalPayment;
    }
    remainingPrincipal = totalAmount - monthlyPrincipalPayment * monthsPaid;
  }
  const originalFuturePayment = originalFutureCashFlow.reduce((a, b) => a + b, 0);
  const originalRemainingInterest = originalFuturePayment - remainingPrincipal;

  // 2. 处理提前还款
  if (prepaymentAmount >= remainingPrincipal) {
    const finalInterestSaved = originalTotalInterest - alreadyPaidInterest;
    return {
      interestSaved: finalInterestSaved.toFixed(2),
      newMonthlyPayment: '0.00', newTerm: 0, irr: 'N/A', schedule: [],
      originalFuturePayment: originalFuturePayment.toFixed(2),
      newFuturePayment: '0.00',
      termSaved: originalRemainingTerm
    };
  }

  const newPrincipal = remainingPrincipal - prepaymentAmount;
  
  // 3. 计算新方案
  let newTerm = 0;
  let newFutureCashFlow = [];
  let newAmortizationSchedule = [];

  if (prepaymentOption === 'shortenTerm') {
      if (repaymentMethod === 'AC') {
        const originalMonthlyPayment = originalFutureCashFlow[0];
        newTerm = Math.ceil(Math.log(originalMonthlyPayment / (originalMonthlyPayment - newPrincipal * rate)) / Math.log(1 + rate));
      } else {
        const monthlyPrincipal = totalAmount / loanTerm;
        newTerm = Math.ceil(newPrincipal / monthlyPrincipal);
      }
  } else {
      newTerm = originalRemainingTerm;
  }

  // 生成新方案的还款计划和现金流
  let tempNewPrincipal = newPrincipal;
  if(isFinite(newTerm)){
    for(let i=1; i<=newTerm; i++) {
        let currentPayment, interest, principalPaid;
        if(repaymentMethod === 'AC') {
            interest = tempNewPrincipal * rate;
            if(prepaymentOption === 'shortenTerm') {
                currentPayment = originalFutureCashFlow[0];
                principalPaid = (i === newTerm) ? tempNewPrincipal : currentPayment - interest;
            } else {
                currentPayment = newPrincipal * rate * Math.pow(1 + rate, newTerm) / (Math.pow(1 + rate, newTerm) - 1);
                principalPaid = currentPayment - interest;
            }
        } else { // AP
            let monthlyPrincipal = (prepaymentOption === 'shortenTerm') ? totalAmount / loanTerm : newPrincipal / newTerm;
            principalPaid = Math.min(monthlyPrincipal, tempNewPrincipal);
            interest = tempNewPrincipal * rate;
        }
        currentPayment = principalPaid + interest;
        newFutureCashFlow.push(currentPayment);
        newAmortizationSchedule.push({ period: i, principal: principalPaid.toFixed(2), interest: interest.toFixed(2), total: currentPayment.toFixed(2), remaining: (tempNewPrincipal - principalPaid).toFixed(2) });
        tempNewPrincipal -= principalPaid;
        if(tempNewPrincipal < 0.01) { newTerm = i; break; }
    }
  }

  // 4. 计算最终结果
  const irrCashFlow = [-prepaymentAmount];
  const maxLength = Math.max(originalFutureCashFlow.length, newFutureCashFlow.length);
  for (let i = 0; i < maxLength; i++) {
    irrCashFlow.push((originalFutureCashFlow[i] || 0) - (newFutureCashFlow[i] || 0));
  }
  const irr = calculateIRR(irrCashFlow);
  
  const newFuturePayment = newFutureCashFlow.reduce((a, b) => a + b, 0);
  const newTotalInterest = alreadyPaidInterest + (newFuturePayment - newPrincipal);
  const interestSaved = originalTotalInterest - newTotalInterest;

  return {
    interestSaved: interestSaved.toFixed(2),
    newMonthlyPayment: (newFutureCashFlow[0] || 0).toFixed(2),
    newTerm: isFinite(newTerm) ? newTerm : 'N/A',
    irr: isFinite(irr) ? irr.toFixed(2) : 'N/A',
    schedule: newAmortizationSchedule,
    originalFuturePayment: originalFuturePayment.toFixed(2),
    newFuturePayment: newFuturePayment.toFixed(2),
    termSaved: originalRemainingTerm - newTerm,
  };
}

module.exports.analyze = analyze;