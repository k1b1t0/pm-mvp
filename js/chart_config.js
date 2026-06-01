// Chart.js configuration for Money Backward MVP
(function () {
  let chartInstance = null; // Doughnut Chart
  let barChartInstance = null; // Bar Chart

  // Colors for categories matching Apple styling
  const categoryColors = {
    "Ăn uống": "#FF9500",            // Orange
    "Di chuyển": "#007AFF",          // Blue
    "Học tập & Sinh hoạt": "#AF52DE", // Purple
    "Giải trí": "#FF3B30",           // Red
    "Khác": "#8E8E93"                // Grey
  };

  // Helper to determine the text color based on preferred color scheme
  function getTextColor() {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
  }

  // Helper to get grid line/separator colors
  function getSeparatorColor() {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? 'rgba(84, 84, 88, 0.4)' : 'rgba(60, 60, 67, 0.12)';
  }

  // Summarize expenses by category
  function getCategoryData(expenses) {
    const summary = {
      "Ăn uống": 0,
      "Di chuyển": 0,
      "Học tập & Sinh hoạt": 0,
      "Giải trí": 0,
      "Khác": 0
    };

    expenses.forEach(exp => {
      const cat = exp.category || "Khác";
      if (summary[cat] !== undefined) {
        summary[cat] += Number(exp.amount || 0);
      } else {
        summary["Khác"] += Number(exp.amount || 0);
      }
    });

    const labels = [];
    const data = [];
    const colors = [];

    Object.keys(summary).forEach(cat => {
      if (summary[cat] > 0) {
        labels.push(cat);
        data.push(summary[cat]);
        colors.push(categoryColors[cat]);
      }
    });

    return { labels, data, colors };
  }

  // Update Doughnut Chart (Expense Breakdown)
  function updateDoughnutChart(expenses) {
    const canvas = document.getElementById('expense-pie-chart');
    const placeholder = document.getElementById('no-chart-data-message');
    
    if (!canvas) return;

    const validExpenses = expenses.filter(e => Number(e.amount) > 0);

    if (validExpenses.length === 0) {
      canvas.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
      
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      return;
    }

    canvas.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';

    const { labels, data, colors } = getCategoryData(validExpenses);

    if (labels.length === 0) {
      canvas.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      return;
    }

    const textColor = getTextColor();

    if (chartInstance) {
      chartInstance.data.labels = labels;
      chartInstance.data.datasets[0].data = data;
      chartInstance.data.datasets[0].backgroundColor = colors;
      chartInstance.options.plugins.legend.labels.color = textColor;
      chartInstance.update();
    } else {
      const ctx = canvas.getContext('2d');
      chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#ffffff',
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                font: {
                  family: getComputedStyle(document.documentElement).getPropertyValue('--font').trim() || 'system-ui',
                  size: 13,
                  weight: '500'
                },
                color: textColor,
                padding: 15
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.label || '';
                  if (label) label += ': ';
                  if (context.parsed !== null) {
                    label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed);
                  }
                  return label;
                }
              }
            }
          },
          cutout: '65%'
        }
      });
    }
  }

  // Update Bar Chart (Comparison: Incomes vs Expenses vs Savings)
  function updateBarChart(incomes, expenses, savings) {
    const canvas = document.getElementById('comparison-bar-chart');
    const placeholder = document.getElementById('no-bar-chart-data-message');
    
    if (!canvas) return;

    const totalInc = incomes.reduce((sum, inc) => sum + Number(inc.amount || 0), 0);
    const totalExp = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    const totalSav = (savings || []).reduce((sum, sav) => sum + Number(sav.amount || 0), 0);

    if (totalInc === 0 && totalExp === 0 && totalSav === 0) {
      canvas.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
      
      if (barChartInstance) {
        barChartInstance.destroy();
        barChartInstance = null;
      }
      return;
    }

    canvas.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';

    const textColor = getTextColor();
    const separatorColor = getSeparatorColor();
    const font = getComputedStyle(document.documentElement).getPropertyValue('--font').trim() || 'system-ui';

    const barColors = [
      getComputedStyle(document.documentElement).getPropertyValue('--green').trim() || '#34C759',
      getComputedStyle(document.documentElement).getPropertyValue('--red').trim() || '#FF3B30',
      getComputedStyle(document.documentElement).getPropertyValue('--yellow').trim() || '#FFCC00'
    ];

    const chartData = [totalInc, totalExp, totalSav];

    if (barChartInstance) {
      barChartInstance.data.datasets[0].data = chartData;
      barChartInstance.data.datasets[0].backgroundColor = barColors;
      barChartInstance.options.scales.x.ticks.color = textColor;
      barChartInstance.options.scales.y.ticks.color = textColor;
      barChartInstance.options.scales.y.grid.color = separatorColor;
      barChartInstance.update();
    } else {
      const ctx = canvas.getContext('2d');
      barChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Thu nhập', 'Chi tiêu', 'Gửi tiết kiệm'],
          datasets: [{
            data: chartData,
            backgroundColor: barColors,
            borderRadius: 6,
            borderWidth: 0,
            maxBarThickness: 36
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) label += ': ';
                  if (context.parsed.y !== null) {
                    label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed.y);
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: textColor,
                font: {
                  family: font,
                  size: 13,
                  weight: '500'
                }
              }
            },
            y: {
              grid: {
                color: separatorColor
              },
              ticks: {
                color: textColor,
                font: {
                  family: font,
                  size: 11
                },
                callback: function(value) {
                  if (value >= 1000000) return (value / 1000000) + 'M';
                  if (value >= 1000) return (value / 1000) + 'k';
                  return value;
                }
              }
            }
          }
        }
      });
    }
  }

  // Live dark mode change listener
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const textColor = getTextColor();
    const separatorColor = getSeparatorColor();
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#ffffff';

    if (chartInstance) {
      chartInstance.options.plugins.legend.labels.color = textColor;
      chartInstance.data.datasets[0].borderColor = borderColor;
      chartInstance.update();
    }

    if (barChartInstance) {
      barChartInstance.options.scales.x.ticks.color = textColor;
      barChartInstance.options.scales.y.ticks.color = textColor;
      barChartInstance.options.scales.y.grid.color = separatorColor;
      
      const barColors = [
        getComputedStyle(document.documentElement).getPropertyValue('--green').trim() || '#34C759',
        getComputedStyle(document.documentElement).getPropertyValue('--red').trim() || '#FF3B30',
        getComputedStyle(document.documentElement).getPropertyValue('--yellow').trim() || '#FFCC00'
      ];
      barChartInstance.data.datasets[0].backgroundColor = barColors;
      
      barChartInstance.update();
    }
  });

  // Expose to global scope
  window.expenseChart = {
    update: function (incomes, expenses, savings) {
      updateDoughnutChart(expenses);
      updateBarChart(incomes, expenses, savings);
    },
    destroy: () => {
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      if (barChartInstance) {
        barChartInstance.destroy();
        barChartInstance = null;
      }
    }
  };
})();
