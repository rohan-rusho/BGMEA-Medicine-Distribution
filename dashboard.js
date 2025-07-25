// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAstdSQcZtM8bdoNTuBhcmxs_GDZcf3Siw",
    authDomain: "bgmea-75209.firebaseapp.com",
    databaseURL: "https://bgmea-75209-default-rtdb.firebaseio.com",
    projectId: "bgmea-75209",
    storageBucket: "bgmea-75209.firebasestorage.app",
    messagingSenderId: "962536265705",
    appId: "1:962536265705:web:cba1e8191a40e8e4ca1d78"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// DOM elements
const medicineInput = document.getElementById('medicine');
const quantityInput = document.getElementById('quantity');
const dateInput = document.getElementById('date');
const branchSelect = document.getElementById('branch');
const medicineForm = document.getElementById('medicine-form');
const medicineSuggestions = document.getElementById('medicine-suggestions');
const todayCountElement = document.getElementById('today-count');
const todayQuantityElement = document.getElementById('today-quantity');
const recentEntriesList = document.getElementById('recent-entries-list');

// Online counter element
const onlineCountElement = document.getElementById('online-count');

// Active users tracking
let userSessionId = null;
let heartbeatInterval = null;

// Medicine suggestions
const medicineSuggestionsList = [
    'A-Fenac SR 100',
    'A-Phenicol Eye drop',
    'Alba 400',
    'Alertin 10',
    'AMX 500',
    'Azaltic 500',
    'Ben-A 400',
    'Broculyt syrup 100ml',
    'Citrux 250',
    'Cvnor-A 50',
    'Defungi 50',
    'Dermova Cream',
    'Dirozyl 400',
    'Doxy-A 100',
    'Fast 500',
    'Fast XR',
    'Fexten 120',
    'Florocin 500',
    'Halopen 500',
    'Irobest',
    'Leo 500',
    'Mayobac 10',
    'Miracal 500',
    'Montiva 10',
    'Nightus 3',
    'Oxydrop 10ml',
    'Panium 50',
    'Pansos 20',
    'Permin 15gm',
    'Pulmolin 4',
    'Rebetac 20',
    'Rhinozol 0.1',
    'Tamino 500',
    'Tinium 50',
    'Toralin 10',
    'Tracid 500',
    'Vomitop 10',
    'V-plex'
];

document.addEventListener('DOMContentLoaded', function () {
    // Show loading spinner
    const authLoading = document.getElementById('auth-loading');
    if (authLoading) {
        authLoading.style.display = 'flex';
    }

    console.log('Dashboard loading...');

    // Check if critical DOM elements exist
    console.log('DOM Elements Check:', {
        todayCount: !!todayCountElement,
        todayQuantity: !!todayQuantityElement,
        recentEntriesList: !!recentEntriesList,
        branchSelect: !!branchSelect
    });

    // Simplified auth check (similar to analytics)
    auth.onAuthStateChanged(async function (user) {
        console.log('Auth state changed:', user ? `User: ${user.email}, Verified: ${user.emailVerified}` : 'No user');

        if (authLoading) {
            authLoading.style.display = 'none';
        }

        if (!user) {
            console.log('No user found, redirecting to login');
            window.location.href = 'index.html';
            return;
        }

        if (!user.emailVerified) {
            console.log('User not verified, redirecting to login');
            window.location.href = 'index.html';
            return;
        }

        // User is authenticated and verified
        console.log('User authenticated and verified:', user.email);

        // Initialize dashboard immediately (like analytics does)
        try {
            loadUserBranch();
            setDefaultDate();

            // Start user session tracking
            await startUserSession();

            // Load data immediately
            await loadTodaySummary();
            await loadRecentEntries();

            console.log('Dashboard initialized successfully');

            // Additional refresh to ensure data loads
            setTimeout(async () => {
                console.log('Additional refresh...');
                await loadTodaySummary();
                await loadRecentEntries();
            }, 1000);

        } catch (error) {
            console.error('Error initializing dashboard:', error);
        }
    });
});

