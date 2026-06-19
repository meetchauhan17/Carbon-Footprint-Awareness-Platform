/**
 * Utility functions for HTML5 Browser Notification API.
 */

const STORAGE_KEY = 'carbonwise-data';

/**
 * Checks if the Notification API is supported and permission is granted.
 */
export function canNotify() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    window.Notification.permission === 'granted'
  );
}

/**
 * Safely triggers a browser notification if permission is granted.
 * @returns {Notification|null} The notification instance or null
 */
export function sendNotification(title, body, icon) {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (window.Notification.permission === 'granted') {
      try {
        // Use default app icon if none provided
        return new window.Notification(title, {
          body,
          icon: icon || '/favicon.ico'
        });
      } catch (e) {
        console.error('Error creating notification:', e);
      }
    }
  }
  return null;
}

/**
 * Weekly Summary Reports trigger.
 * Fires a weekly summary if the user has enabled it and a week has passed since last notification.
 * @param {boolean} force If true, bypasses enabled preference and timestamp checks (for testing)
 */
export function checkWeeklyDigest(force = false) {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return;
  const data = JSON.parse(stored);

  if (!force) {
    const enabled = data.userProfile?.notifications?.weeklyReport;
    if (!enabled) return;
  }

  const entries = data.carbonEntries || [];
  const now = Date.now();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const lastWeeklyReport = localStorage.getItem('lastWeeklyReport');

  if (force || !lastWeeklyReport || (now - parseInt(lastWeeklyReport, 10)) >= ONE_WEEK_MS) {
    const nowDate = new Date();
    const sevenDaysAgo = new Date(nowDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(nowDate.getTime() - 14 * 24 * 60 * 60 * 1000);

    const currentWeekEntries = entries.filter(e => {
      const d = new Date(e.date);
      return d >= sevenDaysAgo && d <= nowDate;
    });

    const lastWeekEntries = entries.filter(e => {
      const d = new Date(e.date);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    });

    const currentWeekCO2 = currentWeekEntries.reduce((sum, e) => sum + (e.totalCO2 || 0), 0);
    const lastWeekCO2 = lastWeekEntries.reduce((sum, e) => sum + (e.totalCO2 || 0), 0);

    let yStr;
    if (lastWeekCO2 === 0) {
      yStr = currentWeekCO2 > 0 ? '+100%' : '0%';
    } else {
      const percent = ((currentWeekCO2 - lastWeekCO2) / lastWeekCO2) * 100;
      yStr = percent >= 0 ? `+${percent.toFixed(0)}%` : `${percent.toFixed(0)}%`;
    }

    sendNotification(
      'Weekly Summary Report',
      `Your week in review: ${currentWeekCO2.toFixed(1)} kg CO2 emitted, ${yStr} vs last week`
    );

    if (!force) {
      localStorage.setItem('lastWeeklyReport', now.toString());
    }
  }
}

/**
 * Goal Alert Notifications trigger.
 * Evaluated whenever carbon entries are updated.
 * Fires if monthly emissions exceed 80% or 100% of user monthlyGoal budget.
 * @param {Array} entries The array of carbon footprint logs
 * @param {number} goal The monthly CO2 target goal (kg)
 * @param {boolean} force If true, bypasses enabled checks and threshold checks to fire a representative test message
 */
export function checkGoalAlert(entries, goal, force = false) {
  if (!force) {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const data = JSON.parse(stored);
    const enabled = data.userProfile?.notifications?.goalAlerts;
    if (!enabled) return;
  }

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;

  // Calculate current month's emissions
  const currentMonthCO2 = entries.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, e) => sum + (e.totalCO2 || 0), 0);

  const percent = goal > 0 ? (currentMonthCO2 / goal) * 100 : 0;

  if (force) {
    // Send a realistic mock message based on current usage
    const testMsg = percent >= 100 
      ? "You've exceeded your monthly goal" 
      : `You've used ${percent.toFixed(0)}% of your monthly carbon budget`;
    sendNotification('Goal Alert', testMsg);
    return;
  }

  if (percent >= 100) {
    const last100 = localStorage.getItem('lastGoal100FiredMonth');
    if (last100 !== currentMonthKey) {
      sendNotification('Goal Alert', "You've exceeded your monthly goal");
      localStorage.setItem('lastGoal100FiredMonth', currentMonthKey);
      // Suppress 80% if 100% fires
      localStorage.setItem('lastGoal80FiredMonth', currentMonthKey);
    }
  } else if (percent >= 80) {
    const last80 = localStorage.getItem('lastGoal80FiredMonth');
    if (last80 !== currentMonthKey) {
      sendNotification('Goal Alert', "You've used 80% of your monthly carbon budget");
      localStorage.setItem('lastGoal80FiredMonth', currentMonthKey);
    }
  }
}

/**
 * Eco Tip Recommendations trigger.
 * Suggests an uncompleted tip to the user once per day.
 * @param {Array} tips List of all available eco tips
 * @param {boolean} force If true, bypasses preference and daily timestamp checks
 */
export function checkDailyTipSuggestion(tips = [], force = false) {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return;
  const data = JSON.parse(stored);

  if (!force) {
    const enabled = data.userProfile?.notifications?.ecoTips;
    if (!enabled) return;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const lastTipNotification = localStorage.getItem('lastTipNotification');

  if (force || lastTipNotification !== todayStr) {
    const completedTips = data.completedTips || [];
    const uncompleted = tips.filter(t => !completedTips.includes(t.id));

    let selectedTip;
    if (uncompleted.length > 0) {
      // Choose the first uncompleted tip
      selectedTip = uncompleted[0];
    } else if (tips.length > 0) {
      // Fallback to first tip if all are completed
      selectedTip = tips[0];
    }

    if (selectedTip) {
      sendNotification(
        'Eco Tip Recommendation',
        `Try today's tip: ${selectedTip.title} — saves ${selectedTip.co2Saved} kg CO2`
      );

      if (!force) {
        localStorage.setItem('lastTipNotification', todayStr);
      }
    }
  }
}
