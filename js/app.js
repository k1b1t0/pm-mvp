// Money Backward MVP Core Javascript Logic
document.addEventListener('DOMContentLoaded', () => {
  // --- Constant and State Management ---
  const STORAGE_KEY = 'FINANCE_MVP_DATA';

  const defaultData = {
    profile: {
      monthly_budget_limit: 5000000,
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
    ]
  };

  let appState = null;

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

  // --- Custom Modals (Apple UI Style) ---
  function showAppleAlert(title, message, callback) {
    const overlay = document.getElementById('apple-alert-overlay');
    const titleEl = document.getElementById('alert-box-title');
    const messageEl = document.getElementById('alert-box-message');
    const okBtn = document.getElementById('alert-ok-btn');
    
    if (!overlay || !titleEl || !messageEl || !okBtn) return;

    titleEl.textContent = title;
    messageEl.textContent = message;
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
    const balance = totalIncome - totalExpense;
    
    const limit = Number(data.profile.monthly_budget_limit) || 0;
    const budgetRatio = limit > 0 ? (totalExpense / limit) * 100 : 0;

    return { totalIncome, totalExpense, balance, budgetRatio, limit };
  }

  function renderApp() {
    const data = getAppData();
    const metrics = calculateMetrics();

    // 1. Render Dashboard Cards
    document.getElementById('dashboard-total-income').textContent = formatVND(metrics.totalIncome);
    document.getElementById('dashboard-total-expense').textContent = formatVND(metrics.totalExpense);
    document.getElementById('dashboard-balance').textContent = formatVND(metrics.balance);

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
      window.expenseChart.update(data.expenses);
    }

    // 4. Render Income List
    const incomeTbody = document.getElementById('income-list-tbody');
    const noIncomePlaceholder = document.getElementById('no-income-placeholder');
    const incomeTable = document.getElementById('income-table');
    const incomeCountBadge = document.getElementById('income-count-badge');
    
    incomeTbody.innerHTML = '';
    incomeCountBadge.textContent = `${data.incomes.length} mục`;

    if (data.incomes.length === 0) {
      incomeTable.style.display = 'none';
      noIncomePlaceholder.style.display = 'flex';
    } else {
      incomeTable.style.display = 'table';
      noIncomePlaceholder.style.display = 'none';

      // Sort incomes by date descending
      const sortedIncomes = [...data.incomes].sort((a, b) => new Date(b.date) - new Date(a.date));

      sortedIncomes.forEach(inc => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${formatDate(inc.date)}</td>
          <td class="w-semibold">${escapeHTML(inc.title)}</td>
          <td><span class="chip">${escapeHTML(inc.source)}</span></td>
          <td class="text-right w-semibold color-green">+ ${formatVND(inc.amount)}</td>
          <td class="text-center">
            <button class="action-btn delete-action" data-id="${inc.id}" aria-label="Xóa khoản thu">
              🗑️
            </button>
          </td>
        `;
        incomeTbody.appendChild(tr);
      });
    }

    // 5. Render Expense List
    const expenseTbody = document.getElementById('expense-list-tbody');
    const noExpensePlaceholder = document.getElementById('no-expense-placeholder');
    const expenseTable = document.getElementById('expense-table');
    const expenseCountBadge = document.getElementById('expense-count-badge');

    expenseTbody.innerHTML = '';
    expenseCountBadge.textContent = `${data.expenses.length} mục`;

    if (data.expenses.length === 0) {
      expenseTable.style.display = 'none';
      noExpensePlaceholder.style.display = 'flex';
    } else {
      expenseTable.style.display = 'table';
      noExpensePlaceholder.style.display = 'none';

      // Sort expenses by date descending
      const sortedExpenses = [...data.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

      sortedExpenses.forEach(exp => {
        const tr = document.createElement('tr');
        
        // Dynamic chip theme for categories
        let chipClass = 'chip-accent';
        if (exp.category === 'Ăn uống') chipClass = 'chip-red';
        else if (exp.category === 'Học tập & Sinh hoạt') chipClass = 'chip-green';
        else if (exp.category === 'Khác') chipClass = '';

        tr.innerHTML = `
          <td>${formatDate(exp.date)}</td>
          <td class="w-semibold">${escapeHTML(exp.title)}</td>
          <td><span class="chip ${chipClass}">${escapeHTML(exp.category)}</span></td>
          <td class="text-right w-semibold text-danger">- ${formatVND(exp.amount)}</td>
          <td class="text-center">
            <button class="action-btn delete-action" data-id="${exp.id}" aria-label="Xóa khoản chi">
              🗑️
            </button>
          </td>
        `;
        expenseTbody.appendChild(tr);
      });
    }

    // 6. Render Savings Tab
    const currentSavings = Number(data.profile.current_savings) || 0;
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
      savingsStatusBadge.className = 'chip chip-accent';
      savingsRemainingDesc.innerHTML = `Còn thiếu: <strong>${formatVND(remainingSavings)}</strong> để hoàn thành mục tiêu tài chính của bạn.`;
    }

    // 7. Update Inputs in settings form
    document.getElementById('profile-budget-limit').value = data.profile.monthly_budget_limit;
    document.getElementById('profile-savings-goal').value = data.profile.savings_goal;
    document.getElementById('profile-current-savings').value = data.profile.current_savings;

    // 8. Update Current Date Subtitle
    const now = new Date();
    const monthYearStr = `Tháng ${now.getMonth() + 1}, ${now.getFullYear()}`;
    document.getElementById('current-date-subtitle').textContent = monthYearStr;
  }

  // --- Form Validation Helpers ---
  function validateFormGroup(groupEl, isValid) {
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
    if (incomeDate) incomeDate.value = todayStr;
    if (expenseDate) expenseDate.value = todayStr;
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
      
      // Special logic when returning to Dashboard to refresh Chart
      if (targetTab === 'tab-dashboard') {
        renderApp();
      }
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
    
    // Strict parsing logic to prevent numbers from being parsed as strings
    const amountVal = Number(amountInput.value);
    isFormValid = validateFormGroup(amountGroup, !isNaN(amountVal) && amountVal > 0) && isFormValid;
    isFormValid = validateFormGroup(dateGroup, dateInput.value !== '') && isFormValid;

    if (!isFormValid) return;

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

    // Reset inputs
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
    
    // Strict parsing
    const amountVal = Number(amountInput.value);
    isFormValid = validateFormGroup(amountGroup, !isNaN(amountVal) && amountVal > 0) && isFormValid;
    isFormValid = validateFormGroup(categoryGroup, categorySelect.value !== '') && isFormValid;
    isFormValid = validateFormGroup(dateGroup, dateInput.value !== '') && isFormValid;

    if (!isFormValid) return;

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

    // Reset inputs
    titleInput.value = '';
    amountInput.value = '';
    categorySelect.value = '';
    setDefaultFormDates();

    [titleGroup, amountGroup, categoryGroup, dateGroup].forEach(g => g.classList.remove('invalid'));

    // Check if total expense exceeds limit and trigger warnings
    const metrics = calculateMetrics();
    if (metrics.budgetRatio >= 100) {
      showAppleAlert('Cảnh báo ngân sách', 'Bạn đã chi tiêu vượt quá hạn mức cho phép của tháng này!');
    } else {
      showAppleAlert('Thành công', 'Khoản chi tiêu đã được ghi nhận!');
    }
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

    // Strict validation and conversion to numbers
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
    }
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
        'Hành động này sẽ xóa sạch dữ liệu thu chi và đưa cấu hình về mặc định. Bạn có chắc chắn muốn thực hiện?',
        () => {
          localStorage.removeItem(STORAGE_KEY);
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