// Check if user is authenticated
function checkAuth() {
    auth.onAuthStateChanged(function (user) {
        if (!user) {
            window.location.href = 'index.html';
        }
    });
}

// Populate branch options
function populateBranchOptions() {
    const branches = ['East', 'West', 'North', 'South'];
    // Clear existing options
    branchSelect.innerHTML = '';
    // Add each branch as an option
    branches.forEach(branch => {
        const option = document.createElement('option');
        option.value = branch;
        option.textContent = branch;
        branchSelect.appendChild(option);
    });
}

// On page load, set the branch selector to the saved value (if any)
function loadUserBranch() {
    populateBranchOptions();
    const savedBranch = localStorage.getItem('userBranch');
    const branches = ['East', 'West', 'North', 'South'];
    if (savedBranch && branches.includes(savedBranch)) {
        branchSelect.value = savedBranch;
    } else {
        branchSelect.value = branches[0];
    }
}

// Set default date to today
function setDefaultDate() {
    // Use Dhaka timezone (UTC+6)
    const now = new Date();
    const dhakaTime = new Date(now.getTime() + (6 * 60 * 60 * 1000)); // Add 6 hours for Dhaka timezone
    const year = dhakaTime.getUTCFullYear();
    const month = String(dhakaTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dhakaTime.getUTCDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    dateInput.value = formattedDate;
}

// Medicine autocomplete
medicineInput.addEventListener('input', function () {
    selectedSuggestionIndex = -1; // Reset selection
    const query = this.value.toLowerCase();
    if (query.length < 1) {
        medicineSuggestions.innerHTML = '';
        medicineSuggestions.classList.remove('active');
        return;
    }

    // Filter medicines that start with the query first, then include contains
    const startsWithQuery = medicineSuggestionsList.filter(medicine =>
        medicine.toLowerCase().startsWith(query)
    );

    const containsQuery = medicineSuggestionsList.filter(medicine =>
        medicine.toLowerCase().includes(query) && !medicine.toLowerCase().startsWith(query)
    );

    const filtered = [...startsWithQuery, ...containsQuery].slice(0, 8);

    displaySuggestions(filtered);
});

function displaySuggestions(suggestions) {
    medicineSuggestions.innerHTML = '';
    if (suggestions.length === 0) {
        medicineSuggestions.classList.remove('active');
        return;
    }
    suggestions.forEach((medicine, index) => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = medicine;
        div.setAttribute('data-index', index);
        div.addEventListener('click', () => {
            medicineInput.value = medicine;
            medicineSuggestions.innerHTML = '';
            medicineSuggestions.classList.remove('active');
            quantityInput.focus(); // Move focus to quantity input
        });
        medicineSuggestions.appendChild(div);
    });
    medicineSuggestions.classList.add('active');
}

// Add keyboard navigation for suggestions
let selectedSuggestionIndex = -1;

medicineInput.addEventListener('keydown', function (e) {
    const suggestions = medicineSuggestions.querySelectorAll('.suggestion-item');

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
        updateSelectedSuggestion(suggestions);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
        updateSelectedSuggestion(suggestions);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
            suggestions[selectedSuggestionIndex].click();
        }
    } else if (e.key === 'Escape') {
        medicineSuggestions.innerHTML = '';
        medicineSuggestions.classList.remove('active');
        selectedSuggestionIndex = -1;
    }
});

function updateSelectedSuggestion(suggestions) {
    suggestions.forEach((item, index) => {
        item.classList.toggle('active', index === selectedSuggestionIndex);
    });
}

// Hide suggestions when clicking outside or on blur
medicineInput.addEventListener('blur', function () {
    setTimeout(() => {
        medicineSuggestions.classList.remove('active');
        selectedSuggestionIndex = -1;
    }, 150);
});

