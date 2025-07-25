// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAstdSQcZtM8bdoNTuBhcmxs_GDZcf3Siw",
    authDomain: "bgmea-75209.firebaseapp.com",
    databaseURL: "https://bgmea-75209-default-rtdb.firebaseio.com",
    projectId: "bgmea-75209",
    storageBucket: "bgmea-75209.firebasestorage.app",
    messagingSenderId: "962536265705",
    appId: "1:962536265705:web:cba1e8191a40e8e4ca1d78"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Chart elements
const freqChart = document.getElementById('freq-meds-chart');
const qtyChart = document.getElementById('total-qty-chart');
const dailyChart = document.getElementById('daily-entries-chart');
const branchChart = document.getElementById('branch-chart');

// Stat elements
const totalEntriesEl = document.getElementById('total-entries');
const totalMedicinesEl = document.getElementById('total-medicines');
const totalQuantityEl = document.getElementById('total-quantity');
const activeBranchesEl = document.getElementById('active-branches');

// Get URL parameter for branch filtering
function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Get selected branch from URL parameter
const selectedBranch = getURLParameter('branch') || 'All';

// Auth Check
auth.onAuthStateChanged(user => {
    if (!user) {
        // Redirect to login page if not authenticated
        window.location.href = 'index.html';
    } else {
        // Check if user is verified
        if (!user.emailVerified) {
            window.location.href = 'index.html';
        } else {
            fetchAndRenderAllData();
        }
    }
});

function getCurrentMonth() {
    const d = new Date();
    return d.toISOString().slice(0, 7); // YYYY-MM
}

function getLast7Days() {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
}

