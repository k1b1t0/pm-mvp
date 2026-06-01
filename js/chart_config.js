// Chart.js configuration for Money Backward MVP
(function () {
  let chartInstance = null;

  // Colors for categories matching Apple styling
  const categoryColors = {
    "Ăn uống": "#FF9500",            // Orange
    "Di chuyển": "#007AFF",          // Blue
    "Học tập & Sinh hoạt": "#34C759", // Green
    "Giải trí": "#FF3B30",           // Red
    "Khác": "#8E8E93"                // Grey
  };

  // Helper to determine the text color based on preferred color scheme
  function getTextColor() {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
  }

  // Helper to get grid line/separator colors if needed (not needed for Pie charts but good practice)
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

    // Only return categories with amount > 0
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

  // Update chart with new data
  function updateChart(expenses) {
    const canvas = document.getElementById('expense-pie-chart');
    const placeholder = document.getElementById('no-chart-data-message');
    
    if (!canvas) return;

    // Filter out valid expenses
    const validExpenses = expenses.filter(e => Number(e.amount) > 0);

    if (validExpenses.length === 0) {
      // Hide canvas, show placeholder
      canvas.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
      
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      return;
    }

    // Show canvas, hide placeholder
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
      // Update existing chart to avoid stutter
      chartInstance.data.labels = labels;
      chartInstance.data.datasets[0].data = data;
      chartInstance.data.datasets[0].backgroundColor = colors;
      chartInstance.options.plugins.legend.labels.color = textColor;
      chartInstance.update();
    } else {
      // Create new chart
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
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed !== null) {
                    label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed);
                  }
                  return label;
                }
              }
            }
          },
          cutout: '65%' // Gives it the sleek doughnut style
        }
      });
    }
  }

  // Live dark mode change listener
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (chartInstance) {
      // Update font color and border color according to system theme change
      const textColor = getTextColor();
      chartInstance.options.plugins.legend.labels.color = textColor;
      
      const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#ffffff';
      chartInstance.data.datasets[0].borderColor = borderColor;
      
      chartInstance.update();
    }
  });

  // Expose to global scope
  window.expenseChart = {
    update: updateChart,
    destroy: () => {
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
    }
  };
})();