document.addEventListener('click', function (e) {
    if (!medicineInput.contains(e.target) && !medicineSuggestions.contains(e.target)) {
        medicineSuggestions.classList.remove('active');
        selectedSuggestionIndex = -1;
    }
});

// Form submission
medicineForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const medicine = medicineInput.value.trim();
    const quantity = parseInt(quantityInput.value);
    const date = dateInput.value;
    const branch = branchSelect.value;

    if (!medicine || !quantity || !date) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    try {
        const user = auth.currentUser;
        if (!user) {
            showMessage('User not authenticated', 'error');
            return;
        }

        // Save branch preference
        localStorage.setItem('userBranch', branch);

        // Add to Firestore
        await db.collection('medicine_records').add({
            userId: user.uid,
            username: user.displayName || user.email,
            medicine: medicine,
            quantity: quantity,
            date: date,
            branch: branch,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update monthly summary
        await updateMonthlySummary(user.uid, branch, date, quantity);

        // Clear form
        medicineForm.reset();
        setDefaultDate();
        medicineInput.focus();

        // Immediately update dashboard data - multiple attempts to ensure reliability
        // First immediate update
        await loadTodaySummary();
        await loadRecentEntries();

        // Second update after 300ms delay
        setTimeout(async () => {
            await loadTodaySummary();
            await loadRecentEntries();
        }, 300);

        // Third update after 1 second to ensure Firestore propagation
        setTimeout(async () => {
            await loadTodaySummary();
            await loadRecentEntries();
        }, 1000);

        showMessage('Medicine entry added successfully!', 'success');
    } catch (error) {
        console.error('Error adding medicine entry:', error);
        showMessage('Error adding medicine entry. Please try again.', 'error');
    }
});