// Enhanced chart drawing functions
function drawPieChart(ctx, data, labels, title) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (data.length === 0 || data.every(val => val === 0)) {
        ctx.fillStyle = '#26e6e6';
        ctx.font = '16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    const total = data.reduce((a, b) => a + b, 0);
    let start = 0;
    const colors = ["#26e6e6", "#1de9b6", "#43e97b", "#ffd600", "#ff9800", "#ff5252", "#8e24aa", "#00bcd4", "#cddc39", "#e040fb"];

    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 80;

    data.forEach((val, i) => {
        if (val > 0) {
            const angle = (val / total) * 2 * Math.PI;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, start, start + angle);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            ctx.strokeStyle = '#1a1f2e';
            ctx.lineWidth = 2;
            ctx.stroke();
            start += angle;
        }
    });

    // Legend
    const legendX = centerX + radius + 20;
    let legendY = 30;

    labels.forEach((label, i) => {
        if (data[i] > 0) {
            ctx.fillStyle = colors[i % colors.length];
            ctx.fillRect(legendX, legendY, 16, 16);
            ctx.fillStyle = '#e8f4f8';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${label} (${data[i]})`, legendX + 22, legendY + 12);
            legendY += 24;
        }
    });
}

function drawBarChart(ctx, data, labels, title) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (data.length === 0 || data.every(val => val === 0)) {
        ctx.fillStyle = '#26e6e6';
        ctx.font = '16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    const max = Math.max(...data, 1);
    const padding = 40;
    const chartWidth = ctx.canvas.width - padding * 2;
    const chartHeight = ctx.canvas.height - padding * 2;
    const barWidth = chartWidth / labels.length - 10;

    data.forEach((value, i) => {
        const x = padding + i * (barWidth + 10);
        const barHeight = (value / max) * chartHeight;
        const y = ctx.canvas.height - padding - barHeight;

        // Draw bar
        ctx.fillStyle = '#26e6e6';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Draw value on top
        ctx.fillStyle = '#e8f4f8';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(value.toString(), x + barWidth / 2, y - 5);

        // Draw label
        ctx.fillText(labels[i], x + barWidth / 2, ctx.canvas.height - padding + 15);
    });
}

function drawLineChart(ctx, data, labels, title) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (data.length === 0) {
        ctx.fillStyle = '#26e6e6';
        ctx.font = '16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    const padding = 40;
    const chartWidth = ctx.canvas.width - padding * 2;
    const chartHeight = ctx.canvas.height - padding * 2;
    const max = Math.max(...data, 1);

    // Draw axes
    ctx.strokeStyle = '#26e6e6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, ctx.canvas.height - padding);
    ctx.lineTo(ctx.canvas.width - padding, ctx.canvas.height - padding);
    ctx.stroke();

    // Draw line
    ctx.strokeStyle = '#1de9b6';
    ctx.lineWidth = 3;
    ctx.beginPath();

    data.forEach((value, i) => {
        const x = padding + (i / (data.length - 1)) * chartWidth;
        const y = ctx.canvas.height - padding - (value / max) * chartHeight;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }

        // Draw point
        ctx.fillStyle = '#26e6e6';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();

        // Draw label
        ctx.fillStyle = '#e8f4f8';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        const shortLabel = labels[i].split('-')[2]; // Show only day
        ctx.fillText(shortLabel, x, ctx.canvas.height - padding + 15);

        // Draw value
        ctx.fillText(value.toString(), x, y - 10);
    });

    ctx.strokeStyle = '#1de9b6';
    ctx.stroke();
}

async function fetchAndRenderAllData() {
    try {
        // Show loading
        document.getElementById('analytics-loading').style.display = 'flex';

        // Update branch indicator
        const branchIndicator = document.getElementById('branch-indicator');
        if (branchIndicator) {
            branchIndicator.textContent = selectedBranch === 'All' ? 'Showing data for all branches' : `Showing data for ${selectedBranch} branch`;
        }

        // Update chart titles based on selected branch
        const branchSuffix = selectedBranch === 'All' ? '' : ` - ${selectedBranch} Branch`;
        document.getElementById('freq-chart-title').textContent = `Most Frequent Medicines (This Month)${branchSuffix}`;
        document.getElementById('qty-chart-title').textContent = `Total Quantity per Medicine (All Time)${branchSuffix}`;
        document.getElementById('daily-chart-title').textContent = `Daily Entries (Last 7 Days)${branchSuffix}`;
        document.getElementById('branch-chart-title').textContent = selectedBranch === 'All' ? 'Branch-wise Distribution' : `Top Medicines - ${selectedBranch} Branch`;

        console.log(`Fetching analytics data for branch: ${selectedBranch}`);

        // Fetch all medicine records from both possible collection structures
        let allRecords = [];

        try {
            // Try first collection structure
            const snapshot1 = await db.collection('medicine_records').get();
            snapshot1.forEach(doc => {
                const data = doc.data();
                const record = {
                    medicine: data.medicine || data.medicineName || 'Unknown',
                    quantity: data.quantity || 0,
                    date: data.date || '',
                    branch: data.branch || 'Unknown',
                    timestamp: data.timestamp,
                    userId: data.userId
                };

                // Filter by branch if specified
                if (selectedBranch === 'All' || record.branch === selectedBranch) {
                    allRecords.push(record);
                }
            });
        } catch (error) {
            console.log('First collection structure not found, trying alternative...');
        }

        try {
            // Try second collection structure
            const usersSnapshot = await db.collection('medicines').get();
            for (const userDoc of usersSnapshot.docs) {
                const recordsSnapshot = await db.collection('medicines').doc(userDoc.id).collection('records').get();
                recordsSnapshot.forEach(doc => {
                    const data = doc.data();
                    const record = {
                        medicine: data.medicine || data.medicineName || 'Unknown',
                        quantity: data.quantity || 0,
                        date: data.date || '',
                        branch: data.branch || 'Unknown',
                        timestamp: data.createdAt || data.timestamp,
                        userId: userDoc.id
                    };

                    // Filter by branch if specified
                    if (selectedBranch === 'All' || record.branch === selectedBranch) {
                        allRecords.push(record);
                    }
                });
            }
        } catch (error) {
            console.log('Second collection structure not found');
        }

        console.log(`Found ${allRecords.length} records for branch: ${selectedBranch}`);

        // Hide loading
        document.getElementById('analytics-loading').style.display = 'none';

        if (allRecords.length === 0) {
            renderEmptyState();
            return;
        }

        // Process data for different analytics
        renderOverallStats(allRecords);
        renderMostFrequentMedicines(allRecords);
        renderTotalQuantityPerMedicine(allRecords);
        renderDailyEntries(allRecords);
        renderBranchDistribution(allRecords);

    } catch (error) {
        console.error('Error fetching analytics data:', error);
        document.getElementById('analytics-loading').style.display = 'none';
        renderErrorState();
    }
}

function renderOverallStats(records) {
    const uniqueMedicines = new Set(records.map(r => r.medicine)).size;
    const totalQuantity = records.reduce((sum, r) => sum + r.quantity, 0);
    const activeBranches = new Set(records.map(r => r.branch)).size;

    totalEntriesEl.textContent = records.length;
    totalMedicinesEl.textContent = uniqueMedicines;
    totalQuantityEl.textContent = totalQuantity;
    activeBranchesEl.textContent = activeBranches;
}

function renderMostFrequentMedicines(records) {
    const currentMonth = getCurrentMonth();
    const monthlyRecords = records.filter(r => r.date && r.date.startsWith(currentMonth));

    const medicineCount = {};
    monthlyRecords.forEach(r => {
        medicineCount[r.medicine] = (medicineCount[r.medicine] || 0) + 1;
    });

    const sorted = Object.entries(medicineCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8);

    const labels = sorted.map(([medicine]) => medicine);
    const data = sorted.map(([, count]) => count);

    drawPieChart(freqChart.getContext('2d'), data, labels, 'Most Frequent Medicines');
}

function renderTotalQuantityPerMedicine(records) {
    const medicineQuantity = {};
    records.forEach(r => {
        medicineQuantity[r.medicine] = (medicineQuantity[r.medicine] || 0) + r.quantity;
    });

    const sorted = Object.entries(medicineQuantity)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

    const labels = sorted.map(([medicine]) => medicine.length > 15 ? medicine.substring(0, 15) + '...' : medicine);
    const data = sorted.map(([, quantity]) => quantity);

    drawBarChart(qtyChart.getContext('2d'), data, labels, 'Total Quantity per Medicine');
}

function renderDailyEntries(records) {
    const last7Days = getLast7Days();
    const dailyData = last7Days.map(date => {
        return records.filter(r => r.date === date).length;
    });

    const labels = last7Days.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    drawLineChart(dailyChart.getContext('2d'), dailyData, last7Days, 'Daily Entries');
}

function renderBranchDistribution(records) {
    if (selectedBranch !== 'All') {
        // When viewing a specific branch, show medicine distribution within that branch
        const medicineData = {};
        records.forEach(r => {
            medicineData[r.medicine] = (medicineData[r.medicine] || 0) + r.quantity;
        });

        const sorted = Object.entries(medicineData)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8); // Top 8 medicines

        const labels = sorted.map(([medicine]) => medicine.length > 12 ? medicine.substring(0, 12) + '...' : medicine);
        const data = sorted.map(([, quantity]) => quantity);

        drawPieChart(branchChart.getContext('2d'), data, labels, `Top Medicines in ${selectedBranch} Branch`);
    } else {
        // When viewing all branches, show branch comparison
        const branchData = {};
        records.forEach(r => {
            branchData[r.branch] = (branchData[r.branch] || 0) + r.quantity;
        });

        const labels = Object.keys(branchData);
        const data = Object.values(branchData);

        drawPieChart(branchChart.getContext('2d'), data, labels, 'Branch Distribution');
    }
}

function renderEmptyState() {
    const message = 'No data available yet. Start adding medicine entries to see analytics.';

    [freqChart, qtyChart, dailyChart, branchChart].forEach(canvas => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#26e6e6';
        ctx.font = '16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
    });

    totalEntriesEl.textContent = '0';
    totalMedicinesEl.textContent = '0';
    totalQuantityEl.textContent = '0';
    activeBranchesEl.textContent = '0';
}

function renderErrorState() {
    const message = 'Error loading data. Please try again later.';

    [freqChart, qtyChart, dailyChart, branchChart].forEach(canvas => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff5252';
        ctx.font = '16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Error loading data', canvas.width / 2, canvas.height / 2);
    });
}
