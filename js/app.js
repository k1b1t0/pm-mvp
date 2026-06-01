// Money Backward MVP Core Javascript Logic
document.addEventListener('DOMContentLoaded', () => {
  // --- Constant and State Management ---
  const STORAGE_KEY = 'FINANCE_MVP_DATA';

  const defaultData = {
    profile: {
      monthly_budget_limit: 10000000,
      savings_goal: 2000000,
      current_savings: 500000
    },
    incomes: [
      {
        id: "inc_1717252000000",
        title: "Lương tháng 5",
        source: "Công ty phần mềm",
        amount: 8000000,
        date: "2026-05-31"
      }
    ],
    expenses: [
      {
        id: "exp_1717252100000",
        title: "Tiền nhà tháng 5",
        amount: 3500000,
        category: "Học tập & Sinh hoạt",
        date: "2026-06-01"
      }
    ],
    savings: []
  };

  let appState = null;
  const activeFilters = {
    unified: 'all',
    income: 'all',
    expense: 'all'
  };

  // --- LocalStorage Helpers ---
  function initStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      appState = JSON.parse(JSON.stringify(defaultData)); // Deep copy default
      saveAppData();
    } else {
      try {
        appState = JSON.parse(raw);
        // Ensure structure is correct
        if (!appState.profile || !appState.incomes || !appState.expenses) {
          appState = JSON.parse(JSON.stringify(defaultData));
          saveAppData();
        }
        if (!appState.savings) {
          appState.savings = [];
          saveAppData();
        }
      } catch (e) {
        console.error('Error parsing localStorage data, resetting to defaults.', e);
        appState = JSON.parse(JSON.stringify(defaultData));
        saveAppData();
      }
    }
  }

  function getAppData() {
    return appState;
  }

  function saveAppData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }

  // --- Formatting Helpers ---
  function formatVND(value) {
    const num = Number(value) || 0;
    return num.toLocaleString('vi-VN') + ' đ';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`; // Convert YYYY-MM-DD to DD/MM/YYYY
  }

  function filterTransactionsByDate(list, filterType) {
    if (filterType === 'all') return list;

    // Get current date parts in local timezone to avoid UTC shifting
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const monthStr = `${yyyy}-${mm}`;
    const yearStr = `${yyyy}`;

    return list.filter(tx => {
      if (!tx.date) return false;
      if (filterType === 'day') {
        return tx.date === todayStr;
      } else if (filterType === 'month') {
        return tx.date.startsWith(monthStr);
      } else if (filterType === 'year') {
        return tx.date.startsWith(yearStr);
      }
      return true;
    });
  }

  // --- Custom Modals (Apple UI Style) ---
  function showAppleAlert(title, message, callback) {
    const overlay = document.getElementById('apple-alert-overlay');
    const titleEl = document.getElementById('alert-box-title');
    const messageEl = document.getElementById('alert-box-message');
    const okBtn = document.getElementById('alert-ok-btn');
    
    if (!overlay || !titleEl || !messageEl || !okBtn) return;

    titleEl.textContent = title;
    messageEl.textContent = message;

    // Show title in red if it contains warning or error words
    if (title.includes('Lỗi') || title.includes('Cảnh báo')) {
      titleEl.classList.add('text-danger');
    } else {
      titleEl.classList.remove('text-danger');
    }

    overlay.style.display = 'flex';

    // Clone button to strip previous event listeners cleanly
    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);

    newOkBtn.addEventListener('click', () => {
      overlay.style.display = 'none';
      if (callback) callback();
    });
  }

  function showAppleConfirm(title, message, onConfirm, onCancel) {
    const overlay = document.getElementById('apple-confirm-overlay');
    const titleEl = document.getElementById('confirm-box-title');
    const messageEl = document.getElementById('confirm-box-message');
    const okBtn = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');

    if (!overlay || !titleEl || !messageEl || !okBtn || !cancelBtn) return;

    titleEl.textContent = title;
    messageEl.textContent = message;
    overlay.style.display = 'flex';

    // Clone buttons to strip old listeners
    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);

    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newOkBtn.addEventListener('click', () => {
      overlay.style.display = 'none';
      if (onConfirm) onConfirm();
    });

    newCancelBtn.addEventListener('click', () => {
      overlay.style.display = 'none';
      if (onCancel) onCancel();
    });
  }

  // --- Dynamic Dashboard & State rendering ---
  function calculateMetrics() {
    const data = getAppData();
    const totalIncome = data.incomes.reduce((sum, inc) => sum + Number(inc.amount || 0), 0);
    const totalExpense = data.expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    const totalSavingsTx = (data.savings || []).reduce((sum, sav) => sum + Number(sav.amount || 0), 0);
    
    // Số dư hiện tại = Tổng thu nhập - Tổng chi tiêu - Tổng tiền gửi tiết kiệm
    const balance = totalIncome - totalExpense - totalSavingsTx;
    
    const limit = Number(data.profile.monthly_budget_limit) || 0;
    const budgetRatio = limit > 0 ? (totalExpense / limit) * 100 : 0;

    // Tổng tích lũy = Tiết kiệm ban đầu + Các khoản trích gửi tiết kiệm
    const currentSavingsTotal = (Number(data.profile.current_savings) || 0) + totalSavingsTx;

    return { totalIncome, totalExpense, balance, budgetRatio, limit, totalSavingsTx, currentSavingsTotal };
  }

  // Calculate chronological unified transactions with running balance
  function getUnifiedTransactions(data) {
    const list = [];
    
    // Incomes
    data.incomes.forEach(inc => {
      list.push({
        id: inc.id,
        date: inc.date,
        type: 'income',
        title: inc.title,
        detail: inc.source,
        amount: Number(inc.amount || 0)
      });
    });

    // Expenses
    data.expenses.forEach(exp => {
      list.push({
        id: exp.id,
        date: exp.date,
        type: 'expense',
        title: exp.title,
        detail: exp.category,
        amount: Number(exp.amount || 0)
      });
    });

    // Savings Transactions
    (data.savings || []).forEach(sav => {
      list.push({
        id: sav.id,
        date: sav.date,
        type: 'savings',
        title: sav.title,
        detail: 'Tích lũy',
        amount: Number(sav.amount || 0)
      });
    });

    // Sort chronologically (oldest first)
    list.sort((a, b) => {
      const dateDiff = new Date(a.date) - new Date(b.date);
      if (dateDiff !== 0) return dateDiff;
      // Secondary sort preserving insertion order via id timestamp
      const timeA = Number(a.id.split('_')[1]) || 0;
      const timeB = Number(b.id.split('_')[1]) || 0;
      return timeA - timeB;
    });

    // Calculate progressive balance
    let runningBalance = 0;
    list.forEach(tx => {
      if (tx.type === 'income') {
        runningBalance += tx.amount;
      } else {
        runningBalance -= tx.amount;
      }
      tx.progressiveBalance = runningBalance;
    });

    // Keep chronological order (oldest first)
    return list;
  }

  function renderApp() {
    const data = getAppData();
    const metrics = calculateMetrics();

    // 1. Render Dashboard Cards
    document.getElementById('dashboard-total-income').textContent = formatVND(metrics.totalIncome);
    document.getElementById('dashboard-total-expense').textContent = formatVND(metrics.totalExpense);
    document.getElementById('dashboard-balance').textContent = formatVND(metrics.balance);
    document.getElementById('dashboard-savings').textContent = formatVND(metrics.currentSavingsTotal);

    // 2. Render Budget Limit Progress Bar
    const progressBar = document.getElementById('budget-progress-bar');
    const ratioText = document.getElementById('budget-ratio-text');
    const spentText = document.getElementById('budget-spent-text');
    const limitText = document.getElementById('budget-limit-text');
    const warningBanner = document.getElementById('budget-warning-banner');

    ratioText.textContent = `${Math.round(metrics.budgetRatio)}%`;
    spentText.textContent = `Đã chi: ${formatVND(metrics.totalExpense)}`;
    limitText.textContent = `Hạn mức: ${formatVND(metrics.limit)}`;

    const barWidth = Math.min(metrics.budgetRatio, 100);
    progressBar.style.width = `${barWidth}%`;

    if (metrics.budgetRatio >= 100) {
      progressBar.classList.add('danger');
      warningBanner.style.display = 'flex';
    } else {
      progressBar.classList.remove('danger');
      warningBanner.style.display = 'none';
    }

    // 3. Render Chart
    if (window.expenseChart && typeof window.expenseChart.update === 'function') {
      window.expenseChart.update(data.incomes, data.expenses, data.savings);
    }

    // 4. Render Unified Transactions List (Dashboard)
    const unifiedList = getUnifiedTransactions(data);
    const filteredUnified = filterTransactionsByDate(unifiedList, activeFilters.unified);
    const tbody = document.getElementById('transaction-list-tbody');
    const placeholder = document.getElementById('no-transaction-placeholder');
    const table = document.getElementById('transaction-table');
    const countBadge = document.getElementById('transaction-count-badge');
    
    tbody.innerHTML = '';
    countBadge.textContent = `${filteredUnified.length} giao dịch`;

    if (filteredUnified.length === 0) {
      table.style.display = 'none';
      placeholder.style.display = 'flex';
    } else {
      table.style.display = 'table';
      placeholder.style.display = 'none';

      // Summary Row for Unified Table
      const totalPeriodIncome = filteredUnified.reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : 0), 0);
      const totalPeriodExpense = filteredUnified.reduce((sum, tx) => sum + (tx.type === 'expense' ? tx.amount : 0), 0);
      const totalPeriodSavings = filteredUnified.reduce((sum, tx) => sum + (tx.type === 'savings' ? tx.amount : 0), 0);

      const summaryTr = document.createElement('tr');
      summaryTr.className = 'summary-row';
      summaryTr.innerHTML = `
        <td class="w-semibold">TỔNG CỘNG</td>
        <td></td>
        <td></td>
        <td class="text-right">
          <div class="color-green w-semibold" style="display:inline-block; margin-right:4px;">+${formatVND(totalPeriodIncome)}</div>
          <div class="text-danger w-semibold" style="display:inline-block;">-${formatVND(totalPeriodExpense + totalPeriodSavings)}</div>
        </td>
        <td></td>
        <td></td>
      `;
      tbody.appendChild(summaryTr);

      filteredUnified.forEach(tx => {
        const tr = document.createElement('tr');
        
        let typeBadge = '';
        let amountText = '';
        let amountClass = '';
        
        if (tx.type === 'income') {
          typeBadge = '<span class="chip chip-green">Thu nhập</span>';
          amountText = `+ ${formatVND(tx.amount)}`;
          amountClass = 'color-green text-right w-semibold';
        } else if (tx.type === 'expense') {
          let catClass = '';
          if (tx.detail === 'Ăn uống') catClass = 'chip-orange';
          else if (tx.detail === 'Di chuyển') catClass = 'chip-accent';
          else if (tx.detail === 'Học tập & Sinh hoạt') catClass = 'chip-purple';
          else if (tx.detail === 'Giải trí') catClass = 'chip-red';
          
          typeBadge = `<span class="chip ${catClass}">${escapeHTML(tx.detail)}</span>`;
          amountText = `- ${formatVND(tx.amount)}`;
          amountClass = 'text-danger text-right w-semibold';
        } else if (tx.type === 'savings') {
          typeBadge = '<span class="chip chip-yellow">Tích lũy</span>';
          amountText = `- ${formatVND(tx.amount)}`;
          amountClass = 'text-danger text-right w-semibold';
        }

        tr.innerHTML = `
          <td>${formatDate(tx.date)}</td>
          <td>${typeBadge}</td>
          <td class="w-semibold">${escapeHTML(tx.title)}</td>
          <td class="${amountClass}">${amountText}</td>
          <td class="text-right w-semibold">${formatVND(tx.progressiveBalance)}</td>
          <td class="text-center">
            <button class="action-btn delete-action" data-id="${tx.id}" aria-label="Xóa giao dịch">
              🗑️
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // 4b. Render Incomes History List
    const incomeList = unifiedList.filter(tx => tx.type === 'income');
    const filteredIncomes = filterTransactionsByDate(incomeList, activeFilters.income);
    const incomeTbody = document.getElementById('income-list-tbody');
    const incomePlaceholder = document.getElementById('no-income-placeholder');
    const incomeTable = document.getElementById('income-table');
    const incomeCountBadge = document.getElementById('income-count-badge');

    incomeTbody.innerHTML = '';
    incomeCountBadge.textContent = `${filteredIncomes.length} khoản thu`;

    if (filteredIncomes.length === 0) {
      incomeTable.style.display = 'none';
      incomePlaceholder.style.display = 'flex';
    } else {
      incomeTable.style.display = 'table';
      incomePlaceholder.style.display = 'none';

      // Summary Row
      const totalPeriodIncome = filteredIncomes.reduce((sum, tx) => sum + tx.amount, 0);
      const summaryTr = document.createElement('tr');
      summaryTr.className = 'summary-row';
      summaryTr.innerHTML = `
        <td class="w-semibold">TỔNG CỘNG</td>
        <td></td>
        <td></td>
        <td class="color-green text-right w-semibold">+ ${formatVND(totalPeriodIncome)}</td>
        <td></td>
      `;
      incomeTbody.appendChild(summaryTr);

      filteredIncomes.forEach(tx => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${formatDate(tx.date)}</td>
          <td class="w-semibold">${escapeHTML(tx.detail)}</td>
          <td>${escapeHTML(tx.title)}</td>
          <td class="color-green text-right w-semibold">+ ${formatVND(tx.amount)}</td>
          <td class="text-center">
            <button class="action-btn delete-action" data-id="${tx.id}" aria-label="Xóa giao dịch">
              🗑️
            </button>
          </td>
        `;
        incomeTbody.appendChild(tr);
      });
    }

    // 4c. Render Expenses History List
    const expenseList = unifiedList.filter(tx => tx.type === 'expense');
    const filteredExpenses = filterTransactionsByDate(expenseList, activeFilters.expense);
    const expenseTbody = document.getElementById('expense-list-tbody');
    const expensePlaceholder = document.getElementById('no-expense-placeholder');
    const expenseTable = document.getElementById('expense-table');
    const expenseCountBadge = document.getElementById('expense-count-badge');

    expenseTbody.innerHTML = '';
    expenseCountBadge.textContent = `${filteredExpenses.length} khoản chi`;

    if (filteredExpenses.length === 0) {
      expenseTable.style.display = 'none';
      expensePlaceholder.style.display = 'flex';
    } else {
      expenseTable.style.display = 'table';
      expensePlaceholder.style.display = 'none';

      // Summary Row
      const totalPeriodExpense = filteredExpenses.reduce((sum, tx) => sum + tx.amount, 0);
      const summaryTr = document.createElement('tr');
      summaryTr.className = 'summary-row';
      summaryTr.innerHTML = `
        <td class="w-semibold">TỔNG CỘNG</td>
        <td></td>
        <td></td>
        <td class="text-danger text-right w-semibold">-${formatVND(totalPeriodExpense)}</td>
        <td></td>
      `;
      expenseTbody.appendChild(summaryTr);

      filteredExpenses.forEach(tx => {
        const tr = document.createElement('tr');
        
        let catClass = '';
        if (tx.detail === 'Ăn uống') catClass = 'chip-orange';
        else if (tx.detail === 'Di chuyển') catClass = 'chip-accent';
        else if (tx.detail === 'Học tập & Sinh hoạt') catClass = 'chip-purple';
        else if (tx.detail === 'Giải trí') catClass = 'chip-red';

        const typeBadge = `<span class="chip ${catClass}">${escapeHTML(tx.detail)}</span>`;

        tr.innerHTML = `
          <td>${formatDate(tx.date)}</td>
          <td>${typeBadge}</td>
          <td class="w-semibold">${escapeHTML(tx.title)}</td>
          <td class="text-danger text-right w-semibold">-${formatVND(tx.amount)}</td>
          <td class="text-center">
            <button class="action-btn delete-action" data-id="${tx.id}" aria-label="Xóa giao dịch">
              🗑️
            </button>
          </td>
        `;
        expenseTbody.appendChild(tr);
      });
    }

    // 5. Render Savings Tab Progress
    const currentSavings = metrics.currentSavingsTotal;
    const savingsGoal = Number(data.profile.savings_goal) || 0;
    const savingsProgress = document.getElementById('savings-progress-bar');
    const currentSavingsVal = document.getElementById('savings-current-val');
    const goalSavingsVal = document.getElementById('savings-goal-val');
    const savingsRemainingDesc = document.getElementById('savings-remaining-desc');
    const savingsStatusBadge = document.getElementById('savings-status-badge');

    currentSavingsVal.textContent = formatVND(currentSavings);
    goalSavingsVal.textContent = formatVND(savingsGoal);

    const remainingSavings = savingsGoal - currentSavings;
    const savingsRatio = savingsGoal > 0 ? (currentSavings / savingsGoal) * 100 : 0;
    
    savingsProgress.style.width = `${Math.min(savingsRatio, 100)}%`;

    if (remainingSavings <= 0) {
      savingsStatusBadge.textContent = 'Hoàn thành';
      savingsStatusBadge.className = 'chip chip-green';
      savingsRemainingDesc.innerHTML = '✨ <strong>Chúc mừng!</strong> Bạn đã hoàn thành xuất sắc mục tiêu tiết kiệm của tháng này!';
    } else {
      savingsStatusBadge.textContent = 'Đang tích lũy';
      savingsStatusBadge.className = 'chip chip-yellow';
      savingsRemainingDesc.innerHTML = `Còn thiếu: <strong>${formatVND(remainingSavings)}</strong> để hoàn thành mục tiêu tài chính của bạn.`;
    }

    // 6. Update Inputs in settings form
    document.getElementById('profile-budget-limit').value = data.profile.monthly_budget_limit;
    document.getElementById('profile-savings-goal').value = data.profile.savings_goal;
    document.getElementById('profile-current-savings').value = data.profile.current_savings;

    // 7. Update Current Date Subtitle
    const now = new Date();
    const monthYearStr = `Tháng ${now.getMonth() + 1}, ${now.getFullYear()}`;
    document.getElementById('current-date-subtitle').textContent = monthYearStr;
  }

  // --- Form Validation Helpers ---
  function validateFormGroup(groupEl, isValid) {
    if (!groupEl) return isValid;
    if (isValid) {
      groupEl.classList.remove('invalid');
    } else {
      groupEl.classList.add('invalid');
    }
    return isValid;
  }

  // Helper to escape HTML characters
  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // Set default dates to inputs
  function setDefaultFormDates() {
    const todayStr = new Date().toISOString().split('T')[0];
    const incomeDate = document.getElementById('income-date');
    const expenseDate = document.getElementById('expense-date');
    const savingsDate = document.getElementById('savings-date');
    if (incomeDate) incomeDate.value = todayStr;
    if (expenseDate) expenseDate.value = todayStr;
    if (savingsDate) savingsDate.value = todayStr;
  }

  // --- Event Listeners & Event Delegation ---

  // Navigation Tab Switching
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.app-section');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');
      
      navItems.forEach(n => n.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      item.classList.add('active');
      const targetSection = document.getElementById(targetTab);
      if (targetSection) {
        targetSection.classList.add('active');
      }
      
      // Refresh render
      renderApp();
    });
  });

  // Income Form Submit
  const incomeForm = document.getElementById('income-form');
  incomeForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const titleInput = document.getElementById('income-title');
    const sourceInput = document.getElementById('income-source');
    const amountInput = document.getElementById('income-amount');
    const dateInput = document.getElementById('income-date');

    const titleGroup = titleInput.closest('.form-group');
    const sourceGroup = sourceInput.closest('.form-group');
    const amountGroup = amountInput.closest('.form-group');
    const dateGroup = dateInput.closest('.form-group');

    // Validate inputs
    let isFormValid = true;

    isFormValid = validateFormGroup(titleGroup, titleInput.value.trim() !== '') && isFormValid;
    isFormValid = validateFormGroup(sourceGroup, sourceInput.value.trim() !== '') && isFormValid;
    
    const amountVal = Number(amountInput.value);
    isFormValid = validateFormGroup(amountGroup, !isNaN(amountVal) && amountVal > 0) && isFormValid;
    isFormValid = validateFormGroup(dateGroup, dateInput.value !== '') && isFormValid;

    if (!isFormValid) return; // Keep form data!

    // Push new income
    const data = getAppData();
    const newIncome = {
      id: "inc_" + Date.now(),
      title: titleInput.value.trim(),
      source: sourceInput.value.trim(),
      amount: amountVal, // Number type guaranteed
      date: dateInput.value
    };

    data.incomes.push(newIncome);
    saveAppData();
    renderApp();

    // Reset inputs only on success
    titleInput.value = '';
    sourceInput.value = '';
    amountInput.value = '';
    setDefaultFormDates();

    // Clear validation classes
    [titleGroup, sourceGroup, amountGroup, dateGroup].forEach(g => g.classList.remove('invalid'));

    showAppleAlert('Thành công', 'Khoản thu nhập đã được ghi nhận thành công!');
  });

  // Expense Form Submit
  const expenseForm = document.getElementById('expense-form');
  expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const titleInput = document.getElementById('expense-title');
    const amountInput = document.getElementById('expense-amount');
    const categorySelect = document.getElementById('expense-category');
    const dateInput = document.getElementById('expense-date');

    const titleGroup = titleInput.closest('.form-group');
    const amountGroup = amountInput.closest('.form-group');
    const categoryGroup = categorySelect.closest('.form-group');
    const dateGroup = dateInput.closest('.form-group');

    let isFormValid = true;

    isFormValid = validateFormGroup(titleGroup, titleInput.value.trim() !== '') && isFormValid;
    
    const amountVal = Number(amountInput.value);
    isFormValid = validateFormGroup(amountGroup, !isNaN(amountVal) && amountVal > 0) && isFormValid;
    isFormValid = validateFormGroup(categoryGroup, categorySelect.value !== '') && isFormValid;
    isFormValid = validateFormGroup(dateGroup, dateInput.value !== '') && isFormValid;

    if (!isFormValid) return; // Keep form data!

    // Check balance to prevent negative balance
    const metrics = calculateMetrics();
    if (amountVal > metrics.balance) {
      showAppleAlert('Lỗi số dư', 'Tài khoản không đủ số dư để thực hiện giao dịch này!');
      return; // Keep form data!
    }

    const data = getAppData();
    const newExpense = {
      id: "exp_" + Date.now(),
      title: titleInput.value.trim(),
      amount: amountVal, // Number type guaranteed
      category: categorySelect.value,
      date: dateInput.value
    };

    data.expenses.push(newExpense);
    saveAppData();
    renderApp();

    // Reset inputs only on success
    titleInput.value = '';
    amountInput.value = '';
    categorySelect.value = '';
    setDefaultFormDates();

    [titleGroup, amountGroup, categoryGroup, dateGroup].forEach(g => g.classList.remove('invalid'));

    // Check if total expense exceeds limit and trigger warnings
    const newMetrics = calculateMetrics();
    if (newMetrics.budgetRatio >= 100) {
      showAppleAlert('Cảnh báo ngân sách', 'Bạn đã chi tiêu vượt quá hạn mức cho phép của tháng này!');
    } else {
      showAppleAlert('Thành công', 'Khoản chi tiêu đã được ghi nhận!');
    }
  });

  // Savings Form Submit (Gửi tiết kiệm)
  const savingsForm = document.getElementById('savings-form');
  savingsForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const amountInput = document.getElementById('savings-amount');
    const dateInput = document.getElementById('savings-date');

    const amountGroup = amountInput.closest('.form-group');
    const dateGroup = dateInput.closest('.form-group');

    let isFormValid = true;
    const amountVal = Number(amountInput.value);
    isFormValid = validateFormGroup(amountGroup, !isNaN(amountVal) && amountVal > 0) && isFormValid;
    isFormValid = validateFormGroup(dateGroup, dateInput.value !== '') && isFormValid;

    if (!isFormValid) return; // Keep form data!

    // Check balance to prevent negative balance
    const metrics = calculateMetrics();
    if (amountVal > metrics.balance) {
      showAppleAlert('Lỗi số dư', 'Tài khoản không đủ số dư để thực hiện giao dịch này!');
      return; // Keep form data!
    }

    const data = getAppData();
    const newSavings = {
      id: "sav_" + Date.now(),
      title: "Trích quỹ tiết kiệm tháng",
      amount: amountVal,
      date: dateInput.value
    };

    data.savings.push(newSavings);
    saveAppData();
    renderApp();

    // Reset inputs on success
    amountInput.value = '';
    setDefaultFormDates();

    [amountGroup, dateGroup].forEach(g => g.classList.remove('invalid'));

    showAppleAlert('Thành công', 'Đã trích quỹ gửi tiết kiệm thành công!');
  });

  // Profile/Settings Form Submit
  const profileForm = document.getElementById('profile-form');
  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const limitInput = document.getElementById('profile-budget-limit');
    const goalInput = document.getElementById('profile-savings-goal');
    const currentInput = document.getElementById('profile-current-savings');

    const limitGroup = limitInput.closest('.form-group');
    const goalGroup = goalInput.closest('.form-group');
    const currentGroup = currentInput.closest('.form-group');

    let isFormValid = true;

    const limitVal = Number(limitInput.value);
    isFormValid = validateFormGroup(limitGroup, !isNaN(limitVal) && limitVal >= 0 && limitInput.value !== '') && isFormValid;

    const goalVal = Number(goalInput.value);
    isFormValid = validateFormGroup(goalGroup, !isNaN(goalVal) && goalVal >= 0 && goalInput.value !== '') && isFormValid;

    const currentVal = Number(currentInput.value);
    isFormValid = validateFormGroup(currentGroup, !isNaN(currentVal) && currentVal >= 0 && currentInput.value !== '') && isFormValid;

    if (!isFormValid) return;

    const data = getAppData();
    data.profile.monthly_budget_limit = limitVal;
    data.profile.savings_goal = goalVal;
    data.profile.current_savings = currentVal;

    saveAppData();
    renderApp();

    [limitGroup, goalGroup, currentGroup].forEach(g => g.classList.remove('invalid'));

    showAppleAlert('Lưu cấu hình', 'Đã lưu cấu hình tài chính mới thành công!');
  });

  // Delete Action delegation for tables
  document.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-action');
    if (!deleteBtn) return;

    const itemId = deleteBtn.getAttribute('data-id');
    const data = getAppData();

    if (itemId.startsWith('inc_')) {
      const item = data.incomes.find(i => i.id === itemId);
      const title = item ? item.title : 'giao dịch';
      
      showAppleConfirm(
        'Xác nhận xóa', 
        `Bạn có chắc chắn muốn xóa khoản thu "${title}" không?`, 
        () => {
          data.incomes = data.incomes.filter(i => i.id !== itemId);
          saveAppData();
          renderApp();
          showAppleAlert('Đã xóa', 'Đã xóa khoản thu nhập.');
        }
      );
    } else if (itemId.startsWith('exp_')) {
      const item = data.expenses.find(e => e.id === itemId);
      const title = item ? item.title : 'giao dịch';

      showAppleConfirm(
        'Xác nhận xóa', 
        `Bạn có chắc chắn muốn xóa khoản chi "${title}" không?`, 
        () => {
          data.expenses = data.expenses.filter(e => e.id !== itemId);
          saveAppData();
          renderApp();
          showAppleAlert('Đã xóa', 'Đã xóa khoản chi tiêu.');
        }
      );
    } else if (itemId.startsWith('sav_')) {
      const item = (data.savings || []).find(s => s.id === itemId);
      const title = item ? item.title : 'giao dịch';

      showAppleConfirm(
        'Xác nhận xóa', 
        `Bạn có chắc chắn muốn xóa giao dịch tích lũy "${title}" không?`, 
        () => {
          data.savings = data.savings.filter(s => s.id !== itemId);
          saveAppData();
          renderApp();
          showAppleAlert('Đã xóa', 'Đã xóa khoản tích lũy.');
        }
      );
    }
  });

  // Filter Button Click handler
  document.addEventListener('click', (e) => {
    const filterBtn = e.target.closest('.filter-btn');
    if (!filterBtn) return;

    const tableName = filterBtn.getAttribute('data-table');
    const filterValue = filterBtn.getAttribute('data-filter');
    if (!tableName || !filterValue) return;

    activeFilters[tableName] = filterValue;

    // Toggle active class inside the specific filter group
    const parentFilters = filterBtn.closest('.table-filters');
    if (parentFilters) {
      parentFilters.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      filterBtn.classList.add('active');
    }

    renderApp();
  });

  // Warning Banner Close Button
  const closeWarningBtn = document.getElementById('close-warning-btn');
  if (closeWarningBtn) {
    closeWarningBtn.addEventListener('click', () => {
      document.getElementById('budget-warning-banner').style.display = 'none';
    });
  }

  // Reset Data Button (Vùng nguy hiểm)
  const resetBtn = document.getElementById('reset-all-data-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showAppleConfirm(
        'Đặt lại dữ liệu', 
        'Hành động này sẽ xóa sạch dữ liệu thu chi, gửi tiết kiệm và đưa cấu hình về mặc định. Bạn có chắc chắn muốn thực hiện?',
        () => {
          localStorage.removeItem(STORAGE_KEY);
          activeFilters.unified = 'all';
          activeFilters.income = 'all';
          activeFilters.expense = 'all';
          
          document.querySelectorAll('.table-filters').forEach(group => {
            group.querySelectorAll('.filter-btn').forEach((btn, idx) => {
              if (idx === 0) btn.classList.add('active');
              else btn.classList.remove('active');
            });
          });

          initStorage();
          renderApp();
          showAppleAlert('Đã đặt lại', 'Hệ thống đã được đưa về trạng thái dữ liệu mẫu ban đầu.');
        }
      );
    });
  }

  // --- App Initialization ---
  initStorage();
  setDefaultFormDates();
  renderApp();
});