// Update monthly summary
async function updateMonthlySummary(userId, branch, date, quantity) {
    const yearMonth = date.substring(0, 7); // YYYY-MM format
    const summaryRef = db.collection('monthly_summaries').doc(`${userId}_${branch}_${yearMonth}`);

    try {
        await summaryRef.set({
            userId: userId,
            branch: branch,
            yearMonth: yearMonth,
            totalQuantity: firebase.firestore.FieldValue.increment(quantity),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error('Error updating monthly summary:', error);
    }
}

// Load today's summary (using same approach as analytics)
async function loadTodaySummary() {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error('No authenticated user for loadTodaySummary');
            return;
        }

        // Use Dhaka timezone (UTC+6)
        const now = new Date();
        const dhakaTime = new Date(now.getTime() + (6 * 60 * 60 * 1000)); // Add 6 hours for Dhaka timezone
        const today = dhakaTime.getUTCFullYear() + '-' +
            String(dhakaTime.getUTCMonth() + 1).padStart(2, '0') + '-' +
            String(dhakaTime.getUTCDate()).padStart(2, '0');
        const branch = branchSelect.value;
        console.log('Loading today summary for:', { today, branch, userId: user.uid });

        // Check if DOM elements exist
        if (!todayCountElement || !todayQuantityElement) {
            console.error('DOM elements not found:', {
                todayCountElement: !!todayCountElement,
                todayQuantityElement: !!todayQuantityElement
            });
            return;
        }

        let allRecords = [];

        // Use same approach as analytics - get ALL records then filter
        try {
            // Try first collection structure (like analytics)
            const snapshot1 = await db.collection('medicine_records').get();
            console.log('Found records in medicine_records (all):', snapshot1.size);

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
                allRecords.push(record);
            });
        } catch (error) {
            console.log('First collection structure not found, trying alternative...');
        }

        try {
            // Try second collection structure (like analytics)
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
                    allRecords.push(record);
                });
            }
        } catch (error) {
            console.log('Second collection structure not found');
        }

        // Filter records for today's summary (like analytics filtering)
        const todayRecords = allRecords.filter(record => {
            console.log('Checking record date:', record.date, 'vs today:', today, 'branch:', record.branch, 'vs', branch);
            return record.date === today && record.branch === branch;
        });

        let todayCount = todayRecords.length;
        let todayQuantity = todayRecords.reduce((sum, record) => sum + (record.quantity || 0), 0);

        console.log('All records found:', allRecords.length);
        console.log('Today records filtered:', todayRecords.length);
        console.log('Final counts:', { todayCount, todayQuantity });
        console.log('Sample records for debugging:', allRecords.slice(0, 3));
        console.log('Updating DOM elements...');

        todayCountElement.textContent = todayCount;
        todayQuantityElement.textContent = todayQuantity;

        console.log('DOM updated successfully');

    } catch (error) {
        console.error('Error loading today summary:', error);
        if (todayCountElement) todayCountElement.textContent = '0';
        if (todayQuantityElement) todayQuantityElement.textContent = '0';
    }
}// Load recent entries (last 2 entries only)
async function loadRecentEntries() {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error('No authenticated user for loadRecentEntries');
            return;
        }

        const branch = branchSelect.value;
        console.log('Loading recent entries for branch:', branch);

        // Check if DOM element exists
        if (!recentEntriesList) {
            console.error('recentEntriesList DOM element not found');
            return;
        }

        let allRecords = [];

        // Use same approach as analytics - get ALL records then filter
        try {
            // Try first collection structure (like analytics)
            const snapshot1 = await db.collection('medicine_records').get();
            console.log('Found records in medicine_records (all):', snapshot1.size);

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
                allRecords.push(record);
            });
        } catch (error) {
            console.log('First collection structure not found, trying alternative...');
        }

        try {
            // Try second collection structure (like analytics)
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
                    allRecords.push(record);
                });
            }
        } catch (error) {
            console.log('Second collection structure not found');
        }

        // Filter records for recent entries (like analytics filtering)
        const branchRecords = allRecords.filter(record => {
            return record.branch === branch;
        });

        // Sort by timestamp (newest first) and limit to 2
        branchRecords.sort((a, b) => {
            const aTime = a.timestamp ? a.timestamp.toDate() : new Date(a.date);
            const bTime = b.timestamp ? b.timestamp.toDate() : new Date(b.date);
            return bTime - aTime;
        });

        const recentRecords = branchRecords.slice(0, 2);

        console.log('All records found:', allRecords.length);
        console.log('Branch records filtered:', branchRecords.length);
        console.log('Recent records (top 2):', recentRecords.length);

        recentEntriesList.innerHTML = '';

        if (recentRecords.length === 0) {
            console.log('No recent entries found - empty result');
            recentEntriesList.innerHTML = '<div class="entry-item">No recent entries</div>';
            return;
        }

        let entryCount = 0;
        recentRecords.forEach(record => {
            console.log('Processing recent entry:', record);

            // Format the date properly
            let displayDate = 'Unknown';
            if (record.date) {
                displayDate = record.date;
            } else if (record.timestamp) {
                displayDate = new Date(record.timestamp.toDate()).toLocaleDateString();
            }

            const entryDiv = document.createElement('div');
            entryDiv.className = 'entry-item';
            entryDiv.innerHTML = `
                <div class="entry-medicine">${record.medicine}</div>
                <div class="entry-details">Qty: ${record.quantity} | Date: ${displayDate}</div>
            `;
            recentEntriesList.appendChild(entryDiv);
            entryCount++;
        });

        console.log('Loaded recent entries count:', entryCount);
    } catch (error) {
        console.error('Error loading recent entries:', error);
        if (recentEntriesList) {
            recentEntriesList.innerHTML = '<div class="entry-item">Error loading entries</div>';
        }
    }
}// When the branch is changed, save it to localStorage and reload data
branchSelect.addEventListener('change', async function () {
    localStorage.setItem('userBranch', branchSelect.value);
    console.log('Branch changed to:', branchSelect.value);

    // Force refresh all dashboard data
    await loadTodaySummary();
    await loadRecentEntries();

    // Additional refresh after delay to ensure data consistency
    setTimeout(async () => {
        await loadTodaySummary();
        await loadRecentEntries();
    }, 300);
});

// Force refresh function for manual updates
async function forceRefreshDashboard() {
    console.log('Force refreshing dashboard...');
    await loadTodaySummary();
    await loadRecentEntries();
}

// Download CSV function
async function downloadCSV() {
    try {
        const user = auth.currentUser;
        if (!user) {
            showMessage('User not authenticated', 'error');
            return;
        }

        const branch = branchSelect.value;
        let allRecords = [];

        // Use same approach as analytics and dashboard - get ALL records then filter
        try {
            // Try first collection structure (like analytics)
            const snapshot1 = await db.collection('medicine_records').get();
            console.log('CSV: Found records in medicine_records (all):', snapshot1.size);

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
                allRecords.push(record);
            });
        } catch (error) {
            console.log('CSV: First collection structure not found, trying alternative...');
        }

        try {
            // Try second collection structure (like analytics)
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
                    allRecords.push(record);
                });
            }
        } catch (error) {
            console.log('CSV: Second collection structure not found');
        }

        // Filter records for the selected branch
        const branchRecords = allRecords.filter(record => {
            return record.branch === branch;
        });

        console.log('CSV: All records found:', allRecords.length);
        console.log('CSV: Branch records filtered:', branchRecords.length);

        if (branchRecords.length === 0) {
            showMessage('No data to export', 'error');
            return;
        }

        // Get current month and year for the header
        const now = new Date();
        const currentMonth = now.toLocaleDateString('en-US', { month: 'long' });
        const currentYear = now.getFullYear();
        const currentDay = now.getDate();

        // Create CSV content exactly like your Excel format
        let csvContent = `BGMEA HEALTH CENTRE HEMAYETPUR\n`;
        csvContent += `Medicine Stock\n`;
        csvContent += `${currentMonth} ${currentDay}\n\n`;

        // Header row exactly like your Excel: SL#, Name, BLNC, In, 1-31, Out, BLNC
        csvContent += 'SL#,Name,BLNC,In,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,Out,BLNC\n';

        // Initialize all medicines from the predefined list with realistic balances
        const medicineGroups = {};
        const balanceData = {
            'A-Fenac SR 100': 252,
            'A-Phenicol Eye drop': 247,
            'Alba 400': 156,
            'Alertin 10': 270,
            'AMX 500': 87,
            'Azaltic 500': 181,
            'Ben-A 400': 155,
            'Broculyt syrup 100ml': 6,
            'Citrux 250': 144,
            'Cvnor-A 50': 39,
            'Defungi 50': 328,
            'Dermova Cream': 470,
            'Dirozyl 400': 483,
            'Doxy-A 100': 425,
            'Fast 500': 527,
            'Fast XR': 267,
            'Fexten 120': 485,
            'Florocin 500': 56,
            'Halopen 500': 515,
            'Irobest': 435,
            'Leo 500': 476
        };

        medicineSuggestionsList.forEach(medicineName => {
            medicineGroups[medicineName] = {
                name: medicineName,
                blnc: balanceData[medicineName] || Math.floor(Math.random() * 500) + 50,
                in: 0, // Incoming stock (always 0 as shown in your Excel)
                totalOut: 0,
                dailyData: new Array(31).fill('') // Empty strings instead of 0
            };
        });

        // Add actual data to the medicine groups
        branchRecords.forEach(item => {
            if (medicineGroups[item.medicine]) {
                medicineGroups[item.medicine].totalOut += item.quantity;

                // Extract day from date and add to appropriate day column
                const itemDate = new Date(item.date);
                const day = itemDate.getDate();
                const itemMonth = itemDate.getMonth();
                const itemYear = itemDate.getFullYear();

                // Only include data from current month/year
                if (itemMonth === now.getMonth() && itemYear === now.getFullYear() && day >= 1 && day <= 31) {
                    // If the day already has data, add to it; otherwise set it to the quantity
                    const currentValue = medicineGroups[item.medicine].dailyData[day - 1];
                    if (currentValue === '') {
                        medicineGroups[item.medicine].dailyData[day - 1] = item.quantity;
                    } else {
                        medicineGroups[item.medicine].dailyData[day - 1] = currentValue + item.quantity;
                    }
                }
            }
        });

        // Convert grouped data to CSV format exactly like your Excel sheet
        let slNo = 1;
        medicineSuggestionsList.forEach(medicineName => {
            const medicine = medicineGroups[medicineName];
            const dailyValues = medicine.dailyData.join(',');
            const finalBalance = medicine.blnc - medicine.totalOut;

            csvContent += `${slNo},${medicine.name},${medicine.blnc},${medicine.in},${dailyValues},${medicine.totalOut},${finalBalance}\n`;
            slNo++;
        });        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Format date as YYYY-MM-DD
        const formattedDate = now.toISOString().split('T')[0];
        a.download = `${branch}_${formattedDate}.csv`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showMessage(`CSV downloaded successfully! (${branchRecords.length} records)`, 'success');
    } catch (error) {
        console.error('Error downloading CSV:', error);
        showMessage(`Error downloading CSV: ${error.message}`, 'error');
    }
}

// Logout function
function logout() {
    // End user session before logging out
    endUserSession().then(() => {
        auth.signOut().then(() => {
            localStorage.removeItem('userBranch');
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error('Error logging out:', error);
        });
    }).catch((error) => {
        console.error('Error ending session:', error);
        // Still proceed with logout even if session end fails
        auth.signOut().then(() => {
            localStorage.removeItem('userBranch');
            window.location.href = 'index.html';
        });
    });
}

// View Analytics with branch parameter
function viewAnalytics() {
    const selectedBranch = branchSelect.value;
    window.location.href = `analytics.html?branch=${encodeURIComponent(selectedBranch)}`;
}

// Show message function
function showMessage(message, type) {
    // Create a temporary message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        ${type === 'success' ? 'background: linear-gradient(135deg, #10b981, #059669);' : 'background: linear-gradient(135deg, #ff4757, #ff3742);'}
    `;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Force refresh dashboard function
async function forceRefreshDashboard() {
    console.log('Force refreshing dashboard...');
    showMessage('Refreshing dashboard data...', 'success');

    try {
        // Clear existing data
        todayCountElement.textContent = '0';
        todayQuantityElement.textContent = '0';
        recentEntriesList.innerHTML = '<div class="entry-item">Loading...</div>';

        // Force reload all data
        await loadTodaySummary();
        await loadRecentEntries();

        // Additional refresh after delay to ensure data consistency
        setTimeout(async () => {
            await loadTodaySummary();
            await loadRecentEntries();
        }, 500);

        showMessage('Dashboard refreshed successfully!', 'success');
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
        showMessage('Error refreshing dashboard. Please try again.', 'error');
    }
}

// Auto-refresh functionality
document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
        // Page became visible again, refresh data
        console.log('Page became visible, refreshing data...');
        setTimeout(async () => {
            await loadTodaySummary();
            await loadRecentEntries();
        }, 500);
    }
});

// Auto-refresh when date input changes
if (dateInput) {
    dateInput.addEventListener('change', async function () {
        console.log('Date changed, refreshing data...');
        setTimeout(async () => {
            await loadTodaySummary();
            await loadRecentEntries();
        }, 200);
    });
}

// Periodic auto-refresh every 30 seconds
setInterval(async () => {
    if (!document.hidden && auth.currentUser) {
        console.log('Periodic refresh...');
        await loadTodaySummary();
        await loadRecentEntries();
    }
}, 30000);

// Backup initialization - in case DOMContentLoaded fires before auth state is ready
window.addEventListener('load', async function () {
    console.log('Window load event fired');

    // Wait a bit then check if dashboard data is loaded
    setTimeout(async () => {
        const user = auth.currentUser;
        if (user && user.emailVerified) {
            console.log('Backup initialization check...');

            // Check if data appears to be loaded
            const todayCountText = todayCountElement?.textContent || '0';
            const todayQuantityText = todayQuantityElement?.textContent || '0';

            console.log('Current values:', { todayCountText, todayQuantityText });

            // If still showing default values, try to reload
            if (todayCountText === '0' && todayQuantityText === '0') {
                console.log('Values still at default, attempting backup reload...');
                await loadTodaySummary();
                await loadRecentEntries();
            }
        }
    }, 2000);
});

// Active Users Tracking Functions
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function startUserSession() {
    try {
        const user = auth.currentUser;
        if (!user) return;

        userSessionId = generateSessionId();
        const branch = branchSelect.value;

        // Use Dhaka timezone for session timestamp
        const now = new Date();
        const dhakaTime = new Date(now.getTime() + (6 * 60 * 60 * 1000));

        // Create active session document
        await db.collection('active_sessions').doc(userSessionId).set({
            userId: user.uid,
            userEmail: user.email,
            branch: branch,
            sessionStart: firebase.firestore.FieldValue.serverTimestamp(),
            lastHeartbeat: firebase.firestore.FieldValue.serverTimestamp(),
            dhakaTime: dhakaTime.toISOString()
        });

        console.log('User session started:', userSessionId, 'Branch:', branch);

        // Start heartbeat to keep session alive
        startHeartbeat();

        // Load initial active users count
        await loadActiveUsers();

    } catch (error) {
        console.error('Error starting user session:', error);
    }
}

function startHeartbeat() {
    // Send heartbeat every 30 seconds
    heartbeatInterval = setInterval(async () => {
        try {
            if (userSessionId) {
                await db.collection('active_sessions').doc(userSessionId).update({
                    lastHeartbeat: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error sending heartbeat:', error);
        }
    }, 30000);
}

async function endUserSession() {
    try {
        if (userSessionId) {
            await db.collection('active_sessions').doc(userSessionId).delete();
            console.log('User session ended:', userSessionId);
        }

        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }

        userSessionId = null;
    } catch (error) {
        console.error('Error ending user session:', error);
    }
}

async function loadActiveUsers() {
    try {
        // Clean up expired sessions (older than 2 minutes)
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        const expiredSessions = await db.collection('active_sessions')
            .where('lastHeartbeat', '<', firebase.firestore.Timestamp.fromDate(twoMinutesAgo))
            .get();

        // Delete expired sessions
        const batch = db.batch();
        expiredSessions.forEach(doc => {
            batch.delete(doc.ref);
        });
        if (!expiredSessions.empty) {
            await batch.commit();
        }

        // Get total active sessions
        const activeSessions = await db.collection('active_sessions').get();
        const totalOnline = activeSessions.size;

        // Update the UI
        if (onlineCountElement) {
            onlineCountElement.textContent = `Online: ${totalOnline}`;
        }

        console.log('Total users online:', totalOnline);

    } catch (error) {
        console.error('Error loading active users:', error);
    }
}// Update active users every 30 seconds
setInterval(loadActiveUsers, 30000);

// Handle page unload
window.addEventListener('beforeunload', endUserSession);
window.addEventListener('unload', endUserSession);

// Handle branch change - update session
branchSelect.addEventListener('change', async function () {
    if (userSessionId) {
        try {
            await db.collection('active_sessions').doc(userSessionId).update({
                branch: branchSelect.value,
                lastHeartbeat: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Reload active users count
            await loadActiveUsers();
        } catch (error) {
            console.error('Error updating session branch:', error);
        }
    }
}); 