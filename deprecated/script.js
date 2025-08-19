const CLIENT_APP_VERSION = "1.6.1";
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxf5v0TVhZZJnGBNo19mnc2lbrYQONrgwQD3cok735RfNgPMlZWinxlRfT2sv8zcAmjfQ/exec";
const searchInput = document.getElementById('searchInput');
const resultsDiv = document.getElementById('results');
const resultsContent = document.getElementById('resultsContent');
const editForm = document.getElementById('editForm');
const addForm = document.getElementById('addForm');
const addMemberBtn = document.getElementById('addMemberBtn');
const saveBtn = document.getElementById('saveBtn');
const confirmationMessage = document.getElementById('confirmationMessage');
const editConfirmationMessage = document.getElementById('editConfirmationMessage');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const monkeyOverlay = document.getElementById('monkeyOverlay');
const lottiePlayer = document.getElementById('lottiePlayer');
const durationButtons = [...document.querySelectorAll('#addDurationButtons .action-btn')];
const typeButtons = [...document.querySelectorAll('#addTypeButtons .action-btn')];
const editTypeButtons = [...document.querySelectorAll('#editTypeButtons .action-btn')];
const extendButtons = [...document.querySelectorAll('#extendButtons .action-btn')];
const filterBtn = document.getElementById('filterBtn');
const filterPanel = document.getElementById('filterPanel');
const activeFilterBadge = document.getElementById('activeFilterBadge');
const confirmationElement = document.getElementById('confirmationMessage');

//Add form elements
const startDateInput = document.getElementById(`addStartDate`);
const addedDaysInput = document.getElementById(`addAddedDays`);
const endDateInput = document.getElementById(`addEndDate`);
const nameInput = document.getElementById('addName');
const emailInput = document.getElementById('addEmail');
const phone_numberInput = document.getElementById('addPhoneNumber');
const ageGroupInput = document.getElementById('addAgeGroup');
const openGymInput = document.getElementById('addOpenGymPunches');
const classesInput = document.getElementById('addClassesPunches');
const privateKidsInput = document.getElementById('addPrivateKidsPunches');
const privateAdultsInput = document.getElementById('addPrivateAdultsPunches');
const aerialSilksInput = document.getElementById('addAerialSilksPunches');
const notesInput = document.getElementById('addNotes');
const errorElement = document.getElementById('addError');


const backendIP = 'http://localhost:3000';

let selectedRow = null;
let editMemberOriginalData = null;
let isConfirmingSave = false;
let lastTimestamp = null;
let manualSearchActive = false;
let lastSearchTerm = '';
let cachedIndex = null;
let activityLog = [];
let historyLog = [];
let allData = [];
let currentClientUuid = null;
let historyStartRow = 1;
let historyTotalRows = 0;
let loadedDateCount = 0;
let loadedRawCount = 0;
let todayLogCount = 0;
let loadedTimestamps = new Set();
let currentECIMembers = [];
let originalSearchTerm = '';
let previousScreenState = 'eci';
let lastCheckedInMember = null;
let lastCheckedInScreen = null;
let activeMembershipFilter = null;
let currentAnimationIndex = 0;
let isSaving = false;
let activeDrawer = null;
let expandedSections = new Set();
let currentSuggestionsData = [];
let isWaiverView = false;

const FIVE_MINUTES = 5 * 60 * 1000;
const FIFTEEN_MINUTES = 15 * 60 * 1000;


const animations = [
    'https://lottie.host/e4b97d82-0dd7-4028-86a2-86fb78877164/Ig4zPsEKM5.lottie',
    'https://lottie.host/ad742ab9-f129-4dcf-b940-f7ff51f503ff/l6VoDDl2tW.lottie',
    'https://lottie.host/7277105c-70e9-42f2-8e7a-258530c53269/SNADM1HbkR.lottie',
    'https://lottie.host/e69dfb13-7186-47ab-8b5e-2d4f05d9017e/XvodpG2Nq3.lottie',
    'https://lottie.host/4876627f-7d7a-4ed0-8f5c-43e035891011/HqVT6cW29d.lottie',
    'https://lottie.host/582329d0-3e1b-4cc4-a52f-ceddc2049716/2w37Ya3nRQ.lottie',
    'https://lottie.host/96d86b4b-2d5f-4c1b-909f-17da1e8c36db/AiwHasNPLU.lottie'
];

console.log("Script.html loading, version: " + CLIENT_APP_VERSION);

window.addEventListener('load', () => {
    console.log("Window fully loaded, version: " + CLIENT_APP_VERSION);
    const refreshingFor = localStorage.getItem('refreshingForVersion');
    if (refreshingFor) {
        console.log('Page reloaded for version:', refreshingFor);
        localStorage.removeItem('refreshingForVersion');
    }
});
let expandedClassKey = null;

function lightenColor(hex, amount) {
    if (!hex) return '#808080'; // Fallback to medium grey
    hex = hex.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const newR = Math.min(255, Math.round(r + (255 - r) * amount));
    const newG = Math.min(255, Math.round(g + (255 - g) * amount));
    const newB = Math.min(255, Math.round(b + (255 - b) * amount));
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

function getContrastColor(hex) {
    if (!hex) return '#000000';
    hex = hex.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

function toggleWaiverView() {
    const waiverIframe = document.getElementById('smartwaiverIframe');
    const resultsContent = document.getElementById('resultsContent');
    const editForm = document.getElementById('editForm');
    const addForm = document.getElementById('addForm');
    const tableContainer = document.getElementById('tableContainer');
    const toggleWaiverBtn = document.getElementById('toggleWaiverBtn');
    const mainTitle = document.getElementById('mainTitle');

    if (!waiverIframe || !resultsContent || !editForm || !addForm || !tableContainer || !toggleWaiverBtn || !mainTitle) {
        console.error('toggleWaiverView: Missing DOM elements', {
            waiverIframe: !!waiverIframe,
            resultsContent: !!resultsContent,
            editForm: !!editForm,
            addForm: !!addForm,
            tableContainer: !!tableContainer,
            toggleWaiverBtn: !!toggleWaiverBtn,
            mainTitle: !!mainTitle
        });
        showError('Unable to toggle Smartwaiver view due to missing elements.', refreshData);
        return;
    }

    // Store current display states before toggling
    if (!isWaiverView) {
        resultsContent.dataset.originalDisplay = resultsContent.style.display || 'block';
        editForm.dataset.originalDisplay = editForm.style.display || 'none';
        addForm.dataset.originalDisplay = addForm.style.display || 'none';
        tableContainer.dataset.originalDisplay = tableContainer.style.display || 'block';
    }

    isWaiverView = !isWaiverView;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    console.log('toggleWaiverView: Toggling view', {
        isWaiverView,
        isMobile,
        screenWidth: window.innerWidth,
        buttonText: isWaiverView ? (isMobile ? 'MGMT' : 'Management') : (isMobile ? 'SW' : 'Smartwaiver'),
        currentSuggestionsData: !!currentSuggestionsData,
        lastSearchTerm,
        manualSearchActive
    });

    if (isWaiverView) {
        waiverIframe.style.display = 'block';
        waiverIframe.classList.add('shifted');
        resultsContent.style.display = 'none';
        editForm.style.display = 'none';
        addForm.style.display = 'none';
        tableContainer.style.display = 'none';
        toggleWaiverBtn.textContent = isMobile ? 'MGMT' : 'Management';
        mainTitle.textContent = 'Smartwaiver Console';
        console.log('toggleWaiverView: Switched to Smartwaiver view, applied shift');
        console.info('Smartwaiver iframe may generate warnings (e.g., autofocus, permissions, or extension errors). These are safe to ignore unless they impact functionality.');
    } else {
        waiverIframe.style.display = 'none';
        waiverIframe.classList.remove('shifted');
        resultsContent.style.display = resultsContent.dataset.originalDisplay || 'block';
        editForm.style.display = editForm.dataset.originalDisplay || 'none';
        addForm.style.display = addForm.dataset.originalDisplay || 'block';
        tableContainer.style.display = tableContainer.dataset.originalDisplay || 'block';
        toggleWaiverBtn.textContent = isMobile ? 'SW' : 'Smartwaiver';
        mainTitle.textContent = searchInput.value.trim() ? `Search Results for "${searchInput.value.trim()}"` : 'Loading Suggestions';
        console.log('toggleWaiverView: Switched to Management view');

        // Restore results if data exists or fetch suggestions
        if (currentSuggestionsData || lastSearchTerm || manualSearchActive || activeMembershipFilter) {
            console.log('toggleWaiverView: Restoring Management view results', {
                hasSuggestions: !!currentSuggestionsData,
                lastSearchTerm,
                manualSearchActive,
                activeMembershipFilter
            });
            displayResults(currentSuggestionsData || []);
        } else {
            console.log('toggleWaiverView: No stored data, fetching suggestions');
            fetchSuggestedCheckIns();
        }
    }

    // Handle iframe loading errors
    waiverIframe.onerror = () => {
        console.error('toggleWaiverView: Failed to load Smartwaiver iframe');
        showError('Failed to load Smartwaiver console. Please check your network or try again.', refreshData);
    };
}

function toggleClassMembers(classKey) {
    if (expandedClassKey === classKey) {
        expandedClassKey = null;
    } else {
        expandedClassKey = classKey;
    }

    const scheduleItems = document.querySelectorAll('.schedule-item');
    scheduleItems.forEach(item => {
        const content = item.querySelector('.class-members-content');
        const chevron = item.querySelector('.chevron');
        if (item.dataset.classKey === expandedClassKey) {
            item.classList.add('expanded');
            content.style.display = 'block';
            chevron.textContent = '▲';
            item.setAttribute('aria-expanded', 'true');
        } else {
            item.classList.remove('expanded');
            content.style.display = 'none';
            chevron.textContent = '▼';
            item.setAttribute('aria-expanded', 'false');
        }
    });
}
async function pingServer() {
    try {
        const res = await fetch('http://localhost:3000/api/ping');
        const text = await res.text();
        if (text === 'mvserver') {
            console.log("Server is running");
            return 1;
        }
        else {
            showError("Unexpected response from server. Please check the server status.");
            throw new Error("Unexpected response from server");
        }
    } catch (err) {
        showError("Failed to connect to server. Please ensure the server is running.");
        throw new Error("Failed to connect to server. Please ensure the server is running.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing...");
   
    // Ping the server to ensure it's running
    pingServer();

    // Initialize lottiePlayer
    if (lottiePlayer) window.lottiePlayer = lottiePlayer;
    else console.error('DOMContentLoaded: lottiePlayer element not found');
    
    addForm.style.display = 'none';
    displayResults({ passSuggestions: [], membershipSuggestions: [] });
    fetchStats();
    fetchTodayLogs();
    fetchSuggestedCheckIns();
    fetchOnlineOrders();
    setInterval(checkForCodeUpdates, 60000);
    setInterval(checkMidnightReset, 60000);
    setInterval(refreshDynamicContent, FIFTEEN_MINUTES);
    autoCloseDrawers();
    updateFloatingButtonVisibility();
    updateFilterButton();

    const toggleWaiverBtn = document.getElementById('toggleWaiverBtn');
    if (toggleWaiverBtn) {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        toggleWaiverBtn.textContent = isMobile ? 'SW' : 'Smartwaiver';
        console.log('DOMContentLoaded: Initialized toggleWaiverBtn text', {
            isMobile,
            text: toggleWaiverBtn.textContent,
            isWaiverView
        });
        toggleWaiverBtn.addEventListener('click', toggleWaiverView);
    } else {
        console.error('toggleWaiverView: toggleWaiverBtn not found');
        showError('Smartwaiver toggle button not found.', refreshData);
    }

    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
        autoCloseDrawers();
        updateFloatingButtonVisibility();
        const currentWidth = window.innerWidth;
        if ((lastWidth <= 768 && currentWidth > 768) || (lastWidth > 768 && currentWidth <= 768)) {
            if (currentSuggestionsData) {
                console.log('Screen width changed, re-rendering suggestions:', { lastWidth, currentWidth });
                displayResults(currentSuggestionsData);
            }
            if (filterPanel) filterPanel.style.display = 'none';
            updateFilterButton();
            if (toggleWaiverBtn) {
                const isMobile = window.matchMedia('(max-width: 768px)').matches;
                toggleWaiverBtn.textContent = isWaiverView ? (isMobile ? 'MGMT' : 'Management') : (isMobile ? 'SW' : 'Smartwaiver');
                console.log('resize: Updated toggleWaiverBtn text', {
                    isMobile,
                    text: toggleWaiverBtn.textContent,
                    isWaiverView,
                    currentWidth
                });
            }
        }
        lastWidth = currentWidth;
    });

    document.addEventListener('click', (event) => {
        try {
            console.log('Click event: Checking outside click', {
                target: event.target.id || event.target.className,
                screenWidth: window.innerWidth
            });

            const qrBtn = document.getElementById('qrBtn');
            if (qrBtn && qrBtn.contains(event.target)) {
                console.log('Click event: Ignored click on qrBtn');
                return;
            }

            const orderNotification = document.getElementById('orderNotification');
            const orderNotificationMobile = document.getElementById('orderNotificationMobile');
            if ((orderNotification && orderNotification.contains(event.target)) ||
                (orderNotificationMobile && orderNotificationMobile.contains(event.target))) {
                console.log('Click event: Ignored click on orderNotification or orderNotificationMobile');
                return;
            }

            const activityLog = document.getElementById('activityLog');
            const historyDrawer = document.getElementById('historyDrawer');
            const statsDrawer = document.getElementById('statsDrawer');
            const ordersDrawer = document.getElementById('ordersDrawer');
            const floatingToggleBtn = document.getElementById('floatingToggleBtn');
            const statsBar = document.querySelector('.stats-bar');
            const filterPanelElement = document.getElementById('filterPanel');
            const filterBtnElement = document.getElementById('filterBtn');
            const qrPopup = document.getElementById('qrPopup');
            const qrPopupContent = qrPopup ? qrPopup.querySelector('.qr-popup-content') : null;

            console.log('Click event: Element check', {
                activityLog: !!activityLog,
                historyDrawer: !!historyDrawer,
                statsDrawer: !!statsDrawer,
                ordersDrawer: !!ordersDrawer,
                floatingToggleBtn: !!floatingToggleBtn,
                statsBar: !!statsBar,
                filterPanelElement: !!filterPanelElement,
                filterBtnElement: !!filterBtnElement,
                qrPopup: !!qrPopup,
                qrPopupContent: !!qrPopupContent
            });

            if (!qrPopup || !qrPopupContent) {
                console.warn('Click event: QR pop-up or content not found');
            }

            // Exclude clicks within order-action, order-details, or pass-type elements
            const isOrderRelatedClick = event.target.closest('.order-action') || 
                                        event.target.closest('.order-details') || 
                                        event.target.closest('.pass-type');
            if (isOrderRelatedClick) {
                console.log('Click event: Ignored click within order-action, order-details, or pass-type');
                return;
            }

            const isOutsideDrawers = (!activityLog || !activityLog.contains(event.target)) &&
                                        (!historyDrawer || !historyDrawer.contains(event.target)) &&
                                        (!statsDrawer || !statsDrawer.contains(event.target)) &&
                                        (!ordersDrawer || !ordersDrawer.contains(event.target)) &&
                                        (!floatingToggleBtn || !floatingToggleBtn.contains(event.target)) &&
                                        (!statsBar || !statsBar.contains(event.target)) &&
                                        (!filterPanelElement || !filterPanelElement.contains(event.target)) &&
                                        (!filterBtnElement || !filterBtnElement.contains(event.target)) &&
                                        (!qrPopupContent || !qrPopupContent.contains(event.target));

            console.log('Click event: isOutsideDrawers', isOutsideDrawers);

            if (isOutsideDrawers) {
                setTimeout(() => {
                    if (activityLog && activityLog.classList.contains('open')) {
                        toggleActivityLog();
                        console.log('Click event: Closed activityLog');
                    }
                    if (historyDrawer && historyDrawer.classList.contains('open')) {
                        toggleHistoryDrawer();
                        console.log('Click event: Closed historyDrawer');
                    }
                    if (statsDrawer && statsDrawer.classList.contains('open')) {
                        toggleStatsDrawer();
                        console.log('Click event: Closed statsDrawer');
                    }
                    if (ordersDrawer && ordersDrawer.classList.contains('open')) {
                        closeOrdersDrawer();
                        console.log('Click event: Closed ordersDrawer');
                    }
                    if (filterPanelElement && filterPanelElement.style.display === 'block') {
                        filterPanelElement.style.display = 'none';
                        console.log('Click event: Closed filterPanel');
                    }
                    if (qrPopup && qrPopup.style.display === 'flex') {
                        qrPopup.style.display = 'none';
                        console.log('Click event: Closed qrPopup');
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Click event listener error:', error);
        }
    });

    const addNameInput = document.getElementById('addName');
    if (addNameInput) {
        addNameInput.addEventListener('input', updateConfirmationMessage);
    } else {
        console.error('addName input not found');
    }
   
});


function autoCloseDrawers() {
    const screenWidth = window.innerWidth;
    const activityLog = document.getElementById('activityLog');
    const statsDrawer = document.getElementById('statsDrawer');
    const ordersDrawer = document.getElementById('ordersDrawer');
    const historyDrawer = document.getElementById('historyDrawer');

    console.log('autoCloseDrawers: Checking states', {
        screenWidth,
        activityLogOpen: activityLog?.classList.contains('open'),
        statsDrawerOpen: statsDrawer?.classList.contains('open'),
        ordersDrawerOpen: ordersDrawer?.classList.contains('open'),
        historyDrawerOpen: historyDrawer?.classList.contains('open'),
        activeDrawer
    });

    if (activeDrawer === 'orders' && ordersDrawer) {
        // Keep ordersDrawer open
        ordersDrawer.classList.add('open');
        if (activityLog) activityLog.classList.remove('open');
        if (statsDrawer) statsDrawer.classList.remove('open');
        if (historyDrawer) historyDrawer.classList.remove('open');
    } else {
        // Close all drawers unless orders is active
        if (activityLog) activityLog.classList.remove('open');
        if (statsDrawer) statsDrawer.classList.remove('open');
        if (ordersDrawer) ordersDrawer.classList.remove('open');
        if (historyDrawer) historyDrawer.classList.remove('open');
        activeDrawer = null;
    }

    updateBottomBarButtons();
}

function toggleHistoryDrawer() {
    const screenWidth = window.innerWidth;
    if (screenWidth >= 1600) return;

    const historyDrawer = document.getElementById('historyDrawer');
    const activityLog = document.getElementById('activityLog');
    const statsDrawer = document.getElementById('statsDrawer');

    console.log('toggleHistoryDrawer: Toggling', {
        screenWidth,
        historyDrawerOpen: historyDrawer.classList.contains('open'),
        editFormDisplay: editForm.style.display
    });

    if (historyDrawer.classList.contains('open')) {
        historyDrawer.classList.remove('open');
        activityLog.classList.remove('open');
        statsDrawer.classList.remove('open');
        activeDrawer = null;
    } else {
        historyDrawer.classList.add('open');
        activityLog.classList.remove('open');
        statsDrawer.classList.remove('open');
        activeDrawer = 'history';
    }

    updateBottomBarButtons();
    updateFloatingButtonVisibility();
}

function updateFloatingButtonVisibility() {
    const floatingToggleBtn = document.getElementById('floatingToggleBtn');
    const screenWidth = window.innerWidth;

    if (screenWidth >= 1600 || screenWidth <= 768) {
        floatingToggleBtn.style.display = 'none';
    } else {
        floatingToggleBtn.style.display = 'block';
    }
}

function toggleActivityLog() {
    const screenWidth = window.innerWidth;
    if (screenWidth >= 1600) return;

    const activityLog = document.getElementById('activityLog');
    const statsDrawer = document.getElementById('statsDrawer');

    if (screenWidth <= 768) {
        if (activityLog.classList.contains('open')) {
            activityLog.classList.remove('open');
            statsDrawer.classList.remove('open');
            activeDrawer = null;
        } else {
            statsDrawer.classList.remove('open');
            activityLog.classList.add('open');
            activeDrawer = 'daily-checkins';
        }
    } else {
        if (activityLog.classList.contains('open')) {
            activityLog.classList.remove('open');
            statsDrawer.classList.remove('open');
            activeDrawer = null;
        } else {
            activityLog.classList.add('open');
            statsDrawer.classList.remove('open');
            activeDrawer = 'daily-checkins';
        }
    }

    updateBottomBarButtons();
    updateFloatingButtonVisibility();
}

function toggleStatsDrawer() {
    const screenWidth = window.innerWidth;
    const activityLog = document.getElementById('activityLog');
    const statsDrawer = document.getElementById('statsDrawer');
    const historyDrawer = document.getElementById('historyDrawer');
    const logContent = document.getElementById('logContent');
    const statsSection = document.querySelector('#activityLog .stats-section');

    historyDrawer.classList.remove('open');

    if (screenWidth <= 768) {
        if (statsDrawer.classList.contains('open')) {
            statsDrawer.classList.remove('open');
            activeDrawer = null;
        } else {
            activityLog.classList.remove('open');
            statsDrawer.classList.add('open');
            activeDrawer = 'stats';
            fetchStats();
        }
    } else {
        if (!activityLog.classList.contains('open')) {
            activityLog.classList.add('open');
            activeDrawer = 'daily-checkins';
        }

        if (statsDrawer.classList.contains('open')) {
            statsDrawer.classList.remove('open');
            activeDrawer = 'daily-checkins';
            if (statsSection) {
                statsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            statsDrawer.classList.add('open');
            activeDrawer = 'stats';
            fetchStats();
            if (statsSection) {
                statsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    updateBottomBarButtons();
    updateFloatingButtonVisibility();
}

function updateBottomBarButtons() {
    const buttons = document.querySelectorAll('.bottom-bar-btn');
    const activityLog = document.getElementById('activityLog');
    const historyDrawer = document.getElementById('historyDrawer');
    const statsDrawer = document.getElementById('statsDrawer');
    const ordersDrawer = document.getElementById('ordersDrawer');

    buttons.forEach(button => {
        // Update button label and handler based on edit form state and drawer type
        if (button.dataset.drawer === 'daily-checkins' || button.dataset.drawer === 'history' || button.dataset.drawer === 'transferred') {
            if (editForm.style.display === 'block') {
                button.textContent = 'History';
                button.onclick = toggleHistoryDrawer;
                button.dataset.drawer = 'history';
                console.log('updateBottomBarButtons: Set button to History', { buttonText: button.textContent });
            } else if (ordersDrawer.classList.contains('open')) {
                button.textContent = 'Transferred';
                button.onclick = toggleTransferredOrders;
                button.dataset.drawer = 'transferred';
                console.log('updateBottomBarButtons: Set button to Transferred');
            } else {
                button.textContent = 'Daily Check-Ins';
                button.onclick = toggleActivityLog;
                button.dataset.drawer = 'daily-checkins';
                console.log('updateBottomBarButtons: Set button to Daily Check-Ins');
            }
        } else if (button.dataset.drawer === 'orders') {
            button.textContent = pendingOrdersCount;
            button.onclick = showOrders;
            console.log('updateBottomBarButtons: Set button to Orders', { count: pendingOrdersCount });
            // Apply red styling if orders exist
            if (pendingOrdersCount >= 1) {
                button.classList.add('has-orders');
            } else {
                button.classList.remove('has-orders');
            }
        } else if (button.dataset.drawer === 'stats') {
            button.textContent = 'Stats Overview';
            button.onclick = toggleStatsDrawer;
            console.log('updateBottomBarButtons: Set button to Stats Overview');
        }

        // Update active state based on open drawer
        if (button.dataset.drawer === 'daily-checkins' && activityLog.classList.contains('open')) {
            button.classList.add('active');
            console.log('updateBottomBarButtons: Daily Check-Ins button active');
        } else if (button.dataset.drawer === 'history' && historyDrawer.classList.contains('open')) {
            button.classList.add('active');
            console.log('updateBottomBarButtons: History button active');
        } else if (button.dataset.drawer === 'stats' && statsDrawer.classList.contains('open')) {
            button.classList.add('active');
            console.log('updateBottomBarButtons: Stats button active');
        } else if (button.dataset.drawer === 'orders' && ordersDrawer.classList.contains('open')) {
            button.classList.add('active');
            console.log('updateBottomBarButtons: Orders button active');
        } else if (button.dataset.drawer === 'transferred' && ordersDrawer.classList.contains('open') && document.getElementById('transferredOrdersContent').classList.contains('open')) {
            button.classList.add('active');
            console.log('updateBottomBarButtons: Transferred button active');
        } else {
            button.classList.remove('active');
            console.log('updateBottomBarButtons: Button inactive', { datasetDrawer: button.dataset.drawer });
        }
    });
}

function updateConfirmationMessage() {
    const name = document.getElementById('addName').value;
    let type = getSelectedType('addType');
    const isUnlimited = document.getElementById('addAddedDays').disabled;
    if (isUnlimited) type = 'Unlimited Open Gym';
    const openGym = parseInt(document.getElementById('addOpenGymPunches').value) || 0;
    const classes = parseInt(document.getElementById('addClassesPunches').value) || 0;
    const privateKids = parseInt(document.getElementById('addPrivateKidsPunches').value) || 0;
    const privateAdults = parseInt(document.getElementById('addPrivateAdultsPunches').value) || 0;
    const aerialSilks = parseInt(document.getElementById('addAerialSilksPunches').value) || 0;
    let message = '';
    if (name) {
        message += `Adding member: ${name}`;
    }
    if (type) {
        message += message ? `, Membership: ${type === 'Unlimited Open Gym' ? 'Open Gym Unlimited' : type}` : `Membership: ${type === 'Unlimited Open Gym' ? 'Open Gym Unlimited' : type}`;
    }
    if (openGym > 0) {
        message += message ? `, Open Gym: ${openGym}` : `Open Gym: ${openGym}`;
    }
    if (classes > 0) {
        message += message ? `, Classes: ${classes}` : `Classes: ${classes}`;
    }
    if (privateKids > 0) {
        message += message ? `, Private - Kids: ${privateKids}` : `Private - Kids: ${privateKids}`;
    }
    if (privateAdults > 0) {
        message += message ? `, Private - Adults: ${privateAdults}` : `Private - Adults: ${privateAdults}`;
    }
    if (aerialSilks > 0) {
        message += message ? `, Aerial Silks: ${aerialSilks}` : `Aerial Silks: ${aerialSilks}`;
    }
    document.getElementById('confirmationMessage').textContent = message;
}

const membershipTypeCheckboxes = document.querySelectorAll('input[type="checkbox"][name="membershipType"]');
membershipTypeCheckboxes.forEach((checkbox) => {
    
  checkbox.addEventListener('click', function() {
    if (this.checked) {
      // Uncheck all other checkboxes
      membershipTypeCheckboxes.forEach((cb) => {
        if (cb !== this) cb.checked = false;
      });
    } else {
      // If clicked while checked, allow deselect (no action needed)
      this.checked = false; // just to be explicit, optional
    }
  });
});

//Dynamic Type and Duration Handling
document.getElementById("addMembershipFieldset").addEventListener('click', (event) => {
    let type = getMembershipType();
    toggleAgeGroupRow(type);
    const startRow = document.getElementById("addStartDateRow");
    const durationRow = document.getElementById("addDurationRow");
    const endRow = document.getElementById("addEndDateRow");

    startRow.style.display = type === '' ? 'none' : 'block';
    startDateInput.value = type === '' ? '' : startDateInput.value;

    durationRow.style.display = (startDateInput.value === '') ? 'none' : 'flex';
    endRow.style.display = (startDateInput.value === '') ? 'none' : 'block';
});


async function addNewMember() {

    //Clear previous error message
    errorElement.textContent = '';
    confirmationElement.textContent = '';
    isConfirmingSave = false;
    
  
    // Get values
    const name = nameInput?.value.trim() || '';
    const email = emailInput?.value.trim() || '';
    const phone_number = phone_numberInput?.value.trim() || '';
    const startDate = startDateInput?.value || '';
    const addedDays = addedDaysInput?.value || 0;
    let ageGroup = ageGroupInput?.value || '';
    
    const openGym = parseInt(openGymInput?.value) || 0;
    const classes = parseInt(classesInput?.value) || 0;
    const privateKids = parseInt(privateKidsInput?.value) || 0;
    const privateAdults = parseInt(privateAdultsInput?.value) || 0;
    const aerialSilks = parseInt(aerialSilksInput?.value) || 0;
    const notes = notesInput?.value.trim() || '';

    let isUnlimited = (addedDays === '∞');
    let type = getMembershipType();


    //Make sure account can be tied to an identity
    if (!name) {
        errorElement.textContent = 'Name cannot be empty.';
        document.getElementById('addName')?.classList.add('missing');
        return;
    } else {
        document.getElementById('addName')?.classList.remove('missing');
    }

    if (!email && !phone_number) {
        errorElement.textContent = 'Email And phone number cannot both be empty.';
        document.getElementById('addEmail')?.classList.add('missing');
        document.getElementById('addPhoneNumber')?.classList.add('missing');
        return;
    } else {
        document.getElementById('addEmail')?.classList.remove('missing');
        document.getElementById('addPhoneNumber')?.classList.remove('missing');
    }

    if ((type === 'class' || type === 'athletic') && ageGroup === '') {
        errorElement.textContent = 'Age group is required for Classes or Athletic memberships.';
        return;
    }

    if (type === 'open') ageGroup = 'NA';


    if (openGym < 0 || classes < 0 || privateKids < 0 || privateAdults < 0 || aerialSilks < 0) {
        errorElement.textContent = 'Pass counts cannot be negative.';
        return;
    }

    if (startDate && isNaN(new Date(startDate).getTime())) {
        errorElement.textContent = 'Invalid Start Date. Use YYYY-MM-DD.';
        return;
    }

    if (type !== '') {
        if (!startDate) {
            errorElement.textContent = 'Start date is required for memberships.';
            return;
        }
        if (addedDays === '' || parseInt(addedDays) <= 0) {
            errorElement.textContent = 'Day duration is required for memberships.';
            return;
        }
    }

    const isProfileEmpty = !type && !startDate && addedDays === 0 &&
                            openGym === 0 && classes === 0 &&
                            privateKids === 0 && privateAdults === 0 &&
                            aerialSilks === 0;

    if (isProfileEmpty && !isConfirmingSave) {
        
        if (confirmationElement) {
        confirmationElement.textContent = 'No membership or passes. Add anyway?';
        confirmationElement.style.display = 'inline-block';
        addMemberBtn.textContent = 'Add Anyway';
        addMemberBtn.style.minWidth = '100px';
        isConfirmingSave = true;
        }
        return;
    }

    // ---------- SEND REQUEST ----------
    addMemberBtn.disabled = true;
    addMemberBtn.style.opacity = '0.6';
    showLoading(true);

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

        // Step 1: Create Account
        const userRes = await fetch(`${backendIP}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: name,
            email: email,
            phone_number: phone_number,
            password: "",
            notes: notes,
            openGymPasses: openGym,
            classPasses: classes,
            privateKidPasses: privateKids,
            privateAdultPasses: privateAdults,
            AerialSilksPasses: aerialSilks
        }),
        signal: controller.signal
        });

        const userData = await userRes.json();
        if (!userRes.ok) throw new Error(userData.error || 'Signup failed');

        //Get new user ID after account creation
        const userId = userData.user?.id;

        // Step 2: Create membership (if applicable)
        if (type && startDate && (addedDays !== '')) {
            const start = new Date(startDate);
            const end = isUnlimited ? null : new Date(start);
            if (end) end.setDate(end.getDate() + addedDays);

            const membershipPayload = {
                userId: userId,
                type: type,
                start_date: startDate,
                end_date: isUnlimited ? null : end.toISOString().split('T')[0],
                base_length: addedDays,
                is_unlimited: isUnlimited,
                age_group: ageGroup === '' ? 'NA' : ageGroup,
            };

            const membershipRes = await fetch(`${backendIP}/api/addMembership`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(membershipPayload),
                signal: controller.signal
            });

            const membershipData = await membershipRes.json();

            if (!membershipRes.ok) throw new Error(membershipData.error || 'Membership creation failed');
        }

        clearTimeout(timeout);
        showLoading(false);
        addSuccess(userData, { startDate, addedDays, type, openGym, classes, privateKids, privateAdults, aerialSilks });
    } catch (error) {
        showLoading(false);
       
        addError(error);
    } finally {
        addMemberBtn.disabled = false;
        addMemberBtn.style.opacity = '1';
    }
}



function fetchStats() {
    google.script.run
        .withSuccessHandler((stats) => {
            updateStats(stats);
        })
        .withFailureHandler((error) => {
            console.error('Failed to fetch stats:', error);
            updateStats({ 
                unlimitedMemberships: 'Error',
                openGymMemberships: 'Error',
                classesMemberships: 'Error',
                athleticMemberships: 'Error',
                openGymPasses: 'Error', 
                classesPasses: 'Error', 
                privateKidsPasses: 'Error', 
                privateAdultsPasses: 'Error',
                aerialSilksPasses: 'Error' 
            });
        })
        .getStats();
}

function groupRelatedLogs(logs, groupByDate = false) {
  if (!logs || logs.length === 0) return [];

  if (groupByDate) {
    const logsByDate = {};
    logs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      if (!logsByDate[date]) logsByDate[date] = [];
      logsByDate[date].push(log);
    });

    return Object.keys(logsByDate).sort((a, b) => new Date(b) - new Date(a)).map(date => {
      const dateLogs = logsByDate[date];
      const detailsArray = [];
      const passUsedMap = new Map();

      dateLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      dateLogs.forEach(log => {
        if (log.actionType === 'Pass Used') {
          const key = `${log.type}`;
          if (passUsedMap.has(key)) {
            const existing = passUsedMap.get(key);
            const quantity = parseInt(log.amount) || 1;
            existing.amount = (parseInt(existing.amount) || 0) + quantity;
            existing.timestamp = log.timestamp;
            existing.time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } else {
            passUsedMap.set(key, {
              amount: log.amount || '',
              type: log.type || '',
              actionType: log.actionType || '',
              time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: log.timestamp
            });
          }
        } else {
          detailsArray.push({
            amount: log.amount || '',
            type: log.type || '',
            actionType: log.actionType || '',
            time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: log.timestamp
          });
        }
      });

      passUsedMap.forEach(entry => detailsArray.push(entry));

      return {
        date,
        timestamp: dateLogs[0].timestamp,
        name: dateLogs[0].name,
        detailsArray
      };
    });
  } else {
    const groupedLogs = [];
    let currentGroup = null;

    logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    logs.forEach(log => {
      const logTime = new Date(log.timestamp).getTime();
      if (currentGroup) {
        const lastTime = new Date(currentGroup.timestamp).getTime();
        const timeDiff = logTime - lastTime;
        if (log.name === currentGroup.name && timeDiff < FIVE_MINUTES) {
          if (!currentGroup.detailsArray) {
            currentGroup.detailsArray = [{
              amount: currentGroup.amount || '',
              type: currentGroup.type || '',
              actionType: currentGroup.actionType || ''
            }];
            delete currentGroup.amount;
            delete currentGroup.type;
          }
          const newEntry = {
            amount: log.amount || '',
            type: log.type || '',
            actionType: log.actionType || ''
          };
          if (log.actionType === 'Pass Used') {
            const quantity = parseInt(log.amount) || 1;
            const passType = log.type;
            const existingPassIndex = currentGroup.detailsArray.findIndex(entry => 
              entry.actionType === 'Pass Used' && entry.type === passType
            );
            if (existingPassIndex !== -1) {
              const currentQuantity = parseInt(currentGroup.detailsArray[existingPassIndex].amount) || 0;
              const newQuantity = currentQuantity + quantity;
              currentGroup.detailsArray[existingPassIndex].amount = newQuantity.toString();
            } else {
              currentGroup.detailsArray.push(newEntry);
            }
          } else {
            currentGroup.detailsArray.push(newEntry);
          }
          currentGroup.timestamp = log.timestamp;
        } else {
          groupedLogs.push(currentGroup);
          currentGroup = { ...log };
        }
      } else {
        currentGroup = { ...log };
      }
    });
    if (currentGroup) groupedLogs.push(currentGroup);
    return groupedLogs;
  }
}

function fetchTodayLogs() {
    const activityLogHeader = document.querySelector('#activityLog .log-header');
    if (activityLogHeader) {
        activityLogHeader.querySelector('.log-count').textContent = '(0)';
    }

    google.script.run
        .withSuccessHandler((logs) => {
            activityLog = groupRelatedLogs(logs, false);
            todayLogCount = activityLog.length;
            currentClientUuid = null;
            historyStartRow = 1;
            historyTotalRows = 0;
            updateActivityLog();
        })
        .withFailureHandler((error) => {
            console.error('Failed to fetch today logs:', error);
            showError('Failed to fetch today logs: ' + error.message);
        })
        .getTodayLogs();
}



function fetchSuggestedCheckIns(retryCount = 0, useFakeDate = false) {
    const maxRetries = 3;
    showLoading(true);
    console.log('fetchSuggestedCheckIns: Initiating fetch', { retryCount, useFakeDate });
    google.script.run
        .withSuccessHandler((suggestions) => {
            showLoading(false);
            console.log('fetchSuggestedCheckIns: Raw response:', JSON.stringify(suggestions, null, 2));
            console.log('fetchSuggestedCheckIns: Fetched suggestions', {
                suggestions: JSON.stringify(suggestions, null, 2),
                searchInputValue: searchInput.value.trim(),
                manualSearchActive,
                activeMembershipFilter,
                retryCount,
                useFakeDate
            });
            if (suggestions === 'null' || suggestions === null || suggestions === undefined) {
                console.warn(`fetchSuggestedCheckIns: Received null or "null" suggestions, retrying (${retryCount + 1}/${maxRetries})`);
                if (retryCount < maxRetries) {
                    setTimeout(() => fetchSuggestedCheckIns(retryCount + 1, useFakeDate), 1000);
                    return;
                }
                suggestions = { passSuggestions: [], membershipSuggestions: [] };
            }
            if (suggestions.error) {
                console.error('fetchSuggestedCheckIns: Server error:', suggestions.error);
            }
            currentSuggestionsData = suggestions;
            if (!searchInput.value.trim() && !manualSearchActive && !activeMembershipFilter && addForm.style.display !== 'block' && editForm.style.display !== 'block' && !isWaiverView) {
                displayResults(suggestions);
            } else {
                currentECIMembers = suggestions.passSuggestions || [];
                console.log('fetchSuggestedCheckIns: Stored suggestions but skipped rendering due to active search, filter, form, or Smartwaiver view');
            }
        })
        .withFailureHandler((error) => {
            showLoading(false);
            console.error('fetchSuggestedCheckIns: Failed:', {
                error: error.message,
                stack: error.stack,
                retryCount,
                useFakeDate
            });
            if (retryCount < maxRetries) {
                console.warn(`fetchSuggestedCheckIns: Retrying (${retryCount + 1}/${maxRetries})`);
                setTimeout(() => fetchSuggestedCheckIns(retryCount + 1, useFakeDate), 1000);
                return;
            }
            showError('Failed to fetch suggested check-ins: ' + error.message);
            currentSuggestionsData = { passSuggestions: [], membershipSuggestions: [] };
            if (!searchInput.value.trim() && !manualSearchActive && !activeMembershipFilter && addForm.style.display !== 'block' && editForm.style.display !== 'block' && !isWaiverView) {
                displayResults(currentSuggestionsData);
            }
        })
        .getSuggestedCheckIns(useFakeDate);
}

function refreshDynamicContent() {
    fetchTodayLogs();
    fetchSuggestedCheckIns();
    fetchStats();
}

function fetchClientHistory(uuid, memberName, all = false, callback) {
    const screenWidth = window.innerWidth;
    const shouldShowOverlay = screenWidth >= 768;
    if (shouldShowOverlay) {
        showLoading(true);
    }
    const limit = all ? historyTotalRows : 999;
    google.script.run
        .withSuccessHandler((response) => {
            if (shouldShowOverlay) {
                showLoading(false);
            }
            console.log(`fetchClientHistory: totalRows=${response.totalRows}, all=${all}, raw logs=${response.logs.length}`);
            const allGroupedLogs = groupRelatedLogs(response.logs, true);
            if (all) {
                historyLog = allGroupedLogs;
                loadedDateCount = allGroupedLogs.length;
            } else {
                historyLog = allGroupedLogs.slice(0, 10);
                loadedDateCount = historyLog.length;
            }
            currentClientUuid = uuid;
            currentHistoryMemberName = memberName;
            historyTotalRows = allGroupedLogs.length;
            console.log(`After fetch: historyTotalRows=${historyTotalRows}, loadedDateCount=${loadedDateCount}, historyLog.length=${historyLog.length}`);
            updateHistoryLog(memberName);
            if (typeof callback === 'function') {
                callback();
            }
        })
        .withFailureHandler((error) => {
            if (shouldShowOverlay) {
                showLoading(false);
            }
            console.error('Failed to fetch client history:', error);
            showError('Failed to fetch client history: ' + error.message);
            if (typeof callback === 'function') {
                callback();
            }
        })
        .getClientLogs(uuid, all ? 1 : 1, limit, all);
}

function checkForCodeUpdates() {
    return false;
    console.log("Checking for code updates...");
    if (!window.google || !window.google.script || !window.google.script.run) {
        console.error("Google Apps Script API unavailable, skipping version check");
        showError("Server communication unavailable, please refresh", () => window.location.reload(true));
        return;
    }
    if (document.querySelector('.error-toast')) {
        console.log("Toast already present, skipping version check prompt");
        return;
    }
    google.script.run
        .withSuccessHandler((response) => {
            console.log("Version check response:", response);
            if (!response || !response.version) {
                console.warn('No version returned from server:', response);
                showError("Server version check failed", refreshData);
                return;
            }
            const serverVersion = response.version;
            console.log("Client version: " + CLIENT_APP_VERSION + ", Server version: " + serverVersion);
            if (serverVersion !== CLIENT_APP_VERSION) {
                console.log('New version detected, prompting for reload...');
                localStorage.setItem('refreshingForVersion', serverVersion);
                const currentUrl = window.location.href.toLowerCase();
                const isDev = currentUrl.includes('/dev');
                const baseUrl = isDev
                    ? 'https://script.google.com/macros/s/AKfycbyD0mMgmNMI_gSSfoKZyyEO2w58R-z88X0KDl4IDuvp/dev'
                    : 'https://script.google.com/macros/s/AKfycbxf5v0TVhZZJnGBNo19mnc2lbrYQONrgwQD3cok735RfNgPMlZWinxlRfT2sv8zcAmjfQ/exec';
                const url = new URL(baseUrl);
                url.searchParams.set('v', serverVersion);
                url.searchParams.set('ts', new Date().getTime());
                showReloadPrompt(url.toString());
            }
        })
        .withFailureHandler((error) => {
            console.error('Version check failed:', error);
            showError("Version check failed: " + error.message, refreshData);
        })
        .getVersion();
}

function showReloadPrompt(url) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.style.backgroundColor = '#2196F3';
    toast.innerHTML = `
        A new version of the app is available. Click to reload now.
        <button onclick="reloadApp('${url}')">Reload Now</button>
        <button onclick="this.parentElement.remove()">Dismiss</button>
    `;
    document.body.appendChild(toast);
}

function reloadApp(url) {
    console.log('User initiated reload to:', url);
    try {
        window.location.href = url;
    } catch (error) {
        console.error('Reload failed:', error);
        alert('Unable to reload automatically. Please refresh the page manually to update to the latest version.');
    }
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function updateStats(stats) {
    document.getElementById('unlimitedMembershipsStats').textContent = stats.unlimitedMemberships || 0;
    document.getElementById('openGymMembershipsStats').textContent = stats.openGymMemberships || 0;
    document.getElementById('classesMembershipsStats').textContent = stats.classesMemberships || 0;
    document.getElementById('athleticMembershipsStats').textContent = stats.athleticMemberships || 0;
    document.getElementById('openGymPassesStats').textContent = stats.openGymPasses || 0;
    document.getElementById('classesPassesStats').textContent = stats.classesPasses || 0;
    document.getElementById('privateKidsPassesStats').textContent = stats.privateKidsPasses || 0;
    document.getElementById('privateAdultsPassesStats').textContent = stats.privateAdultsPasses || 0;
    document.getElementById('aerialSilksPassesStats').textContent = stats.aerialSilksPasses || 0;
}

function updateHistoryLog(memberName) {
    const logContent = document.getElementById('historyLogContent');
    const logHeader = document.getElementById('historyDrawer').querySelector('.log-header');
    const loadAllContainer = document.getElementById('loadAllContainer');

    const currentName = historyLog.length > 0 ? historyLog[0].name : memberName;
    logHeader.innerHTML = `
        <span class="log-title">History for <span class="member-name">${currentName}</span></span>
        <button class="close-log-btn" onclick="closeHistoryDrawer()">Close</button>
    `;
    console.log(`updateHistoryLog: historyTotalRows=${historyTotalRows}, loadedDateCount=${loadedDateCount}, condition=${historyTotalRows > 10 && loadedDateCount < historyTotalRows}`);
    loadAllContainer.style.display = (historyTotalRows > 10 && loadedDateCount < historyTotalRows) ? 'block' : 'none';

    logContent.innerHTML = '';

    if (historyLog.length === 0) {
        logContent.innerHTML = '<div style="padding: 15px;">No history available.</div>';
        return;
    }

    historyLog.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'log-entry';

        let detailsHtml = entry.detailsArray.map(detail => {
            const isNegative = detail.actionType === 'Pass Used';
            const signClass = isNegative ? 'minus' : 'plus';
            const sign = isNegative ? '−' : '+';
            const amount = detail.amount || '';
            const type = detail.type || '';
            const actionType = detail.actionType || '';
            let bubbleClass = '';

            if (type) {
                if (type === 'Open Gym') bubbleClass = 'open-gym';
                else if (type === 'Classes') bubbleClass = 'classes';
                else if (type === 'Private - Kids') bubbleClass = 'private-kids';
                else if (type === 'Private - Adults') bubbleClass = 'private-adults';
                else if (type === 'Aerial Silks') bubbleClass = 'aerial-silks';
                else if (type === 'Athletic') bubbleClass = 'athletic';
            }

            const displayQuantity = amount ? `${sign}${amount}` : '';
            const actionDisplay = actionType && actionType !== type && actionType !== 'Member Added' ? ' - ' + actionType : '';
            return `<div class="log-details">${displayQuantity ? `<span class="sign-number ${signClass}">${displayQuantity}</span>` : actionType} <span class="log-details-bubble ${bubbleClass}">${type !== 'Member Added' ? type : ''}</span>${actionDisplay} at ${detail.time}</div>`;
        }).join('');

        div.innerHTML = `
            <div class="log-action">${entry.date}</div>
            ${detailsHtml}
        `;
        logContent.appendChild(div);
    });
}

function checkMidnightReset() {
    const now = new Date();
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    if (minutesSinceMidnight <= 1) {
        console.log("Midnight detected, resetting activity log and suggestions...");
        fetchTodayLogs();
        fetchSuggestedCheckIns();
    }
}

function updateActivityLog() {
    const logContent = document.getElementById('logContent');
    const logHeader = document.getElementById('activityLog').querySelector('.log-header');

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    logHeader.innerHTML = `
        <span class="log-title">Daily Check-Ins <span class="log-count">(${todayLogCount})</span></span>
        <span class="log-date">${formattedDate}</span>
    `;

    logContent.innerHTML = '';

    if (activityLog.length === 0) {
        logContent.innerHTML = '<div style="padding: 15px;">No logs available today.</div>';
        return;
    }

    activityLog.slice().reverse().forEach(entry => {
        const div = document.createElement('div');
        div.className = 'log-entry';
        const timestamp = entry.timestamp ? new Date(entry.timestamp) : new Date();
        const time = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let detailsHtml = '';
        if (entry.detailsArray) {
            detailsHtml = entry.detailsArray.map(detail => {
                const isNegative = detail.actionType === 'Pass Used';
                const signClass = isNegative ? 'minus' : 'plus';
                const sign = isNegative ? '−' : '+';
                const amount = detail.amount || '';
                const type = detail.type || '';
                const actionType = detail.actionType || '';
                let bubbleClass = '';

                if (type) {
                    if (type === 'Open Gym') bubbleClass = 'open-gym';
                    else if (type === 'Classes') bubbleClass = 'classes';
                    else if (type === 'Private - Kids') bubbleClass = 'private-kids';
                    else if (type === 'Private - Adults') bubbleClass = 'private-adults';
                    else if (type === 'Aerial Silks') bubbleClass = 'aerial-silks';
                    else if (type === 'Athletic') bubbleClass = 'athletic';
                }

                const displayQuantity = amount ? `${sign}${amount}` : '';
                const actionDisplay = actionType && actionType !== type && actionType !== 'Member Added' ? ' - ' + actionType : '';
                return `<div class="log-details">${displayQuantity ? `<span class="sign-number ${signClass}">${displayQuantity}</span>` : actionType} <span class="log-details-bubble ${bubbleClass}">${type !== 'Member Added' ? type : ''}</span>${actionDisplay}</div>`;
            }).join('');
        } else {
            const signClass = (entry.actionType === 'Pass Used') ? 'minus' : 'plus';
            const sign = (entry.actionType === 'Pass Used') ? '−' : '+';
            const amount = entry.amount || '';
            const type = entry.type || '';
            const actionType = entry.actionType || '';
            let bubbleClass = '';

            if (type) {
                if (type === 'Open Gym') bubbleClass = 'open-gym';
                else if (type === 'Classes') bubbleClass = 'classes';
                else if (type === 'Private - Kids') bubbleClass = 'private-kids';
                else if (type === 'Private - Adults') bubbleClass = 'private-adults';
                else if (type === 'Aerial Silks') bubbleClass = 'aerial-silks';
                else if (type === 'Athletic') bubbleClass = 'athletic';
            }

            const displayQuantity = amount ? `${sign}${amount}` : '';
            const actionDisplay = actionType && actionType !== type && actionType !== 'Member Added' ? ' - ' + actionType : '';
            detailsHtml = `<div class="log-details">${displayQuantity ? `<span class="sign-number ${signClass}">${displayQuantity}</span>` : actionType} <span class="log-details-bubble ${bubbleClass}">${type !== 'Member Added' ? type : ''}</span>${actionDisplay}</div>`;
        }

        div.innerHTML = `
            <div class="log-action">${time} <span class="member-name" onclick="loadMember('${escapeForInline(entry.name)}')">${entry.name}</span></div>
            ${detailsHtml}
        `;
        logContent.appendChild(div);
    });
}

function loadMember(name) {
    const screenWidth = window.innerWidth;
    if (screenWidth <= 768) {
        const activityLog = document.getElementById('activityLog');
        const historyDrawer = document.getElementById('historyDrawer');
        activityLog.classList.remove('open');
        historyDrawer.classList.remove('open');
        activeDrawer = null;
        updateBottomBarButtons();
    }

    searchInput.value = name;
    manualSearchActive = true;
    lastSearchTerm = name;
    activeMembershipFilter = null;
    updateFilterButtonStates();
    showLoading(true);
    google.script.run
        .withSuccessHandler((results) => {
            showLoading(false);
            displayResults(results);
        })
        .withFailureHandler((error) => {
            showLoading(false);
            showError('Failed to load member: ' + error.message);
        })
        .searchSheet(name);
}

searchInput.addEventListener('input', debounce(async (e) => {
    const searchTerm = e.target.value.trim();
    console.log('Client-side search term:', searchTerm);

    activeMembershipFilter = null;
    updateFilterButtonStates();

    if (!searchTerm || searchTerm.length < 3) {
        manualSearchActive = false;
        fetchSuggestedCheckIns();
        lastSearchTerm = '';
        return;
    }

    manualSearchActive = true;
    lastSearchTerm = searchTerm;
    showLoading(true);

    try {
        const response = await fetch(`${backendIP}/api/searchByName`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({name: lastSearchTerm }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const results = await response.json();
        showLoading(false);
        console.log('Search results:', results); //deletethisconsole.log
        //Only display if user hasn't typed something new
        if (manualSearchActive && searchTerm === lastSearchTerm) {
            displayResults(results);
        }
    } catch (error) {
        showLoading(false);
        manualSearchActive = false;
        searchError(error);
    }
}, 300));


function filterByType(type) {
    console.log('filterByType:', type);
    const filterButtons = document.querySelectorAll('.search-container .type-btn');

    if (activeMembershipFilter === type) {
        activeMembershipFilter = null;
        manualSearchActive = false;
        searchInput.value = '';
        lastSearchTerm = '';
        updateFilterButtonStates();
        updateFilterButton();
        if (filterPanel) filterPanel.style.display = 'none';
        fetchSuggestedCheckIns();
        return;
    }

    activeMembershipFilter = type;
    manualSearchActive = false;
    updateFilterButtonStates();
    updateFilterButton();
    if (filterPanel) filterPanel.style.display = 'none';

    const searchTerm = searchInput.value.trim();
    showLoading(true);
    if (searchTerm && lastSearchTerm) {
        google.script.run
            .withSuccessHandler((results) => {
                showLoading(false);
                previousScreenState = 'filter';
                displayResults(results);
            })
            .withFailureHandler((error) => {
                showLoading(false);
                activeMembershipFilter = null;
                updateFilterButtonStates();
                updateFilterButton();
                showError('Failed to filter memberships: ' + error.message);
            })
            .filterByMembershipType(type, lastSearchTerm);
    } else {
        google.script.run
            .withSuccessHandler((results) => {
                showLoading(false);
                previousScreenState = 'filter';
                displayResults(results);
            })
            .withFailureHandler((error) => {
                showLoading(false);
                activeMembershipFilter = null;
                updateFilterButtonStates();
                updateFilterButton();
                showError('Failed to filter memberships: ' + error.message);
            })
            .filterByMembershipType(type);
    }
}

function updateFilterButton() {
    console.log('updateFilterButton:', { activeMembershipFilter });
    if (!filterBtn) {
        console.error('updateFilterButton: Missing filterBtn');
        return;
    }

    // Only update in mobile view (<=768px)
    if (window.innerWidth > 768) {
        return;
    }

    if (activeMembershipFilter) {
        const typeClass = activeMembershipFilter === 'Unlimited Open Gym'
            ? 'unlimited'
            : activeMembershipFilter.toLowerCase().replace(' ', '-');
        const displayText = activeMembershipFilter === 'Unlimited Open Gym' ? 'Unlimited' : activeMembershipFilter;
        filterBtn.textContent = displayText;
        filterBtn.className = `filter-btn ${typeClass}`;
    } else {
        filterBtn.textContent = 'Filter';
        filterBtn.className = 'filter-btn';
    }
}

function clearSearch() {
    searchInput.value = '';
    addForm.style.display = 'none';
    editForm.style.display = 'none';
    document.getElementById('tableContainer').style.display = 'block';
    resultsDiv.style.display = 'block';
    manualSearchActive = false;
    lastSearchTerm = '';
    activeMembershipFilter = null;
    isOrdersView = false;
    closeOrdersDrawer();
    updateFilterButtonStates();
    updateFilterButton();
    if (filterPanel) filterPanel.style.display = 'none';
    document.getElementById('mainTitle').textContent = 'Loading Suggestions';
    fetchSuggestedCheckIns();
    fetchTodayLogs();
    closeHistoryDrawer();
}

function toggleTransferredOrderDetails(orderId) {
    const detailsDiv = document.getElementById(`transferred-details-${orderId}`);
    if (openTransferredOrderId === orderId) {
        detailsDiv.style.display = 'none';
        openTransferredOrderId = null;
    } else {
        if (openTransferredOrderId) {
            document.getElementById(`transferred-details-${openTransferredOrderId}`).style.display = 'none';
        }
        detailsDiv.style.display = 'block';
        openTransferredOrderId = orderId;
    }
}

function refreshData() {
    const searchTerm = searchInput.value.trim();
    showLoading(true);
    allData = [];

    if (isOrdersView) {
        showOrders();
        showLoading(false);
    } else if (activeMembershipFilter) {
        previousScreenState = 'filter';
        google.script.run
            .withSuccessHandler((results) => {
                console.log('refreshData: Fetched filtered memberships:', results);
                displayResults(results);
                fetchTodayLogs();
                fetchStats();
                closeHistoryDrawer();
                showLoading(false);
                updateBottomBarButtons();
            })
            .withFailureHandler((error) => {
                console.error('refreshData: Error fetching filtered memberships:', error);
                showLoading(false);
                showError('Failed to refresh filtered memberships: ' + error.message);
                updateBottomBarButtons();
            })
            .filterByMembershipType(activeMembershipFilter, searchTerm && lastSearchTerm ? lastSearchTerm : null);
    } else if (!searchTerm) {
        manualSearchActive = false;
        previousScreenState = 'eci';
        google.script.run
            .withSuccessHandler((suggestedMembers) => {
                console.log('refreshData: Fetched suggested check-ins:', suggestedMembers);
                displayResults(suggestedMembers);
                fetchTodayLogs();
                fetchStats();
                closeHistoryDrawer();
                showLoading(false);
                updateBottomBarButtons();
            })
            .withFailureHandler((error) => {
                console.error('refreshData: Error fetching suggested check-ins:', error);
                showLoading(false);
                searchError(error);
                updateBottomBarButtons();
            })
            .getSuggestedCheckIns();
    } else {
        manualSearchActive = true;
        lastSearchTerm = searchTerm;
        previousScreenState = 'search';
        google.script.run
            .withSuccessHandler((results) => {
                displayResults(results);
                fetchTodayLogs();
                fetchStats();
                closeHistoryDrawer();
                showLoading(false);
                updateBottomBarButtons();
            })
            .withFailureHandler((error) => {
                manualSearchActive = false;
                showLoading(false);
                searchError(error);
                updateBottomBarButtons();
            })
            .searchSheet(searchTerm);
    }
}

function escapeForInline(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/\\/g, '\\\\')
              .replace(/'/g, "\\'")
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n');
}

function displayResults(data) {

    const mainTitle = document.getElementById('mainTitle');
    const tableContainer = document.getElementById('tableContainer');

    if (!mainTitle || !tableContainer) {
        console.error('displayResults: Missing required DOM elements', {
            mainTitle: !!mainTitle,
            tableContainer: !!tableContainer
        });
        return;
    }

    // Store data even in Smartwaiver view
    currentSuggestionsData = data;

    if (isWaiverView) {
        console.log('displayResults: Stored data for Management view but skipped rendering due to Smartwaiver view');
        return;
    }

    tableContainer.innerHTML = '';

    const searchTerm = searchInput.value.trim();
    const isEmptySearch = !searchTerm || searchTerm.length < 3;

    // Handle search/filter rendering first
    if (activeMembershipFilter) {
        previousScreenState = 'filter';
        console.log('displayResults: Rendering filtered memberships table', { members: data, filter: activeMembershipFilter });
        mainTitle.textContent = `Filtered by ${activeMembershipFilter} (${Array.isArray(data) ? data.length : 0})`;
        renderSearchOrFilterResults(data || [], tableContainer);
        return;
    } else if (!isEmptySearch && manualSearchActive) {
        previousScreenState = 'search';
        console.log('displayResults: Rendering search results table', { members: data });
        mainTitle.textContent = `Search Results for "${searchTerm}" (${Array.isArray(data) ? data.length : 0})`;
        renderSearchOrFilterResults(data || [], tableContainer);
        return;
    }

    // ECI (suggestions) rendering
    if (isEmptySearch && !manualSearchActive && !activeMembershipFilter) {
        previousScreenState = 'eci';
        const isSuggestionObject = data && typeof data === 'object' && (data.passSuggestions || data.membershipSuggestions || data.allClasses);
        const members = isSuggestionObject ? (data.passSuggestions || []) : (Array.isArray(data) ? data : []);
        const membershipSuggestions = isSuggestionObject ? (data.membershipSuggestions || []) : [];
        const allClasses = isSuggestionObject ? (data.allClasses || []) : [];
        currentECIMembers = members;

        console.log('displayResults: Rendering ECI table', {
            passSuggestions: members,
            membershipSuggestions,
            allClasses,
            memberGroupsKeys: Object.keys(groupMembershipSuggestions(membershipSuggestions, allClasses).memberGroups)
        });

        const now = new Date();
        const startTime = new Date(now.getTime() - 30 * 60 * 1000);
        const endTime = new Date(now.getTime() + 30 * 60 * 1000);
        const formatTime = (date) => {
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        };
        const startTimeStr = formatTime(startTime);
        const endTimeStr = formatTime(endTime);
        const timeRangeLabel = `Upcoming Check-Ins (${startTimeStr} - ${endTimeStr})`;

        mainTitle.textContent = timeRangeLabel;

        const screenWidth = window.innerWidth;

        // Initialize containers
        const scheduleContainer = document.createElement('div');
        scheduleContainer.className = 'schedule-container';
        scheduleContainer.style.marginTop = '0px';

        let passContainer;
        if (screenWidth <= 768) {
            passContainer = document.createElement('div');
            passContainer.className = 'suggestions-card-container';
        } else {
            passContainer = document.createElement('div');
            passContainer.className = 'pass-suggestions-container';
        }

        const memberGroupsContainer = document.createElement('div');
        memberGroupsContainer.className = 'member-groups-container';
        memberGroupsContainer.style.marginTop = '0px';

        // Section 1: Class Schedule
        const { schedule, memberGroups } = groupMembershipSuggestions(membershipSuggestions, allClasses);

        if (screenWidth <= 768) {
            const scheduleList = document.createElement('div');
            scheduleList.className = 'schedule-list';
            if (schedule.length > 0) {
                schedule.forEach((cls, index) => {
                    const scheduleItem = document.createElement('div');
                    scheduleItem.className = 'schedule-item';
                    scheduleItem.style.backgroundColor = cls.backgroundColor || '#808080';
                    scheduleItem.style.color = cls.textColor || '#000000';
                    scheduleItem.dataset.classKey = `${cls.time}|${cls.classType}|${cls.classAgeGroup}`;
                    scheduleItem.setAttribute('aria-expanded', 'false');

                    // Normalize classAgeGroup and classType
                    const classAgeGroup = cls.classAgeGroup.trim();
                    const classType = cls.classType.trim();

                    // Log for debugging
                    console.log('Processing class badge', {
                        classTime: cls.time,
                        classType: classType,
                        classAgeGroup: classAgeGroup,
                        memberGroupsKeys: Object.keys(memberGroups),
                        membershipSuggestionsLength: membershipSuggestions.length
                    });

                    // Filter members from membershipSuggestions based on classAgeGroup, classType, and status
                    let members = membershipSuggestions.filter(suggestion => {
                        const suggestionAgeGroup = suggestion[14]?.trim();
                        const suggestionClassType = suggestion[16]?.trim();
                        const membershipType = suggestion[5];
                        const classesPasses = parseInt(suggestion[7]) || 0;
                        const openGymPasses = parseInt(suggestion[6]) || 0;
                        const privateAdultsPasses = parseInt(suggestion[9]) || 0;
                        const aerialSilksPasses = parseInt(suggestion[10]) || 0;
                        const status = suggestion[18] || '';
                        const isActive = status === 'Active' || status === 'Recently Expired';

                        // Check classType match
                        const typeMatch = suggestionClassType === classType;

                        // Check ageGroup match
                        let ageMatch = false;
                        if (classAgeGroup === 'Kids') {
                            ageMatch = suggestionAgeGroup === 'Kids';
                        } else if (classAgeGroup === 'Teens') {
                            ageMatch = suggestionAgeGroup === 'Teens';
                        } else if (classAgeGroup === 'Adults') {
                            ageMatch = suggestionAgeGroup === 'Adults';
                        } else if (classAgeGroup === 'Teens & Adults') {
                            ageMatch = suggestionAgeGroup === 'Teens' || suggestionAgeGroup === 'Adults';
                        } else if (classAgeGroup === 'Parent & Child') {
                            ageMatch = true; // Any age group
                        } else if (classAgeGroup === 'Women’s Only' || classAgeGroup === "Women's Only") {
                            ageMatch = suggestionAgeGroup === 'Adults';
                        }

                        // Check membership eligibility
                        const isEligible = isActive && (
                            membershipType === 'Classes' ||
                            membershipType === 'Athletic' ||
                            classesPasses > 0 ||
                            openGymPasses > 0 ||
                            privateAdultsPasses > 0 ||
                            aerialSilksPasses > 0
                        );

                        return typeMatch && ageMatch && isEligible;
                    });

                    // Remove duplicates by UUID
                    const seenUUIDs = new Set();
                    members = members.filter(member => {
                        const uuid = member[0];
                        if (seenUUIDs.has(uuid)) return false;
                        seenUUIDs.add(uuid);
                        return true;
                    });

                    // Sort members alphabetically by name (index 1)
                    members.sort((a, b) => a[1].localeCompare(b[1]));

                    // Log members for debugging
                    console.log('Members for class badge', {
                        classAgeGroup,
                        classType,
                        memberCount: members.length,
                        members: members.map(m => ({ name: m[1], ageGroup: m[14], membershipType: m[5], classType: m[16], status: m[18] }))
                    });

                    // Compute lighter background color
                    const lighterColor = lightenColor(cls.backgroundColor, 0.5);
                    const textColor = getContrastColor(lighterColor);

                    // Create table for members
                    let membersHtml = '';
                    if (members.length > 0) {
                        membersHtml = `
                            <table class="suggestions-table">
                                <tbody>
                                    ${members.map(suggestion => {
                                        const row = createMembershipTableRow(suggestion);
                                        return row.outerHTML;
                                    }).join('')}
                                </tbody>
                            </table>
                        `;
                    } else {
                        membersHtml = '<div class="no-members">No eligible members for this class.</div>';
                    }

                    scheduleItem.innerHTML = `
                        <div class="time">${cls.time}</div>
                        <div class="class-name">${cls.classType}</div>
                        <div class="age-group">${cls.classAgeGroup}</div>
                        <div class="chevron">${expandedClassKey === scheduleItem.dataset.classKey ? '▲' : '▼'}</div>
                        <div class="class-members-content" style="display: ${expandedClassKey === scheduleItem.dataset.classKey ? 'block' : 'none'}; background-color: ${lighterColor}; color: ${textColor}">
                            ${membersHtml}
                        </div>
                    `;

                    // Add click event listener to toggle, but ignore clicks in class-members-content
                    scheduleItem.addEventListener('click', (event) => {
                        const target = event.target;
                        if (target.closest('.class-members-content')) {
                            return;
                        }
                        toggleClassMembers(scheduleItem.dataset.classKey);
                    });

                    // Add event listeners to copyable names and edit buttons to stop propagation
                    if (members.length > 0) {
                        const contentDiv = scheduleItem.querySelector('.class-members-content');
                        contentDiv.querySelectorAll('.copyable-name').forEach(nameElement => {
                            nameElement.addEventListener('click', (event) => {
                                event.stopPropagation();
                                const name = nameElement.textContent;
                                navigator.clipboard.writeText(name).then(() => {
                                    nameElement.classList.add('copied');
                                    setTimeout(() => nameElement.classList.remove('copied'), 1000);
                                }).catch(err => {
                                    console.error('Failed to copy name:', err);
                                    alert('Failed to copy name. Please copy it manually.');
                                });
                            });
                        });

                        contentDiv.querySelectorAll('.edit-btn').forEach(editButton => {
                            editButton.addEventListener('click', (event) => {
                                event.stopPropagation();
                                const row = editButton.closest('tr');
                                const name = row.querySelector('.copyable-name').textContent;
                                const suggestion = members.find(m => m[1] === name);
                                if (suggestion) {
                                    const [uuid, , startDate, addedDays, endDate, type, openGym, classes, privateKids, privateAdults, aerialSilks, notes, , , ageGroup] = suggestion;
                                    editMember(name, startDate || '', addedDays || 0, endDate || '', type || '', parseInt(openGym) || 0, parseInt(classes) || 0, parseInt(privateKids) || 0, parseInt(privateAdults) || 0, parseInt(aerialSilks) || 0, notes || '', uuid, ageGroup || '');
                                }
                            });
                        });
                    }

                    scheduleList.appendChild(scheduleItem);
                });
            } else {
                scheduleList.innerHTML = '<div class="no-classes">No classes scheduled at this time.</div>';
                console.log('displayResults: Rendered no-classes message for mobile');
            }
            scheduleContainer.appendChild(scheduleList);
        } else {
            const scheduleRow = document.createElement('div');
            scheduleRow.className = 'schedule-row';

            if (schedule.length > 0) {
                const maxColumns = 4;
                const maxItemsPerColumn = Math.ceil(schedule.length / maxColumns);
                let currentColumn = null;

                schedule.forEach((cls, index) => {
                    if (index % maxItemsPerColumn === 0) {
                        currentColumn = document.createElement('div');
                        currentColumn.className = 'schedule-column';
                        scheduleRow.appendChild(currentColumn);
                    }

                    const scheduleItem = document.createElement('div');
                    scheduleItem.className = 'schedule-item';
                    scheduleItem.style.backgroundColor = cls.backgroundColor;
                    scheduleItem.style.color = cls.textColor;
                    scheduleItem.innerHTML = `
                        <div class="time">${cls.time}</div>
                        <div class="class-name">${cls.classType}</div>
                        <div class="age-group">${cls.classAgeGroup}</div>
                    `;
                    currentColumn.appendChild(scheduleItem);
                });
            } else {
                scheduleRow.innerHTML = '<div class="no-classes">No classes scheduled at this time.</div>';
                console.log('displayResults: Rendered no-classes message for desktop');
            }

            scheduleContainer.appendChild(scheduleRow);
        }

        // Section 2: Column Titles for Pass-Based Suggestions
        const columnTitles = document.createElement('div');
        columnTitles.className = 'column-titles';
        columnTitles.innerHTML = `
            <table class="results-table">
                <thead>
                    <tr>
                        <th id="colName" class="name-column">Name</th>
                        <th id="colMembership" class="membership-column">Available Memberships & Passes</th>
                        <th id="colPasses" class="passes-column"></th>
                        <th id="colActions" class="actions-column"></th>
                    </tr>
                </thead>
            </table>
        `;
        passContainer.appendChild(columnTitles);

        // Section 3: Pass-Based Suggestions
        if (screenWidth <= 768) {
            if (members.length > 0) {
                members.forEach(member => {
                    const [uuid, name, startDate, addedDays, endDate, type, openGym, classes, privateKids, privateAdults, aerialSilks, notes, daysLeft, ageGroup, , , , status] = member;
                    const isUnlimited = type === 'Unlimited Open Gym';
                    const isActive = status === 'Active' || status === 'Recently Expired';
                    if (!isActive && !isUnlimited && daysLeft < 0) return; // Skip non-active, expired memberships for suggestions

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const start = startDate ? new Date(startDate) : undefined;
                    const isActiveMembership = type && (isUnlimited || (start && start <= today && daysLeft >= 0));
                    const displayType = isUnlimited ? 'Open Gym' : type;

                    let membershipHTML = '';
                    if (isActiveMembership) {
                        membershipHTML = `<span class="type-badge type-${type.toLowerCase().replace(' ', '-') || ''}">${displayType}</span>`;
                    }

                    const passes = [];
                    const openGymPunches = parseInt(openGym) || 0;
                    const classesPunches = parseInt(classes) || 0;
                    const privateKidsPunches = parseInt(privateKids) || 0;
                    const privateAdultsPunches = parseInt(privateAdults) || 0;
                    const aerialSilksPunches = parseInt(aerialSilks) || 0;

                    if (openGymPunches > 0) {
                        passes.push({
                            type: 'openGym',
                            label: 'Open Gym',
                            count: openGymPunches,
                            class: 'open-gym'
                        });
                    }
                    if (classesPunches > 0) {
                        passes.push({
                            type: 'classes',
                            label: 'Classes',
                            count: classesPunches,
                            class: 'classes'
                        });
                    }
                    if (privateKidsPunches > 0) {
                        passes.push({
                            type: 'privateKids',
                            label: 'Private - Kids',
                            count: privateKidsPunches,
                            class: 'private-kids'
                        });
                    }
                    if (privateAdultsPunches > 0) {
                        passes.push({
                            type: 'privateAdults',
                            label: 'Private - Adults',
                            count: privateAdultsPunches,
                            class: 'private-adults'
                        });
                    }
                    if (aerialSilksPunches > 0) {
                        passes.push({
                            type: 'aerialSilks',
                            label: 'Aerial Silks',
                            count: aerialSilksPunches,
                            class: 'aerial-silks'
                        });
                    }

                    const card = document.createElement('div');
                    card.className = 'suggestion-card';
                    card.setAttribute('data-name', name);

                    const nameRow = document.createElement('div');
                    nameRow.className = 'suggestion-card-row suggestion-card-name';
                    nameRow.innerHTML = `
                        <span class="copyable-name" title="Click to copy name">${name}</span>
                        <button class="action-btn edit-btn" style="min-width:71px;">Edit</button>
                    `;
                    card.appendChild(nameRow);

                    if (membershipHTML) {
                        const membershipRow = document.createElement('div');
                        membershipRow.className = 'suggestion-card-row suggestion-card-membership';
                        membershipRow.innerHTML = `
                            <div class="membership-info">${membershipHTML}</div>
                        `;
                        card.appendChild(membershipRow);
                    }

                    passes.slice(0, 3).forEach(pass => {
                        const passRow = document.createElement('div');
                        passRow.className = 'suggestion-card-row suggestion-card-pass';
                        passRow.innerHTML = `
                            <span class="pass-bubble ${pass.class}"><span class="pass-number">${pass.count}</span> ${pass.label}</span>
                            <button class="suggestion-use-btn" data-pass-type="${pass.type}">USE</button>
                        `;
                        card.appendChild(passRow);
                    });

                    const nameElement = card.querySelector('.copyable-name');
                    nameElement.addEventListener('click', () => {
                        navigator.clipboard.writeText(name).then(() => {
                            nameElement.classList.add('copied');
                            setTimeout(() => nameElement.classList.remove('copied'), 1000);
                        }).catch(err => {
                            console.error('Failed to copy name:', err);
                            alert('Failed to copy name. Please copy it manually.');
                        });
                    });

                    const editButton = card.querySelector('.edit-btn');
                    editButton.addEventListener('click', () => {
                        editMember(name, startDate || '', addedDays || 0, endDate || '', type || '', openGymPunches, classesPunches, privateKidsPunches, privateAdultsPunches, aerialSilksPunches, notes || '', uuid, ageGroup || '');
                    });

                    const usePassButtons = card.querySelectorAll('.suggestion-use-btn');
                    usePassButtons.forEach(button => {
                        const passType = button.dataset.passType;
                        button.addEventListener('click', () => {
                            subtractPass(name, passType, openGymPunches, classesPunches, privateKidsPunches, privateAdultsPunches, aerialSilksPunches, button, false);
                        });
                    });

                    passContainer.appendChild(card);
                });
            } else {
                passContainer.innerHTML = '<div class="no-suggestions">No pass-based suggestions available.</div>';
            }
        } else {
            const passTable = document.createElement('table');
            passTable.className = 'results-table suggestions-table';
            passTable.innerHTML = `<tbody></tbody>`;
            const passTbody = passTable.querySelector('tbody');

            if (members.length > 0) {
                members.forEach(member => {
                    const [uuid, name, startDate, addedDays, endDate, type, openGym, classes, privateKids, privateAdults, aerialSilks, notes, daysLeft, ageGroup, , , , status] = member;
                    const isUnlimited = type === 'Unlimited Open Gym';
                    const isActive = status === 'Active' || status === 'Recently Expired';
                    if (!isActive && !isUnlimited && daysLeft < 0) return; // Skip non-active, expired memberships for suggestions

                    let membershipHTML = '';
                    let passesHTML = '';

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const start = startDate ? new Date(startDate) : undefined;
                    const isActiveMembership = type && (isUnlimited || (start && start <= today && daysLeft >= 0));
                    const displayType = isUnlimited ? 'Open Gym' : type;

                    if (isActiveMembership) {
                        membershipHTML = `<span class="type-badge type-${type.toLowerCase().replace(' ', '-') || ''}">${displayType}</span>`;
                    }

                    const openGymPunches = parseInt(openGym) || 0;
                    const classesPunches = parseInt(classes) || 0;
                    const privateKidsPunches = parseInt(privateKids) || 0;
                    const privateAdultsPunches = parseInt(privateAdults) || 0;
                    const aerialSilksPunches = parseInt(aerialSilks) || 0;

                    if (openGymPunches > 0) passesHTML += `
                        <div class="pass-item">
                            <span class="pass-bubble open-gym"><span class="pass-number">${openGymPunches}</span> Open Gym</span>
                            <button class="suggestion-use-btn" data-pass-type="openGym">USE</button>
                        </div>`;
                    if (classesPunches > 0) passesHTML += `
                        <div class="pass-item">
                            <span class="pass-bubble classes"><span class="pass-number">${classesPunches}</span> Classes</span>
                            <button class="suggestion-use-btn" data-pass-type="classes">USE</button>
                        </div>`;
                    if (privateKidsPunches > 0) passesHTML += `
                        <div class="pass-item">
                            <span class="pass-bubble private-kids"><span class="pass-number">${privateKidsPunches}</span> Private - Kids</span>
                            <button class="suggestion-use-btn" data-pass-type="privateKids">USE</button>
                        </div>`;
                    if (privateAdultsPunches > 0) passesHTML += `
                        <div class="pass-item">
                            <span class="pass-bubble private-adults"><span class="pass-number">${privateAdultsPunches}</span> Private - Adults</span>
                            <button class="suggestion-use-btn" data-pass-type="privateAdults">USE</button>
                        </div>`;
                    if (aerialSilksPunches > 0) passesHTML += `
                        <div class="pass-item">
                            <span class="pass-bubble aerial-silks"><span class="pass-number">${aerialSilksPunches}</span> Aerial Silks</span>
                            <button class="suggestion-use-btn" data-pass-type="aerialSilks">USE</button>
                        </div>`;
                    if (passesHTML) passesHTML = `<div class="badge-container">${passesHTML}</div>`;

                    const row = document.createElement('tr');
                    row.className = 'suggestion-row';
                    row.setAttribute('data-name', name);
                    row.innerHTML = `
                        <td class="name-column"><span class="copyable-name" title="Click to copy name">${name}</span></td>
                        <td class="membership-column">${membershipHTML || ''}</td>
                        <td class="passes-column">${passesHTML || 'No Passes'}</td>
                        <td class="actions-column"><button class="action-btn edit-btn">Edit</button></td>
                    `;

                    const nameElement = row.querySelector('.copyable-name');
                    nameElement.addEventListener('click', () => {
                        navigator.clipboard.writeText(name).then(() => {
                            nameElement.classList.add('copied');
                            setTimeout(() => nameElement.classList.remove('copied'), 1000);
                        }).catch(err => {
                            console.error('Failed to copy name:', err);
                            alert('Failed to copy name. Please copy it manually.');
                        });
                    });

                    const editButton = row.querySelector('.edit-btn');
                    editButton.addEventListener('click', () => {
                        editMember(name, startDate || '', addedDays || 0, endDate || '', type || '', openGymPunches, classesPunches, privateKidsPunches, privateAdultsPunches, aerialSilksPunches, notes || '', uuid, ageGroup || '');
                    });

                    const usePassButtons = row.querySelectorAll('.suggestion-use-btn');
                    usePassButtons.forEach(button => {
                        const passType = button.dataset.passType;
                        button.addEventListener('click', () => {
                            subtractPass(name, passType, openGymPunches, classesPunches, privateKidsPunches, privateAdultsPunches, aerialSilksPunches, button, false);
                        });
                    });

                    passTbody.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                row.innerHTML = `<td style="text-align:center;color:#666;padding:15px 0;">No pass-based suggestions available.</td>`;
                passTbody.appendChild(row);
            }

            passContainer.appendChild(passTable);
        }

        // Section 4: Member Groups by Age
        if (screenWidth > 768 && memberGroups.length > 0) {
            const columnsRow = document.createElement('div');
            columnsRow.className = 'columns-row';

            const sortedGroups = memberGroups.sort((a, b) => {
                const order = ['Kids', 'Teens', 'Adults'];
                return order.indexOf(a.title) - order.indexOf(b.title);
            });

            sortedGroups.forEach(group => {
                const column = document.createElement('div');
                column.className = 'suggestion-column';
                const groupSection = document.createElement('div');
                groupSection.className = 'member-group';
                groupSection.innerHTML = `<div class="subheader-row">${group.title}</div>`;
                const table = document.createElement('table');
                table.className = 'suggestions-table';
                table.innerHTML = `<tbody></tbody>`;
                const tbody = table.querySelector('tbody');
                group.members.forEach(suggestion => {
                    const row = createMembershipTableRow(suggestion);
                    tbody.appendChild(row);
                });
                groupSection.appendChild(table);
                column.appendChild(groupSection);
                columnsRow.appendChild(column);
            });

            while (columnsRow.children.length < 3) {
                const emptyColumn = document.createElement('div');
                emptyColumn.className = 'suggestion-column';
                columnsRow.appendChild(emptyColumn);
            }

            memberGroupsContainer.appendChild(columnsRow);
        } else if (screenWidth > 768) {
            memberGroupsContainer.innerHTML = '<div class="no-suggestions">No eligible members for upcoming classes.</div>';
        }

        // Append containers in order
        tableContainer.appendChild(scheduleContainer);
        tableContainer.appendChild(passContainer);
        tableContainer.appendChild(memberGroupsContainer);
    } else {
        const scheduleContainer = document.createElement('div');
        scheduleContainer.className = 'schedule-container';
        scheduleContainer.style.marginTop = '0px';

        const scheduleList = document.createElement('div');
        scheduleList.className = 'schedule-list';
        scheduleList.innerHTML = '<div class="no-classes">No classes scheduled at this time.</div>';
        console.log('displayResults: Rendered no-classes message due to no membership suggestions');
        scheduleContainer.appendChild(scheduleList);

        const passContainer = document.createElement('div');
        passContainer.className = screenWidth <= 768 ? 'suggestions-card-container' : 'pass-suggestions-container';
        passContainer.innerHTML = '<div class="no-suggestions">No pass-based suggestions available.</div>';

        const memberGroupsContainer = document.createElement('div');
        memberGroupsContainer.className = 'member-groups-container';
        memberGroupsContainer.style.marginTop = '0px';
        memberGroupsContainer.innerHTML = '<div class="no-suggestions">No eligible members for upcoming classes.</div>';

        tableContainer.appendChild(scheduleContainer);
        tableContainer.appendChild(passContainer);
        tableContainer.appendChild(memberGroupsContainer);
    }
}
  
// Helper function to render search or filter results
function renderSearchOrFilterResults(data, tableContainer) {
  console.log('renderSearchOrFilterResults: Starting', { data: JSON.stringify(data, null, 2) });
  const table = document.createElement('table');
  table.className = 'results-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th class="name-column">Name</th>
        <th class="membership-column">Membership</th>
        <th class="passes-column">Passes</th>
        <th class="notes-column">Notes</th>
        <th class="actions-column"></th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');

  const searchTerm = searchInput.value.trim();
  if (searchTerm.length < 3 && searchTerm.length > 0) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="5">Please enter 3 or more characters to search.</td>`;
    tbody.appendChild(row);
    tableContainer.appendChild(table);
    console.log('renderSearchOrFilterResults: Rendered min character message');
    return;
  }

  if (!Array.isArray(data) || !data.length) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="5">No matching members found.</td>`;
    tbody.appendChild(row);
    tableContainer.appendChild(table);
    console.log('renderSearchOrFilterResults: Rendered no results message');
    return;
  }

  try {
    data.sort((a, b) => (a[1] || '').localeCompare(b[1] || ''));
    data.forEach((member, index) => {
      console.log(`renderSearchOrFilterResults: Rendering member ${index}`, { member });
      const [uuid, name, startDate, addedDays, endDate, type, openGym, classes, privateKids, privateAdults, aerialSilks, notes, daysLeft, ageGroup] = member;
      let membershipHTML = '';
      let passesHTML = '';
      let notesHTML = '';

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      const todayStr = today.toISOString().split('T')[0];
      const endStr = endDate || '';

      const isUnlimited = type === 'Unlimited Open Gym';
      const displayType = isUnlimited ? 'Open Gym' : type;

      if (isUnlimited) {
        membershipHTML = `<span class="type-badge type-open-gym">${displayType}</span> Unlimited`;
      } else if (endDate && daysLeft < 0 && startDate && start <= today) {
        const expiryDate = end ? end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : endDate;
        membershipHTML = `<span class="type-badge type-expired">Expired</span> on ${expiryDate}`;
      } else if (startDate && start <= today) {
        if (endStr === todayStr) {
          membershipHTML = `${type ? `<span class="type-badge type-${type.toLowerCase().replace(' ', '-') || ''}">${displayType}</span>` : ''} Ends Today`;
        } else if (daysLeft > 0) {
          const dayWord = daysLeft === 1 ? 'day' : 'days';
          membershipHTML = `${type ? `<span class="type-badge type-${type.toLowerCase().replace(' ', '-') || ''}">${displayType}</span>` : ''} ${daysLeft} ${dayWord} left`;
        } else {
          const expiryDate = end ? end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : endDate;
          membershipHTML = `<span class="type-badge type-expired">Expired</span> on ${expiryDate}`;
        }
      } else if ((startDate && start > today) || (!startDate && addedDays > 0)) {
        membershipHTML = `
          <button class="start-membership-btn ${type.toLowerCase().replace(' ', '-') || 'open-gym'}">Start Today?</button>
          ${addedDays} days
        `;
      }

      const openGymPunches = parseInt(openGym) || 0;
      const classesPunches = parseInt(classes) || 0;
      const privateKidsPunches = parseInt(privateKids) || 0;
      const privateAdultsPunches = parseInt(privateAdults) || 0;
      const aerialSilksPunches = parseInt(aerialSilks) || 0;

      if (openGymPunches > 0) passesHTML += `
        <div class="pass-item">
          <span class="pass-bubble open-gym"><span class="pass-number">${openGymPunches}</span> Open Gym</span>
          <button class="suggestion-use-btn" data-pass-type="openGym">USE</button>
        </div>`;
      if (classesPunches > 0) passesHTML += `
        <div class="pass-item">
          <span class="pass-bubble classes"><span class="pass-number">${classesPunches}</span> Classes</span>
          <button class="suggestion-use-btn" data-pass-type="classes">USE</button>
        </div>`;
      if (privateKidsPunches > 0) passesHTML += `
        <div class="pass-item">
          <span class="pass-bubble private-kids"><span class="pass-number">${privateKidsPunches}</span> Private - Kids</span>
          <button class="suggestion-use-btn" data-pass-type="privateKids">USE</button>
        </div>`;
      if (privateAdultsPunches > 0) passesHTML += `
        <div class="pass-item">
          <span class="pass-bubble private-adults"><span class="pass-number">${privateAdultsPunches}</span> Private - Adults</span>
          <button class="suggestion-use-btn" data-pass-type="privateAdults">USE</button>
        </div>`;
      if (aerialSilksPunches > 0) passesHTML += `
        <div class="pass-item">
          <span class="pass-bubble aerial-silks"><span class="pass-number">${aerialSilksPunches}</span> Aerial Silks</span>
          <button class="suggestion-use-btn" data-pass-type="aerialSilks">USE</button>
        </div>`;
      if (passesHTML) passesHTML = `<div class="badge-container">${passesHTML}</div>`;

      if (notes && notes.trim().length > 0) {
        notesHTML = `<span class="notes-content">${notes}</span>`;
      }

      const hasMembership = membershipHTML.trim().length > 0;
      const hasPasses = passesHTML.trim().length > 0;
      const hasNotes = notes && notes.trim().length > 0;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="name-column"><span class="copyable-name" title="Click to copy name">${name}</span></td>
        <td class="membership-column ${hasMembership ? 'has-content' : ''}">${membershipHTML || ''}</td>
        <td class="passes-column ${hasPasses ? 'has-content' : ''}">${passesHTML || ''}</td>
        <td class="notes-column ${hasNotes ? 'has-content' : ''}">${notesHTML || ''}</td>
        <td class="actions-column"><button class="action-btn edit-btn">Edit</button></td>
      `;

      const nameElement = row.querySelector('.copyable-name');
      nameElement.addEventListener('click', () => {
        navigator.clipboard.writeText(name).then(() => {
          nameElement.classList.add('copied');
        }).catch(err => {
          console.error('Failed to copy name:', err);
          alert('Failed to copy name. Please copy it manually.');
        });
      });

      const lastUpdate = localStorage.getItem(`lastUpdate_${name}`) || '1970-01-01T00:00:00Z';
      const currentTimestamp = lastTimestamp || new Date().toISOString();
      const isRecent = lastTimestamp && lastTimestamp > lastUpdate;
      if (isRecent) {
        row.style.backgroundColor = '#e6ffe6';
        setTimeout(() => row.style.backgroundColor = '', 5000);
        localStorage.setItem(`lastUpdate_${name}`, currentTimestamp);
      }

      const editButton = row.querySelector('.edit-btn');
      editButton.addEventListener('click', () => {
        editMember(name, startDate || '', addedDays || 0, endDate || '', type || '', openGymPunches, classesPunches, privateKidsPunches, privateAdultsPunches, aerialSilksPunches, notes || '', uuid, ageGroup);
      });

      const startMembershipBtn = row.querySelector('.start-membership-btn');
      if (startMembershipBtn) {
        console.log(`Setting up Start Today button for ${name}`, { ageGroup });
        startMembershipBtn.addEventListener('click', () => {
          startMembershipToday(name, startDate || '', addedDays || 0, type || '', openGymPunches, classesPunches, privateKidsPunches, privateAdultsPunches, aerialSilksPunches, notes || '', startMembershipBtn, ageGroup || '');
        });
      }

      const usePassButtons = row.querySelectorAll('.suggestion-use-btn');
      usePassButtons.forEach(button => {
        const passType = button.dataset.passType;
        button.addEventListener('click', () => {
          subtractPass(name, passType, openGymPunches, classesPunches, privateKidsPunches, privateAdultsPunches, aerialSilksPunches, button, true);
        });
      });

      tbody.appendChild(row);
    });

    tableContainer.appendChild(table);
    editForm.style.display = 'none';
    addForm.style.display = 'none';
    resultsDiv.style.display = 'block';
    fetchStats();
    console.log('renderSearchOrFilterResults: Completed rendering', { rowCount: data.length });
  } catch (error) {
    console.error('renderSearchOrFilterResults: Rendering error', { error: error.message, stack: error.stack });
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="5">Error rendering results: ${error.message}</td>`;
    tbody.appendChild(row);
    tableContainer.appendChild(table);
  }
}


function searchError(error) {
    console.error('Search failed:', error.message);
    showError(`Error searching: ${error.message}`, retrySearch);
}

function retrySearch() {
    const searchTerm = searchInput.value.trim();
    if (activeMembershipFilter) {
        showLoading(true);
        google.script.run
            .withSuccessHandler((results) => {
                showLoading(false);
                displayResults(results);
            })
            .withFailureHandler((error) => {
                showLoading(false);
                activeMembershipFilter = null;
                updateFilterButtonStates();
                showError('Failed to filter memberships: ' + error.message);
            })
            .filterByMembershipType(activeMembershipFilter, searchTerm && lastSearchTerm ? lastSearchTerm : null);
    } else if (searchTerm.length > 0) {
        manualSearchActive = true;
        lastSearchTerm = searchTerm;
        showLoading(true);
        google.script.run
            .withSuccessHandler((results) => {
                showLoading(false);
                displayResults(results);
            })
            .withFailureHandler((error) => {
                showLoading(false);
                manualSearchActive = false;
                searchError(error);
            })
            .searchSheet(searchTerm);
    } else {
        fetchSuggestedCheckIns();
    }
}

function subtractPass(memberName, passType, currentOpenGym, currentClasses, currentPrivateKids, currentPrivateAdults, currentAerialSilks, buttonElement, isSearchResults = false) {
    buttonElement.disabled = true;
    showLoading(true);

    const currentSearchTerm = searchInput.value.trim();
    const wasManualSearchActive = manualSearchActive;
    const wasMembershipFilterActive = activeMembershipFilter;
    console.log('subtractPass: Before server call', {
        memberName,
        passType,
        currentSearchTerm,
        wasManualSearchActive,
        wasMembershipFilterActive,
        previousScreenState
    });

    google.script.run
        .withSuccessHandler((data) => {
            showLoading(false);
            updatePassSuccess(data, passType);

            if (wasMembershipFilterActive) {
                previousScreenState = 'filter';
                manualSearchActive = false;
                console.log('subtractPass: Refreshing filtered memberships', {
                    filter: wasMembershipFilterActive,
                    searchTerm: currentSearchTerm
                });
                google.script.run
                    .withSuccessHandler(members => {
                        console.log('subtractPass: Filtered memberships refreshed', members);
                        displayResults(members);
                    })
                    .withFailureHandler(err => {
                        console.error('Failed to refresh filtered memberships:', err);
                        buttonElement.disabled = false;
                        showError('Failed to refresh filtered memberships: ' + err.message);
                    })
                    .filterByMembershipType(wasMembershipFilterActive, currentSearchTerm && lastSearchTerm ? lastSearchTerm : null);
            } else if (previousScreenState === 'search' && currentSearchTerm) {
                manualSearchActive = true;
                console.log('subtractPass: Refreshing search results', {
                    currentSearchTerm,
                    manualSearchActive
                });
                google.script.run
                    .withSuccessHandler(members => {
                        console.log('subtractPass: Search results refreshed', members);
                        displayResults(members);
                    })
                    .withFailureHandler(err => {
                        console.error('Failed to refresh search results:', err);
                        buttonElement.disabled = false;
                        showError('Failed to refresh search results: ' + err.message);
                    })
                    .searchSheet(currentSearchTerm);
            } else {
                console.log('subtractPass: Refreshing ECI table');
                google.script.run
                    .withSuccessHandler(members => {
                        console.log('subtractPass: ECI table refreshed', members);
                        displayResults(members);
                    })
                    .withFailureHandler(err => {
                        console.error('Failed to refresh ECI table:', err);
                        buttonElement.disabled = false;
                        showError('Failed to refresh ECI table: ' + err.message);
                    })
                    .getSuggestedCheckIns();
            }

            buttonElement.disabled = false;
        })
        .withFailureHandler((error) => {
            showLoading(false);
            updatePassError(error);
            buttonElement.disabled = false;
        })
        .subtractPass(memberName, passType, currentOpenGym, currentClasses, currentPrivateKids, currentPrivateAdults, currentAerialSilks);
}

function updatePassSuccess(updatedMemberData, passType) {
    if (updatedMemberData && !updatedMemberData.error) {
        const memberIndex = currentECIMembers.findIndex(member => member[1] === updatedMemberData[1]);
        if (memberIndex !== -1) {
            currentECIMembers[memberIndex] = updatedMemberData;
        }

        fetchStats();
        fetchTodayLogs();
        if (currentClientUuid === updatedMemberData[0]) {
            fetchClientHistory(updatedMemberData[0], updatedMemberData[1]);
        }
    } else {
        updatePassError({message: updatedMemberData ? updatedMemberData.error : 'Unknown error'});
    }
}

function updatePassError(error) {
    console.error('Failed to subtract pass:', error.message);
    showError(`Failed to use pass: ${error.message}`, retrySearch);
}

function editMember(name, startDate, addedDays, endDate, type, openGym, classes, privateKids, privateAdults, aerialSilks, notes, uuid, ageGroup) {
  console.log('editMember: Starting', { name, startDate, addedDays, endDate, type, openGym, classes, privateKids, privateAdults, aerialSilks, notes, uuid, ageGroup });

  // Store search term and set up edit form
  originalSearchTerm = searchInput.value.trim();
  document.getElementById('tableContainer').style.display = 'none';
  editForm.style.display = 'block';
  addForm.style.display = 'none';
  resultsDiv.style.display = 'block';
  document.getElementById('mainTitle').textContent = 'Edit Member';
  editMemberOriginalData = { name, startDate, addedDays, type, openGym, classes, privateKids, privateAdults, aerialSilks, ageGroup };

  // Populate form fields
  document.getElementById('editName').value = name || '';
  setSelectedTypeButton('editType', type);
  toggleAgeGroupRow('edit', type);

  document.getElementById('editStartDate').value = startDate || '';
  document.getElementById('editAddedDays').value = addedDays || '';

  document.getElementById('editOpenGymPunches').value = parseInt(openGym) || 0;
  document.getElementById('editClassesPunches').value = parseInt(classes) || 0;
  document.getElementById('editPrivateKidsPunches').value = parseInt(privateKids) || 0;
  document.getElementById('editPrivateAdultsPunches').value = parseInt(privateAdults) || 0;
  document.getElementById('editAerialSilksPunches').value = parseInt(aerialSilks) || 0;

  document.getElementById('editNotes').value = notes || '';

  const editAgeGroup = document.getElementById('editAgeGroup');
  if (editAgeGroup) {
    editAgeGroup.value = ageGroup || '';
  }

  if (type === 'Unlimited Open Gym') {
    document.getElementById('editStartDate').disabled = true;
    document.getElementById('editAddedDays').disabled = true;
    document.getElementById('editEndDate').value = '';
  } else {
    document.getElementById('editStartDate').disabled = false;
    document.getElementById('editAddedDays').disabled = false;
    calculateEndDate('edit');
  }

  extendButtons.forEach(button => button.classList.remove('selected'));
  if (type === 'Unlimited Open Gym') {
    const infinityButton = extendButtons.find(btn => btn.textContent === '∞');
    if (infinityButton) infinityButton.classList.add('selected');
  } else if (addedDays) {
    const selectedButton = extendButtons.find(btn => parseInt(btn.textContent) === addedDays);
    if (selectedButton) selectedButton.classList.add('selected');
  }

  document.getElementById('editError').textContent = '';
  editConfirmationMessage.textContent = '';
  editConfirmationMessage.style.display = 'none';
  checkProfileContent('edit');

  // Set up input event for editAddedDays
  const editAddedDays = document.getElementById('editAddedDays');
  if (editAddedDays) {
    editAddedDays.oninput = () => {
      calculateEndDate('edit');
      checkProfileContent('edit');
    };
  }

  // Reset all drawers
  const activityLog = document.getElementById('activityLog');
  const statsDrawer = document.getElementById('statsDrawer');
  const historyDrawer = document.getElementById('historyDrawer');
  if (!historyDrawer) {
    console.error('editMember: historyDrawer element not found');
    return;
  }
  activityLog.classList.remove('open');
  statsDrawer.classList.remove('open');
  historyDrawer.classList.remove('open');

  // Fetch history and manage history drawer
  const screenWidth = window.innerWidth;
  console.log('editMember: Screen width', { screenWidth });
  fetchClientHistory(uuid, name, false, function() {
    console.log('editMember: fetchClientHistory callback', { screenWidth, editFormDisplay: editForm.style.display });
    if (screenWidth > 768 && editForm.style.display === 'block') {
      // Desktop/Tablet: Open history drawer
      historyDrawer.classList.add('open');
      activeDrawer = 'history';
      console.log('editMember: Opened history drawer for desktop/tablet');
    } else {
      // Mobile: Keep closed, allow manual open
      activeDrawer = 'history'; // Set to history for bottom bar button
      console.log('editMember: History drawer closed for mobile, set activeDrawer to history');
    }
    updateBottomBarButtons();
  });
}

function normalizeDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
}

function saveChanges() {
    if (isSaving) return;

    const originalName = editMemberOriginalData.name;
    const newName = document.getElementById('editName').value;
    const startDate = document.getElementById('editStartDate').value || '';
    const addedDays = parseInt(document.getElementById('editAddedDays').value) || 0;
    let type = getSelectedType('editType');
    const ageGroup = document.getElementById('editAgeGroup')?.value || '';
    const isUnlimited = document.getElementById('editAddedDays').disabled;
    if (isUnlimited) type = 'Unlimited Open Gym';
    const openGym = parseInt(document.getElementById('editOpenGymPunches').value) || 0;
    const classes = parseInt(document.getElementById('editClassesPunches').value) || 0;
    const privateKids = parseInt(document.getElementById('editPrivateKidsPunches').value) || 0;
    const privateAdults = parseInt(document.getElementById('editPrivateAdultsPunches').value) || 0;
    const aerialSilks = parseInt(document.getElementById('editAerialSilksPunches').value) || 0;
    const notes = document.getElementById('editNotes').value;

    if (!newName) {
        document.getElementById('editError').textContent = 'Name cannot be empty.';
        document.getElementById('editName').classList.add('missing');
        return;
    } else {
        document.getElementById('editName').classList.remove('missing');
    }

    if ((type === 'Classes' || type === 'Athletic') && !ageGroup) {
        document.getElementById('editError').textContent = 'Age group is required for Classes or Athletic memberships.';
        return;
    }

    if (addedDays > 0 && !type && !isUnlimited) {
        document.getElementById('editError').textContent = 'Please select a membership type when specifying days.';
        return;
    }

    if (!isUnlimited && type && addedDays <= 0) {
        document.getElementById('editError').textContent = 'Please specify a number of days greater than 0.';
        return;
    }

    if (openGym < 0 || classes < 0 || privateKids < 0 || privateAdults < 0 || aerialSilks < 0) {
        document.getElementById('editError').textContent = 'Pass counts cannot be negative.';
        return;
    }

    if (startDate && isNaN(new Date(startDate).getTime())) {
        document.getElementById('editError').textContent = 'Invalid Start Date format. Please use YYYY-MM-DD.';
        return;
    }

    const isProfileEmpty = !type && !startDate && addedDays === 0 &&
                          openGym === 0 && classes === 0 &&
                          privateKids === 0 && privateAdults === 0 &&
                          aerialSilks === 0;

    if (isProfileEmpty && !isConfirmingSave) {
        editConfirmationMessage.textContent = 'This profile has no membership or passes. Are you sure you want to save?';
        editConfirmationMessage.style.display = 'inline-block';
        saveBtn.textContent = 'Save Anyway';
        saveBtn.style.minWidth = '100px';
        isConfirmingSave = true;
        return;
    }

    isSaving = true;
    saveBtn.disabled = true;
    saveBtn.style.opacity = '0.6';
    showLoading(true);

    google.script.run
        .withSuccessHandler((data) => {
            showLoading(false);
            saveSuccess(data, { startDate, addedDays, type, openGym, classes, privateKids, privateAdults, aerialSilks });
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
            isSaving = false;
        })
        .withFailureHandler((error) => {
            showLoading(false);
            saveError(error);
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
            isSaving = false;
        })
        .updateSheet(originalName, newName, startDate, isUnlimited ? 0 : addedDays, type, openGym, classes, privateKids, privateAdults, aerialSilks, notes, ageGroup);
  }

function saveSuccess(updatedMemberData, newData) {
  if (updatedMemberData && !updatedMemberData.error) {
    console.log('saveSuccess: Starting', {
      updatedMemberData,
      searchInputValue: searchInput.value.trim(),
      manualSearchActive,
      originalSearchTerm,
      activeMembershipFilter,
      previousScreenState
    });

    document.getElementById('tableContainer').style.display = 'block';
    editForm.style.display = 'none';
    addForm.style.display = 'none';
    resultsDiv.style.display = 'block';
    document.getElementById('mainTitle').textContent = 'Loading Suggestions';
    editConfirmationMessage.textContent = 'Changes saved successfully for ' + updatedMemberData[1];
    editConfirmationMessage.style.display = 'inline-block';
    setTimeout(() => { editConfirmationMessage.style.display = 'none'; }, 3000);
    saveBtn.textContent = 'Save';
    saveBtn.style.minWidth = '61px';
    isConfirmingSave = false;

    activeDrawer = null;
    updateBottomBarButtons();

    if (activeMembershipFilter) {
      console.log('saveSuccess: Refreshing filtered memberships', {
        filter: activeMembershipFilter,
        searchTerm: originalSearchTerm
      });
      showLoading(true);
      google.script.run
        .withSuccessHandler((results) => {
          showLoading(false);
          console.log('saveSuccess: Filtered memberships after save', results);
          displayResults(results);
        })
        .withFailureHandler((error) => {
          showLoading(false);
          console.error('saveSuccess: Failed to refresh filtered memberships:', error);
          showError('Failed to refresh filtered memberships: ' + error.message);
        })
        .filterByMembershipType(activeMembershipFilter, originalSearchTerm && lastSearchTerm ? lastSearchTerm : null);
    } else if (previousScreenState === 'search' && updatedMemberData[1]) {
      manualSearchActive = true;
      lastSearchTerm = updatedMemberData[1];
      searchInput.value = updatedMemberData[1];
      console.log('saveSuccess: Re-running search with updated member name', {
        searchInputValue: searchInput.value.trim(),
        manualSearchActive,
        lastSearchTerm
      });
      showLoading(true);
      google.script.run
        .withSuccessHandler((results) => {
          showLoading(false);
          console.log('saveSuccess: Search results after save', results);
          displayResults(results);
        })
        .withFailureHandler((error) => {
          showLoading(false);
          console.error('saveSuccess: Failed to refresh search results after save:', error);
          showError('Failed to refresh search results: ' + error.message);
        })
        .searchSheet(updatedMemberData[1]);
    } else {
      console.log('saveSuccess: Refreshing ECI table');
      showLoading(true);
      google.script.run
        .withSuccessHandler((results) => {
          showLoading(false);
          console.log('saveSuccess: ECI table after save', results);
          displayResults(results);
        })
        .withFailureHandler((error) => {
          showLoading(false);
          console.error('saveSuccess: Failed to refresh ECI table after save:', error);
          showError('Failed to refresh ECI table: ' + error.message);
        })
        .getSuggestedCheckIns();
    }

    fetchStats();
    fetchTodayLogs();
    fetchSuggestedCheckIns();
    closeHistoryDrawer();
    console.log('saveSuccess: Completed');
  } else {
    saveError({message: updatedMemberData ? updatedMemberData.error : 'Unknown error'});
  }
}

function saveError(error) {
    console.error('Save failed:', error.message);
    let message = error.message;
    if (message.includes('timeout')) message = 'Server busy. Wait a moment and try again.';
    showError(`Failed to save: ${message}`, saveChanges);
    saveBtn.textContent = 'Save';
    saveBtn.style.minWidth = '61px';
    isConfirmingSave = false;
}

function addSuccess(data, newData) {
  //make it into a show log function instead.
}

function addError(error) {
    console.error('Add failed:', error.message);
    let message = error.message;
    if (message.includes('timeout')) message = 'Server busy. Wait a moment and try again.';
    showError(`Failed to add member: ${message}`, addNewMember);
    addMemberBtn.textContent = 'Add';
    addMemberBtn.style.minWidth = '61px';
    isConfirmingSave = false;
}

function startMembershipToday(name, startDate, addedDays, type, openGym, classes, privateKids, privateAdults, aerialSilks, notes, buttonElement, ageGroup) {
  console.log('startMembershipToday:', { name, startDate, addedDays, type, ageGroup });
  const today = new Date().toISOString().split('T')[0];
  buttonElement.disabled = true;
  showLoading(true);

  // fallback for ageGroup if not provided
  const effectiveAgeGroup = ageGroup || '';

  // build request body for /api/signup
  const requestBody = {
    name,
    email: "tester@gmail.com",                // leave blank if you're collecting it later
    phonenumber: "",          // leave blank if collecting later
    password: "",             // no password yet
    notes,
    openGymPasses: openGym,
    classPasses: classes,
    privateKidPasses: privateKids,
    privateAdultPasses: privateAdults,
    AerialSilksPasses: aerialSilks
  };

  fetch(`${backendIP}/api/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })
  .then(async (response) => {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Unknown error');
    }
    showLoading(false);
    saveSuccess(data, { startDate: today, addedDays, type, openGym, classes, privateKids, privateAdults, aerialSilks });
    buttonElement.disabled = false;
  })
  .catch((error) => {
    showLoading(false);
    console.error('Failed to start membership:', error);
    showError(`Failed to start membership: ${error.message}`, () => 
      startMembershipToday(name, startDate, addedDays, type, openGym, classes, privateKids, privateAdults, aerialSilks, notes, buttonElement, ageGroup)
    );
    buttonElement.disabled = false;
  });
}


function getAgeGroupForMember(name) {
    // Try to find the member in currentECIMembers or allData
    const member = currentECIMembers.find(m => m[1] === name) || allData.find(m => m[1] === name);
    if (member && member[13]) { // AgeGroup is at index 13 in member data
        console.log('getAgeGroupForMember: Found ageGroup in client data', { name, ageGroup: member[13] });
        return member[13];
    }
    console.warn('getAgeGroupForMember: AgeGroup not found for member', { name });
    return ''; // Return empty string as fallback
}

function showAddForm() {
    document.getElementById('tableContainer').style.display = 'none';
    addForm.style.display = 'block';
    resultsDiv.style.display = 'block';
    document.getElementById('mainTitle').textContent = 'Add New Member';
    clearAddForm();
    closeHistoryDrawer();
}

  function clearAddForm() {
    document.getElementById('addName').value = '';
    setSelectedTypeButton('addType', '');
    document.getElementById('addStartDate').value = '';
    document.getElementById('addAddedDays').value = '';
    document.getElementById('addEndDate').value = '';
    document.getElementById('addOpenGymPunches').value = '';
    document.getElementById('addClassesPunches').value = '';
    document.getElementById('addPrivateKidsPunches').value = '';
    document.getElementById('addPrivateAdultsPunches').value = '';
    document.getElementById('addAerialSilksPunches').value = '';
    document.getElementById('addNotes').value = '';
    document.getElementById('addAgeGroup').value = '';
    document.getElementById('addError').textContent = '';
    confirmationMessage.textContent = '';
    confirmationMessage.style.display = 'none';
    addMemberBtn.textContent = 'Add';
    addMemberBtn.style.minWidth = '61px';
    isConfirmingSave = false;
    durationButtons.forEach(button => button.classList.remove('selected'));
    document.getElementById('addStartDate').disabled = false;
    document.getElementById('addAddedDays').disabled = false;
    checkProfileContent('add');
  }

function cancelAdd() {
    document.getElementById('tableContainer').style.display = 'block';
    editForm.style.display = 'none';
    addForm.style.display = 'none';
    resultsDiv.style.display = 'block';
    clearAddForm();
    refreshData();
}

function cancelEdit() {
    document.getElementById('tableContainer').style.display = 'block';
    editForm.style.display = 'none';
    addForm.style.display = 'none';
    resultsDiv.style.display = 'block';
    editConfirmationMessage.textContent = '';
    editConfirmationMessage.style.display = 'none';
    saveBtn.textContent = 'Save';
    saveBtn.style.minWidth = '61px';
    isConfirmingSave = false;
    
    activeDrawer = null;
    updateBottomBarButtons();
    
    refreshData();
}

function setMembershipType(type, button) {
    const buttons = typeButtons;
    const currentlySelected = button.classList.contains('selected');

    buttons.forEach(btn => {
        btn.classList.remove('selected');
        btn.style.backgroundColor = '#cccccc';
        btn.style.color = 'black';
    });

    if (!currentlySelected) {
        button.classList.add('selected');
        if (button.classList.contains('open-gym')) {
            button.style.backgroundColor = '#4CAF50';
            button.style.color = 'white';
        } else if (button.classList.contains('classes')) {
            button.style.backgroundColor = '#2196F3';
            button.style.color = 'white';
        } else if (button.classList.contains('athletic')) {
            button.style.backgroundColor = '#FFCA28';
            button.style.color = 'black';
        }
    } else {
        type = ''; // Deselect if clicking the same button
    }

    toggleAgeGroupRow(type);
    checkProfileContent();
}

function getMembershipType() {
    return getSelectedCheckBox('membershipType');
}

function getSelectedCheckBox(groupName) {
  const selected = document.querySelector(`input[type="checkbox"][name="${groupName}"]:checked`);
  return selected ? selected.value : '';
}

function setSelectedTypeButton(inputId, type) {
    const buttons = inputId === 'addType' ? typeButtons : editTypeButtons;
    buttons.forEach(btn => {
        btn.classList.remove('selected');
        btn.style.backgroundColor = '#cccccc';
        btn.style.color = 'black';
    });
    if (type) {
        const selectedButton = document.querySelector(`#${inputId}Buttons .action-btn[data-type='${type === 'Unlimited Open Gym' ? 'Open Gym' : type}']`);
        if (selectedButton) {
            selectedButton.classList.add('selected');
            if (selectedButton.classList.contains('open-gym')) {
                selectedButton.style.backgroundColor = '#4CAF50';
                selectedButton.style.color = 'white';
            } else if (selectedButton.classList.contains('classes')) {
                selectedButton.style.backgroundColor = '#2196F3';
                selectedButton.style.color = 'white';
            } else if (selectedButton.classList.contains('athletic')) {
                selectedButton.style.backgroundColor = '#FFCA28';
                selectedButton.style.color = 'black';
            }
        }
    }
}

function setToday(fieldId) {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById(fieldId).value = today;
  const prefix = fieldId.includes('add') ? 'add' : 'edit';
  calculateEndDate(prefix);
  checkProfileContent(prefix);
}

  function clearDatesOnly(fieldId) {
    const prefix = fieldId.includes('add') ? 'add' : 'edit';
    document.getElementById(`${prefix}StartDate`).value = '';
    document.getElementById(`${prefix}EndDate`).value = '';
    checkProfileContent(prefix);
  }

  function clearMembershipOnly(fieldId) {
    const prefix = fieldId.includes('add') ? 'add' : 'edit';
    setSelectedTypeButton(prefix + 'Type', '');
    document.getElementById(`${prefix}StartDate`).value = '';
    document.getElementById(`${prefix}AddedDays`).value = '';
    document.getElementById(`${prefix}EndDate`).value = '';
    document.getElementById(`${prefix}StartDate`).disabled = false;
    document.getElementById(`${prefix}AddedDays`).disabled = false;
    const buttons = prefix === 'add' ? durationButtons : extendButtons;
    buttons.forEach(button => button.classList.remove('selected'));
    const ageGroupInput = document.getElementById(`${prefix}AgeGroup`);
    if (ageGroupInput) {
      ageGroupInput.value = '';
    }
    toggleAgeGroupRow(prefix, '');
    checkProfileContent(prefix);
  }

function calculateEndDate() {

  

  const startDate = startDateInput.value;
  const addedDays = parseInt(addedDaysInput.value) || 0;

  if (!startDate || addedDays <= 0) {
    endDateInput.value = '';
    console.log('calculateEndDate: Invalid start date or added days', { startDate, addedDays });
    return;
  }

  const startDateObj = new Date(startDate);
  if (isNaN(startDateObj.getTime())) {
    endDateInput.value = '';
    console.log('calculateEndDate: Invalid start date format', { startDate });
    return;
  }

  const endDate = new Date(startDateObj);
  endDate.setDate(startDateObj.getDate() + addedDays - 1); // Subtract 1 to include the start date in the count
  endDateInput.value = endDate.toISOString().split('T')[0];
}

function adjustPunches(inputId, amount) {
    console.log('adjustPunches:', { inputId, amount });
    const input = document.getElementById(inputId);
    if (!input) {
        console.error(`adjustPunches: Input ${inputId} not found`);
        return;
    }
    const currentValue = parseInt(input.value) || 0;
    const newValue = Math.max(0, currentValue + amount);
    input.value = newValue;
    checkProfileContent(inputId.startsWith('add') ? 'add' : 'edit');
}

function setDuration(prefix, days, button) {
    const buttons = prefix === 'add' ? durationButtons : extendButtons;
    buttons.forEach(btn => btn.classList.remove('selected'));

    document.getElementById(`${prefix}AddedDays`).disabled = false;
    document.getElementById(`${prefix}StartDate`).disabled = false;

    if (days === '∞') {
        setSelectedTypeButton(prefix + 'Type', 'Unlimited Open Gym');
        document.getElementById(`${prefix}AddedDays`).disabled = true;
        document.getElementById(`${prefix}StartDate`).disabled = true;
        document.getElementById(`${prefix}StartDate`).value = '';
        document.getElementById(`${prefix}AddedDays`).value = '';
        document.getElementById(`${prefix}EndDate`).value = '';
        button.classList.add('selected');
    } else {
        document.getElementById(`${prefix}AddedDays`).value = days;
        button.classList.add('selected');
        calculateEndDate();
    }

    checkProfileContent(prefix);
}

function toggleAgeGroupRow(type) {
    const ageGroupRow = document.getElementById(`addAgeGroupRow`);
    const shouldShow = type === 'class' || type === 'athletic';
    ageGroupRow.style.display = shouldShow ? 'flex' : 'none';
}

function setAddedDays(days) {
    


    const addedDaysInput = document.getElementById('addAddedDays');
    const startDateInput = document.getElementById('addStartDate');
    const endDateInput = document.getElementById('addEndDate');

    if (!addedDaysInput || !startDateInput || !endDateInput) {
        console.error(`setAddedDays: Missing inputs for ${prefix}`, {
            addedDaysInput: !!addedDaysInput,
            startDateInput: !!startDateInput,
            endDateInput: !!endDateInput
        });
        return;
    }

    addedDaysInput.disabled = false;
    startDateInput.disabled = false;
    
    if (days === -1) {
        addedDaysInput.disabled = true;
        endDateInput.disabled = true;
        endDateInput.value = '';
        addedDaysInput.value = '∞';
    } else {
        addedDaysInput.value = days;
        calculateEndDate();
    }

   // checkProfileContent(prefix);
}

function showError(message, retryCallback) {
    const existingToast = document.querySelector('.error-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
        ${message}
        ${retryCallback ? `<button onclick="retryAction()">Retry</button>` : ''}
        <button onclick="this.parentElement.remove()">Dismiss</button>
    `;
    document.body.appendChild(toast);

    if (retryCallback) {
        window.retryAction = function() {
            toast.remove();
            retryCallback();
        };
    }

    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.remove();
        }
    }, 10000);
}

function showLoading(show) {
    if (!monkeyOverlay || !lottiePlayer) {
        console.warn('showLoading: Missing elements', {
            monkeyOverlay: !!monkeyOverlay,
            lottiePlayer: !!lottiePlayer,
            animationsCount: animations.length
        });
        return;
    }

    // Suppress loading indicator in Smartwaiver view and Square orders view
    if (show && (isWaiverView || isOrdersView)) {
        console.log('showLoading: Skipped showing overlay due to Smartwaiver or Orders view', { isWaiverView, isOrdersView });
        return;
    }

    if (show && monkeyOverlay.style.display === 'flex') {
        console.log('showLoading: Overlay already visible, skipping');
        return;
    }

    if (show) {
        currentAnimationIndex = (currentAnimationIndex + 1) % animations.length;
        let animationUrl = animations[currentAnimationIndex];
        console.log('showLoading: Attempting to show overlay', {
            index: currentAnimationIndex,
            url: animationUrl,
            lottiePlayerInitialized: !!lottiePlayer && typeof lottiePlayer.load === 'function'
        });

        if (typeof lottiePlayer.load === 'function') {
            try {
                // Try loading the current animation
                lottiePlayer.load(animationUrl);
                monkeyOverlay.style.display = 'flex';
                lottiePlayer.play().catch(err => {
                    console.warn('showLoading: Failed to play animation, trying next', { error: err.message });
                    // Try the next animation
                    currentAnimationIndex = (currentAnimationIndex + 1) % animations.length;
                    animationUrl = animations[currentAnimationIndex];
                    try {
                        lottiePlayer.load(animationUrl);
                        lottiePlayer.play().catch(innerErr => {
                            console.error('showLoading: Failed to play fallback animation', { error: innerErr.message });
                        });
                    } catch (innerErr) {
                        console.error('showLoading: Failed to load fallback animation', { error: innerErr.message });
                    }
                });
            } catch (err) {
                console.error('showLoading: Exception in animation load, trying next', { error: err.message });
                // Try the next animation
                currentAnimationIndex = (currentAnimationIndex + 1) % animations.length;
                animationUrl = animations[currentAnimationIndex];
                try {
                    lottiePlayer.load(animationUrl);
                    monkeyOverlay.style.display = 'flex';
                    lottiePlayer.play().catch(innerErr => {
                        console.error('showLoading: Failed to play fallback animation', { error: innerErr.message });
                    });
                } catch (innerErr) {
                    console.error('showLoading: Failed to load fallback animation', { error: innerErr.message });
                }
            }
        } else {
            console.error('showLoading: lottiePlayer.load is not a function', {
                lottiePlayerType: typeof lottiePlayer
            });
            monkeyOverlay.style.display = 'none';
        }
    } else {
        console.log('showLoading: Hiding overlay', {
            currentAnimationIndex
        });
        monkeyOverlay.style.display = 'none';
        try {
            lottiePlayer.stop();
        } catch (err) {
            console.warn('showLoading: Failed to stop animation', { error: err.message });
        }
    }
}

function openHistoryDrawer() {
    const screenWidth = window.innerWidth;
    if (screenWidth >= 1600) return;

    const historyDrawer = document.getElementById('historyDrawer');
    const activityLog = document.getElementById('activityLog');
    const statsDrawer = document.getElementById('statsDrawer');

    historyDrawer.classList.add('open');
    activityLog.classList.remove('open');
    statsDrawer.classList.remove('open');
    activeDrawer = 'history';
    updateBottomBarButtons();
    updateFloatingButtonVisibility();
}

function closeHistoryDrawer() {
    const historyDrawer = document.getElementById('historyDrawer');
    historyDrawer.classList.remove('open');
    activeDrawer = null;
    updateBottomBarButtons();
}

function groupMembershipSuggestions(suggestions, allClasses = []) {
    console.log('groupMembershipSuggestions: Starting', { 
        suggestions: JSON.stringify(suggestions, null, 2),
        suggestionCount: suggestions ? suggestions.length : 0,
        allClasses: JSON.stringify(allClasses, null, 2),
        allClassesCount: allClasses ? allClasses.length : 0
    });

    const now = new Date();
    console.log('Time context:', {
        now: now.toISOString()
    });

    const classColors = {
        'parkour.kids': { background: '#00bf63', color: '#fff' },
        'parkour.adults': { background: '#ff914d', color: '#fff' },
        'parkour.teens': { background: '#ff5757', color: '#fff' },
        'parkour.womens-only': { background: '#cb6ce6', color: '#fff' },
        'parkour.parent--child': { background: '#FFFF00', color: '#000' },
        'calisthenics': { background: '#a6a6a6', color: '#000' },
        'calisthenics.womens-only': { background: '#cb6ce6', color: '#fff' }, // Use hyphenated key
        'stretching': { background: '#5e17eb', color: '#fff' },
        'acro-dance': { background: '#8c5645', color: '#fff' },
        'breakdance': { background: '#000000', color: '#fff' },
        'gymnastics': { background: '#d9d9d9', color: '#000' },
        'flips-level-1.teens': { background: '#545454', color: '#fff' },
        'tricking': { background: '#38b6ff', color: '#fff' },
        'flips-level-1.adults': { background: '#004aad', color: '#fff' },
        'flips-level-2.adults': { background: '#004aad', color: '#fff' },
        'backflip-only.adults': { background: '#004aad', color: '#fff' },
        'flips-level-1.kids': { background: '#8c52ff', color: '#fff' },
        'athletic': { background: '#FFCA28', color: '#000' }
    };

    const classGroups = {};
    const memberGroups = {
        'Kids': { title: 'Kids', members: [] },
        'Teens': { title: 'Teens', members: [] },
        'Adults': { title: 'Adults', members: [] }
    };
    const seenMembers = new Set();

    // Process membership suggestions for member groups
    suggestions.forEach((suggestion, index) => {
        const uuid = suggestion[0] || 'unknown';
        const name = suggestion[1] || 'unknown';
        const membershipType = suggestion[5] || '';
        const ageGroup = suggestion[14] || '';
        const classTime = suggestion[15];
        const classType = suggestion[16];
        const classAgeGroup = suggestion[17];

        console.log(`Processing suggestion ${index}:`, { 
            uuid, 
            name, 
            membershipType, 
            ageGroup, 
            classTime, 
            classType, 
            classAgeGroup 
        });

        const groupKey = ageGroup;
        if (memberGroups[groupKey] && !seenMembers.has(uuid)) {
            memberGroups[groupKey].members.push(suggestion);
            seenMembers.add(uuid);
            console.log(`Added member to group ${groupKey}:`, { name });
        }

        // Add classes from membership suggestions to classGroups
        if (classTime && classType && classAgeGroup) {
            let classDate;
            if (classTime.match(/^\d{2}:\d{2}$/)) {
                const [hours, minutes] = classTime.split(':').map(Number);
                classDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
                console.log('Parsed class time:', { 
                    classTime, 
                    classDate: classDate.toISOString(),
                    now: now.toISOString(),
                    isValidDate: !isNaN(classDate.getTime())
                });
            } else {
                console.warn('Invalid class time format:', { classTime, suggestion });
                return;
            }

            if (isNaN(classDate.getTime())) {
                console.warn('Invalid classDate generated:', { classTime, classDate, suggestion });
                return;
            }

            const hours = classDate.getHours();
            const minutes = classDate.getMinutes();
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            const formattedTime = minutes === 0 ? `${displayHours} ${period}` : `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
            const classKey = `${classTime}|${classType}|${classAgeGroup}`;

            let normalizedClassType = classType.toLowerCase().replace(/\s+/g, '-');
            if (normalizedClassType.startsWith('flips-') || normalizedClassType.startsWith('backflip-')) {
                const parts = normalizedClassType.split('-');
                console.log('Normalization parts for flips/backflip:', { classType, normalizedClassType, parts });
                if (parts.length >= 3 && parts[1] === 'level' && /^\d+$/.test(parts[2])) {
                    normalizedClassType = `${parts[0]}-level-${parts[2]}`;
                } else if (normalizedClassType === 'backflip') {
                    normalizedClassType = 'backflip';
                } else if (normalizedClassType === 'backflip-only') {
                    normalizedClassType = 'backflip-only';
                } else {
                    normalizedClassType = normalizedClassType.replace(/-+/g, '-').replace(/-$/, '');
                }
            }
            const classTypeKey = normalizedClassType;
            let ageKey = classAgeGroup.toLowerCase().replace(/\s+/g, '-').replace('&', '');
            // Special handling for specific age groups
            if (ageKey.includes('parent') && ageKey.includes('child')) {
                ageKey = 'parent--child';
            } else if (ageKey.includes('women') && ageKey.includes('only')) {
                ageKey = 'womens-only';
            } else if (ageKey.includes('backflip') && ageKey.includes('only')) {
                ageKey = 'adults'; // Backflip Only uses Adults age group
            }
            const specificKey = `${classTypeKey}.${ageKey}`;
            const classColor = classColors[specificKey] || classColors[classTypeKey] || { background: '#ffffff', color: '#000000' };

            console.log('Adding class to schedule from suggestions:', { 
                classKey, 
                classTime, 
                classType, 
                classAgeGroup, 
                formattedTime, 
                specificKey,
                classColor 
            });

            if (!classGroups[classKey]) {
                classGroups[classKey] = {
                    time: formattedTime,
                    classType: classType,
                    classAgeGroup: classAgeGroup,
                    backgroundColor: classColor.background,
                    textColor: classColor.color
                };
            }
        } else {
            console.log('Class skipped (missing required fields):', { 
                classTime, 
                classType, 
                classAgeGroup,
                suggestion 
            });
        }
    });

    // Add all classes from allClasses to classGroups
    allClasses.forEach((cls, index) => {
        const classTime = cls.time;
        const classType = cls.classType;
        const classAgeGroup = cls.classAgeGroup;

        console.log(`Processing allClasses entry ${index}:`, { 
            classTime, 
            classType, 
            classAgeGroup 
        });

        if (classTime && classType && classAgeGroup) {
            let classDate;
            if (classTime.match(/^\d{2}:\d{2}$/)) {
                const [hours, minutes] = classTime.split(':').map(Number);
                classDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
                console.log('Parsed class time from allClasses:', { 
                    classTime, 
                    classDate: classDate.toISOString(),
                    now: now.toISOString(),
                    isValidDate: !isNaN(classDate.getTime())
                });
            } else {
                console.warn('Invalid class time format in allClasses:', { classTime, cls });
                return;
            }

            if (isNaN(classDate.getTime())) {
                console.warn('Invalid classDate generated in allClasses:', { classTime, classDate, cls });
                return;
            }

            const hours = classDate.getHours();
            const minutes = classDate.getMinutes();
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            const formattedTime = minutes === 0 ? `${displayHours} ${period}` : `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
            const classKey = `${classTime}|${classType}|${classAgeGroup}`;

            let normalizedClassType = classType.toLowerCase().replace(/\s+/g, '-');
            if (normalizedClassType.startsWith('flips-') || normalizedClassType.startsWith('backflip-')) {
                const parts = normalizedClassType.split('-');
                console.log('Normalization parts for flips/backflip in allClasses:', { classType, normalizedClassType, parts });
                if (parts.length >= 3 && parts[1] === 'level' && /^\d+$/.test(parts[2])) {
                    normalizedClassType = `${parts[0]}-level-${parts[2]}`;
                } else if (normalizedClassType === 'backflip') {
                    normalizedClassType = 'backflip';
                } else if (normalizedClassType === 'backflip-only') {
                    normalizedClassType = 'backflip-only';
                } else {
                    normalizedClassType = normalizedClassType.replace(/-+/g, '-').replace(/-$/, '');
                }
            }
            const classTypeKey = normalizedClassType;
            let ageKey = classAgeGroup.toLowerCase().replace(/\s+/g, '-').replace('&', '');
            // Special handling for specific age groups
            if (ageKey.includes('parent') && ageKey.includes('child')) {
                ageKey = 'parent--child';
            } else if (ageKey.includes('women') && ageKey.includes('only')) {
                ageKey = 'womens-only';
            } else if (ageKey.includes('backflip') && ageKey.includes('only')) {
                ageKey = 'adults'; // Backflip Only uses Adults age group
            }
            const specificKey = `${classTypeKey}.${ageKey}`;
            const classColor = classColors[specificKey] || classColors[classTypeKey] || { background: '#ffffff', color: '#000000' };

            console.log('Adding class to schedule from allClasses:', { 
                classKey, 
                classTime, 
                classType, 
                classAgeGroup, 
                formattedTime, 
                specificKey,
                classColor 
            });

            if (!classGroups[classKey]) {
                classGroups[classKey] = {
                    time: formattedTime,
                    classType: classType,
                    classAgeGroup: classAgeGroup,
                    backgroundColor: classColor.background,
                    textColor: classColor.color
                };
            }
        } else {
            console.log('Class skipped from allClasses (missing required fields):', { 
                classTime, 
                classType, 
                classAgeGroup,
                cls 
            });
        }
    });

    const schedule = Object.values(classGroups)
        .sort((a, b) => {
            const timeA = a.time.match(/(\d+):?(\d*)?\s*(AM|PM)/);
            const timeB = b.time.match(/(\d+):?(\d*)?\s*(AM|PM)/);
            let hoursA = parseInt(timeA[1]);
            let hoursB = parseInt(timeB[1]);
            const minutesA = timeA[2] ? parseInt(timeA[2]) : 0;
            const minutesB = timeB[2] ? parseInt(timeB[2]) : 0;
            if (timeA[3] === 'PM' && hoursA !== 12) hoursA += 12;
            if (timeA[3] === 'AM' && hoursA === 12) hoursA = 0;
            if (timeB[3] === 'PM' && hoursB !== 12) hoursB += 12;
            if (timeB[3] === 'AM' && hoursB === 12) hoursB = 0;
            return (hoursA * 60 + minutesA) - (hoursB * 60 + minutesB);
        });

    console.log('Final schedule:', { 
        scheduleLength: schedule.length, 
        schedule: JSON.stringify(schedule, null, 2) 
    });

    const relevantGroups = [];
    Object.keys(memberGroups).forEach(key => {
        const group = memberGroups[key];
        group.members.sort((a, b) => {
            const typeA = a[5]; // MembershipType
            const typeB = b[5];
            const nameA = a[1]; // Name
            const nameB = b[1];
            const typeOrder = ['Classes', 'Athletic'];
            const typeComparison = typeOrder.indexOf(typeA) - typeOrder.indexOf(typeB);
            return typeComparison !== 0 ? typeComparison : nameA.localeCompare(nameB);
        });
        if (group.members.length > 0) {
            relevantGroups.push(group);
        }
    });

    console.log('groupMembershipSuggestions: Returning', { 
        schedule: schedule,
        memberGroups: relevantGroups,
        memberGroupCount: relevantGroups.length
    });
    return { schedule, memberGroups: relevantGroups };
}

function createCollapsibleSection(group) {
  const sectionId = `section-${group.title.replace(/\s+/g, '-')}`;
  const isOpen = expandedSections.has(sectionId);
  const section = document.createElement('div');
  section.className = 'collapsible-section';
  section.innerHTML = `
    <div class="collapsible-header" data-section-id="${sectionId}">
      ${group.title} (${group.members.length})
    </div>
    <div class="collapsible-content ${isOpen ? 'open' : ''}">
      ${group.members.map(member => {
        const [uuid, name, , , , type, , , , , , notes, daysLeft, , ageGroup] = member;
        return `
          <div class="suggestion-card-row suggestion-card-name">
            <span class="copyable-name" title="Click to copy name">${name}</span>
            <button class="action-btn edit-btn">Edit</button>
          </div>
        `;
      }).join('')}
    </div>
  `;
  group.members.forEach((member, index) => {
    const editButton = section.querySelectorAll('.edit-btn')[index];
    const [uuid, name, startDate, addedDays, endDate, type, openGym, classes, privateKids, privateAdults, aerialSilks, notes, daysLeft, , ageGroup] = member;
    editButton.addEventListener('click', () => {
      editMember(name, startDate || '', addedDays || 0, endDate || '', type || '', openGym || 0, classes || 0, privateKids || 0, privateAdults || 0, aerialSilks || 0, notes || '', uuid, ageGroup);
    });
  });
  return section;
}

function createMembershipTableRow(suggestion) {
    const [uuid, name, startDate, addedDays, endDate, type, openGym, classes, privateKids, privateAdults, aerialSilks, notes, daysLeft, , ageGroup, time, classType, classAgeGroup, status] = suggestion;
    const isExpired = status === "Recently Expired";
    const displayType = isExpired ? 'Expired' : type;
    const typeClass = isExpired ? 'type-expired' : `type-${type.toLowerCase().replace(' ', '-') || ''}`;

    console.log('createMembershipTableRow:', {
        name,
        type,
        daysLeft,
        endDate,
        status,
        isExpired,
        displayType,
        typeClass
    });

    const row = document.createElement('tr');
    row.className = 'suggestion-row';
    row.setAttribute('data-name', name);
    row.innerHTML = `
        <td class="name-column"><span class="copyable-name" title="Click to copy name">${name}</span></td>
        <td class="membership-column"><span class="type-badge ${typeClass}">${displayType}</span></td>
        <td class="actions-column"><button class="action-btn edit-btn" style="margin-right:0px;">Edit</button></td>
    `;
    const nameElement = row.querySelector('.copyable-name');
    nameElement.addEventListener('click', () => {
        navigator.clipboard.writeText(name).then(() => {
            nameElement.classList.add('copied');
        }).catch(err => {
            console.error('Failed to copy name:', err);
            alert('Failed to copy name. Please copy it manually.');
        });
    });
    const editButton = row.querySelector('.edit-btn');
    editButton.addEventListener('click', () => {
        editMember(name, startDate || '', addedDays || 0, endDate || '', type || '', openGym || 0, classes || 0, privateKids || 0, privateAdults || 0, aerialSilks || 0, notes || '', uuid, ageGroup);
    });
    return row;
}

function checkProfileContent() {
    return true;
    const prefix = formType === 'add' ? 'add' : 'edit';
    const nameInput = document.getElementById(`${prefix}Name`);
    const addedDaysInput = document.getElementById(`${prefix}AddedDays`);
    const ageGroupInput = document.getElementById(`${prefix}AgeGroup`);
    if (!nameInput || !addedDaysInput) {
        console.error(`checkProfileContent: Missing required elements for ${prefix}`);
        return;
    }
    const name = nameInput.value;
    const type = getSelectedType(`${prefix}Type`);
    const ageGroup = ageGroupInput ? ageGroupInput.value : '';
    const startDate = document.getElementById(`${prefix}StartDate`)?.value || '';
    const addedDays = parseInt(addedDaysInput.value) || 0;
    const openGym = parseInt(document.getElementById(`${prefix}OpenGymPunches`)?.value) || 0;
    const classes = parseInt(document.getElementById(`${prefix}ClassesPunches`)?.value) || 0;
    const privateKids = parseInt(document.getElementById(`${prefix}PrivateKidsPunches`)?.value) || 0;
    const privateAdults = parseInt(document.getElementById(`${prefix}PrivateAdultsPunches`)?.value) || 0;
    const aerialSilks = parseInt(document.getElementById(`${prefix}AerialSilksPunches`)?.value) || 0;

    const isUnlimited = addedDaysInput.disabled;
    const isProfileEmpty = !type && !startDate && addedDays === 0 &&
                          openGym === 0 && classes === 0 &&
                          privateKids === 0 && privateAdults === 0 &&
                          aerialSilks === 0;

    const errorElement = document.getElementById(`${prefix}Error`);
    const confirmationElement = formType === 'add' ? document.getElementById('confirmationMessage') : document.getElementById('editConfirmationMessage');
    const saveButton = formType === 'add' ? addMemberBtn : saveBtn;

    if (!errorElement || !confirmationElement || !saveButton) {
        console.error(`checkProfileContent: Missing elements - errorElement: ${!!errorElement}, confirmationElement: ${!!confirmationElement}, saveButton: ${!!saveButton}`);
        return;
    }

    if (!name && !isProfileEmpty) {
        errorElement.textContent = 'Name cannot be empty.';
        return;
    } else if ((type === 'Classes' || type === 'Athletic') && !ageGroup) {
        errorElement.textContent = 'Age group is required for Classes or Athletic memberships.';
        return;
    } else if (!isUnlimited && type && addedDays <= 0) {
        errorElement.textContent = 'Please specify a number of days greater than 0.';
        return;
    } else if (addedDays > 0 && !type && !isUnlimited) {
        errorElement.textContent = 'Please select a membership type when specifying days.';
        return;
    } else if (openGym < 0 || classes < 0 || privateKids < 0 || privateAdults < 0 || aerialSilks < 0) {
        errorElement.textContent = 'Pass counts cannot be negative.';
        return;
    } else if (startDate && isNaN(new Date(startDate).getTime())) {
        errorElement.textContent = 'Invalid Start Date format. Please use YYYY-MM-DD.';
        return;
    } else {
        errorElement.textContent = '';
    }

    if (isProfileEmpty && !isConfirmingSave) {
        confirmationElement.textContent = 'This profile has no membership or passes. Are you sure you want to save?';
        confirmationElement.style.display = 'inline-block';
        saveButton.textContent = formType === 'add' ? 'Add Anyway' : 'Save Anyway';
        saveButton.style.minWidth = '100px';
        isConfirmingSave = true;
    } else {
        confirmationElement.textContent = '';
        confirmationElement.style.display = 'none';
        saveButton.textContent = formType === 'add' ? 'Add' : 'Save';
        saveButton.style.minWidth = '61px';
        isConfirmingSave = false;
    }
}

function toggleFilterPanel() {
    console.log('toggleFilterPanel: Toggling', { isOpen: filterPanel.style.display === 'block' });
    if (filterPanel.style.display === 'block') {
        filterPanel.style.display = 'none';
    } else {
        filterPanel.style.display = 'block';
        // Close any open drawers to prevent overlap
        const activityLog = document.getElementById('activityLog');
        const historyDrawer = document.getElementById('historyDrawer');
        const statsDrawer = document.getElementById('statsDrawer');
        activityLog.classList.remove('open');
        historyDrawer.classList.remove('open');
        statsDrawer.classList.remove('open');
        activeDrawer = null;
        updateBottomBarButtons();
    }
}

function updateActiveFilterBadge() {
    console.log('updateActiveFilterBadge:', { activeMembershipFilter });
    if (!activeFilterBadge || !searchInput) {
        console.error('updateActiveFilterBadge: Missing elements', {
            activeFilterBadge: !!activeFilterBadge,
            searchInput: !!searchInput
        });
        return;
    }

    // Only show badge in mobile view (<=768px)
    if (window.innerWidth > 768) {
        activeFilterBadge.style.display = 'none';
        searchInput.classList.remove('with-badge');
        return;
    }

    if (activeMembershipFilter) {
        const typeClass = activeMembershipFilter === 'Unlimited Open Gym'
            ? 'unlimited'
            : activeMembershipFilter.toLowerCase().replace(' ', '-');
        const displayText = activeMembershipFilter === 'Unlimited Open Gym' ? 'Unlimited' : activeMembershipFilter;
        activeFilterBadge.innerHTML = `
            <span class="type-badge ${typeClass}">${displayText}</span>
            <button class="clear-filter-btn" onclick="clearFilter()">×</button>
        `;
        activeFilterBadge.style.display = 'flex';
        searchInput.classList.add('with-badge');
    } else {
        activeFilterBadge.innerHTML = '';
        activeFilterBadge.style.display = 'none';
        searchInput.classList.remove('with-badge');
    }
}
function clearFilter() {
    console.log('clearFilter: Clearing filter', { activeMembershipFilter });
    if (activeMembershipFilter) {
        activeMembershipFilter = null;
        manualSearchActive = false;
        searchInput.value = '';
        lastSearchTerm = '';
        updateFilterButtonStates();
        updateActiveFilterBadge();
        fetchSuggestedCheckIns();
    }
}
function updateFilterButtonStates() {
    console.log('updateFilterButtonStates:', { activeMembershipFilter });
    const filterButtons = document.querySelectorAll('.search-container .type-btn, .filter-panel .type-badge');
    filterButtons.forEach(button => {
        const buttonType = button.dataset.type;
        if (buttonType === activeMembershipFilter) {
            button.classList.add('selected');
        } else {
            button.classList.remove('selected');
        }
    });
}

function showQRPopup() {
    console.log('showQRPopup: Attempting to toggle QR popup');
    try {
        const qrPopup = document.getElementById('qrPopup');
        const qrCodeImage = document.getElementById('qrCodeImage');
        const appUrl = document.getElementById('appUrl');
        const appLink = 'https://script.google.com/macros/s/AKfycbxf5v0TVhZZJnGBNo19mnc2lbrYQONrgwQD3cok735RfNgPMlZWinxlRfT2sv8zcAmjfQ/exec'; // Replace with actual app URL

        console.log('showQRPopup: Element check', {
            qrPopup: !!qrPopup,
            qrCodeImage: !!qrCodeImage,
            appUrl: !!appUrl,
            screenWidth: window.innerWidth
        });

        if (!qrPopup || !qrCodeImage || !appUrl) {
            console.error('showQRPopup: Missing DOM elements', {
                qrPopup: !!qrPopup,
                qrCodeImage: !!qrCodeImage,
                appUrl: !!appUrl
            });
            return;
        }

        if (qrPopup.style.display === 'flex') {
            qrPopup.style.display = 'none';
            console.log('showQRPopup: Pop-up hidden');
        } else {
            qrCodeImage.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(appLink);
            appUrl.href = appLink;
            qrPopup.style.display = 'flex';
            console.log('showQRPopup: Pop-up displayed');
        }
    } catch (error) {
        console.error('showQRPopup: Error occurred', error);
    }
}
console.log('showQRPopup defined:', typeof showQRPopup === 'function');


// Ensure openTransferredOrderId is defined
let pendingOrdersCount = 0;
let transferredOrdersCount = 0;
let currentOrders = [];
let transferredOrders = [];
let openOrderId = null;
let openTransferredOrderId = null;
let isOrdersView = false;

function fetchOnlineOrders() {
    google.script.run
        .withSuccessHandler(response => {
            pendingOrdersCount = response.count || 0;
            updateOrderNotification();
        })
        .withFailureHandler(error => {
            console.error('Failed to fetch orders:', error);
            pendingOrdersCount = 0;
            updateOrderNotification();
        })
        .fetchSquareOrders();
}

function updateOrderNotification() {
    const notification = document.getElementById('orderNotification');
    const mobileNotification = document.getElementById('orderNotificationMobile');
    notification.textContent = pendingOrdersCount;
    mobileNotification.textContent = pendingOrdersCount;
    if (pendingOrdersCount >= 1) {
        notification.classList.add('has-orders');
        mobileNotification.classList.add('has-orders');
    } else {
        notification.classList.remove('has-orders');
        mobileNotification.classList.remove('has-orders');
    }
}

function showOrders(event) {
    if (event) {
        event.stopPropagation();
        console.log('showOrders: Stopped event propagation', { eventTarget: event.target.id });
    }

    const ordersDrawer = document.getElementById('ordersDrawer');
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    console.log('showOrders: Called', {
        isMobile,
        ordersDrawerExists: !!ordersDrawer,
        ordersDrawerClasses: ordersDrawer?.classList.toString(),
        isOrdersView,
        activeDrawer,
        screenWidth: window.innerWidth
    });

    if (!ordersDrawer) {
        console.error('showOrders: ordersDrawer not found');
        showError('Orders drawer not found.', refreshData);
        return;
    }

    if (isMobile && ordersDrawer.classList.contains('open')) {
        console.log('showOrders: Closing ordersDrawer on mobile');
        closeOrdersDrawer();
        return;
    }

    isOrdersView = true;
    openOrdersDrawer();
    const ordersContent = document.getElementById('ordersContent');
    if (ordersContent) {
        ordersContent.innerHTML = '<div style="padding: 15px; text-align: center;">Loading Orders...</div>';
    } else {
        console.error('showOrders: ordersContent not found');
    }

    google.script.run
        .withSuccessHandler(() => {
            google.script.run
                .withSuccessHandler(orders => {
                    console.log('showOrders: Raw pending orders count:', orders.length);
                    currentOrders = groupOrdersByOrderID(orders);
                    pendingOrdersCount = currentOrders.length;
                    console.log('showOrders: Grouped currentOrders count:', currentOrders.length);
                    google.script.run
                        .withSuccessHandler(transferred => {
                            showLoading(false);
                            console.log('showOrders: Raw transferred orders count:', transferred.length);
                            transferredOrders = groupOrdersByOrderID(transferred);
                            transferredOrdersCount = transferredOrders.length;
                            console.log('showOrders: Grouped transferredOrders count:', transferredOrders.length);
                            updateOrderNotification();
                            updateOrdersDrawer();
                        })
                        .withFailureHandler(error => {
                            showLoading(false);
                            console.error('Failed to fetch transferred orders:', error);
                            transferredOrders = [];
                            transferredOrdersCount = 0;
                            updateOrderNotification();
                            updateOrdersDrawer();
                        })
                        .getTransferredOrders();
                })
                .withFailureHandler(error => {
                    showLoading(false);
                    console.error('Failed to fetch pending orders:', error);
                    currentOrders = [];
                    pendingOrdersCount = 0;
                    updateOrderNotification();
                    updateOrdersDrawer();
                })
                .getPendingOrders();
        })
        .withFailureHandler(error => {
            showLoading(false);
            console.error('Failed to fetch Square orders:', error);
            pendingOrdersCount = 0;
            updateOrderNotification();
        })
        .fetchSquareOrders();
}

function openOrdersDrawer() {
    console.log('openOrdersDrawer: Starting', { activeDrawer, screenWidth: window.innerWidth });

    const ordersDrawer = document.getElementById('ordersDrawer');
    const activityLog = document.getElementById('activityLog');
    const historyDrawer = document.getElementById('historyDrawer');
    const statsDrawer = document.getElementById('statsDrawer');

    console.log('openOrdersDrawer: State', {
        ordersDrawerExists: !!ordersDrawer,
        ordersDrawerClasses: ordersDrawer?.classList.toString(),
        activityLogOpen: activityLog?.classList.contains('open'),
        historyDrawerOpen: historyDrawer?.classList.contains('open'),
        statsDrawerOpen: statsDrawer?.classList.contains('open')
    });

    if (!ordersDrawer) {
        console.error('openOrdersDrawer: ordersDrawer not found');
        showError('Orders drawer not found.', refreshData);
        return;
    }

    // Close all other drawers
    if (activityLog) activityLog.classList.remove('open');
    if (historyDrawer) historyDrawer.classList.remove('open');
    if (statsDrawer) statsDrawer.classList.remove('open');
    // Open ordersDrawer
    ordersDrawer.classList.add('open');

    activeDrawer = 'orders';
    updateBottomBarButtons();
    updateFloatingButtonVisibility();

    console.log('openOrdersDrawer: Completed', {
        ordersDrawerClasses: ordersDrawer.classList.toString(),
        activeDrawer
    });
}

function closeOrdersDrawer() {
    const ordersDrawer = document.getElementById('ordersDrawer');
    ordersDrawer.classList.remove('open');
    activeDrawer = null;
    isOrdersView = false;
    updateBottomBarButtons();
    updateFloatingButtonVisibility();
}

function toggleTransferredOrders() {
    const content = document.getElementById('transferredOrdersContent');
    const btn = document.querySelector('.transfers-btn');
    if (content.classList.contains('open')) {
        content.classList.remove('open');
        btn.textContent = 'Completed Transfers';
    } else {
        content.classList.add('open');
        btn.textContent = 'Hide Completed Transfers';
        updateOrdersDrawer();
    }
}

function updateOrdersDrawer() {
    const ordersContent = document.getElementById('ordersContent');
    const transferredContent = document.getElementById('transferredOrdersContent');
    const logHeader = document.getElementById('ordersDrawer').querySelector('.log-header');
    logHeader.querySelector('.log-count').textContent = `(${pendingOrdersCount})`;

    ordersContent.innerHTML = '';
    if (!currentOrders || currentOrders.length === 0) {
        ordersContent.innerHTML = '<div style="padding: 15px;">No pending orders available.</div>';
    } else {
        currentOrders.forEach(order => {
            const date = formatDate(order.PurchaseDate);
            const participantNames = order.Items.map(item => item.ParticipantName).join(', ');
            const passTypes = order.Items.map(item => item.PassType).join(', ');
            const variationNames = order.Items.map(item => item.VariationName).filter(v => v).join(', ');
            const div = document.createElement('div');
            div.className = 'order-entry';
            div.innerHTML = `
                <div class="order-action">
                    <span class="date">${date}</span>
                    <div>
                        <span class="member-name">${participantNames}</span>
                        <div class="pass-type">${passTypes}</div>
                        <div class="variation">${variationNames}</div>
                    </div>
                    <span class="chevron">${openOrderId === order.OrderID ? '▲' : '▼'}</span>
                </div>
                <div id="details-${order.OrderID}" class="order-details" style="display: ${openOrderId === order.OrderID ? 'block' : 'none'}">
                    ${order.Items.map((item, index) => `
                        <div class="order-subdetails">
                            <p><strong>Item ${index + 1} Participant Name:</strong> <span class="copyable-name" title="Click to copy and search name">${item.ParticipantName}</span></p>
                            <p><strong>Pass Type:</strong> ${item.PassType}</p>
                            <p><strong>Variation Name:</strong> ${item.VariationName || 'N/A'}</p>
                            <p><strong>Notes:</strong> ${item.Notes}</p>
                        </div>
                    `).join('')}
                    <p><strong>Recipient Name:</strong> ${order.CustomerName}</p>
                    <p><strong>Reference ID:</strong> ${order.ReferenceID}</p>
                    <p><strong>Receipt ID:</strong> ${order.ReceiptID}</p>
                    <p><strong>Purchase Date:</strong> ${date}</p>
                    <p><strong>Total Quantity:</strong> ${order.Quantity}</p>
                    <p><strong>Total Amount:</strong> ${order.Amount}</p>
                    <p><strong>Status:</strong> ${order.Status}</p>
                    <button class="action-btn" data-order-id="${order.OrderID}" data-client-order='${JSON.stringify(order)}'>Mark as Transferred</button>
                </div>
            `;
            div.querySelector('.order-action').addEventListener('click', (e) => {
                if (e.target.classList.contains('copyable-name')) return;
                toggleOrderDetails(order.OrderID);
            });
            div.querySelectorAll('.copyable-name').forEach(nameElement => {
                nameElement.addEventListener('click', () => {
                    const name = nameElement.textContent;
                    copyToClipboard(name);
                    nameElement.classList.add('copied');
                    setTimeout(() => nameElement.classList.remove('copied'), 1000);
                    searchInput.value = name;
                    manualSearchActive = true;
                    lastSearchTerm = name;
                    activeMembershipFilter = null;
                    updateFilterButtonStates();
                    showLoading(true);
                    google.script.run
                        .withSuccessHandler(results => {
                            showLoading(false);
                            displayResults(results);
                        })
                        .withFailureHandler(error => {
                            showLoading(false);
                            showError('Failed to search participant: ' + error.message);
                        })
                        .searchSheet(name);
                });
            });
            const transferButton = div.querySelector('.action-btn');
            transferButton.addEventListener('click', () => {
                console.log('Mark as Transferred clicked for OrderID:', order.OrderID);
                markOrderTransferred(order.OrderID, order);
            });
            ordersContent.appendChild(div);
        });
    }

    transferredContent.innerHTML = '';
    if (!transferredOrders || transferredOrders.length === 0) {
        transferredContent.innerHTML = '<div style="padding: 15px;">No completed transfers.</div>';
    } else {
        transferredOrders.forEach(order => {
            const div = document.createElement('div');
            div.className = 'order-entry transferred-order-entry';
            const participantNames = order.Items.map(item => item.ParticipantName).join(', ');
            const passTypes = order.Items.map(item => item.PassType).join(', ');
            const variationNames = order.Items.map(item => item.VariationName).filter(v => v).join(', ');
            div.innerHTML = `
                <div class="order-action">
                    <span class="date"></span>
                    <div>
                        <span class="member-name">${participantNames}</span>
                        <div class="pass-type">${passTypes}</div>
                        <div class="variation">${variationNames}</div>
                    </div>
                    <span class="chevron">${openTransferredOrderId === order.OrderID ? '▲' : '▼'}</span>
                </div>
                <div id="transferred-details-${order.OrderID}" class="order-details" style="display: ${openTransferredOrderId === order.OrderID ? 'block' : 'none'}">
                    ${order.Items.map((item, index) => `
                        <div class="order-subdetails">
                            <p><strong>Item ${index + 1} Participant Name:</strong> <span class="copyable-name" title="Click to copy and search name">${item.ParticipantName}</span></p>
                            <p><strong>Pass Type:</strong> ${item.PassType}</p>
                            <p><strong>Variation Name:</strong> ${item.VariationName || 'N/A'}</p>
                            <p><strong>Notes:</strong> ${item.Notes}</p>
                        </div>
                    `).join('')}
                    <p><strong>Recipient Name:</strong> ${order.CustomerName}</p>
                    <p><strong>Reference ID:</strong> ${order.ReferenceID}</p>
                    <p><strong>Receipt ID:</strong> ${order.ReceiptID}</p>
                </div>
            `;
            div.querySelector('.order-action').addEventListener('click', (e) => {
                if (e.target.classList.contains('copyable-name')) return;
                toggleTransferredOrderDetails(order.OrderID);
            });
            div.querySelectorAll('.copyable-name').forEach(nameElement => {
                nameElement.addEventListener('click', () => {
                    const name = nameElement.textContent;
                    copyToClipboard(name);
                    nameElement.classList.add('copied');
                    setTimeout(() => nameElement.classList.remove('copied'), 1000);
                    searchInput.value = name;
                    manualSearchActive = true;
                    lastSearchTerm = name;
                    activeMembershipFilter = null;
                    updateFilterButtonStates();
                    showLoading(true);
                    google.script.run
                        .withSuccessHandler(results => {
                            showLoading(false);
                            displayResults(results);
                        })
                        .withFailureHandler(error => {
                            showLoading(false);
                            showError('Failed to search participant: ' + error.message);
                        })
                        .searchSheet(name);
                });
            });
            transferredContent.appendChild(div);
        });
    }
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function toggleOrderDetails(orderId, event) {
    if (event) {
        event.stopPropagation();
        console.log('toggleOrderDetails: Stopped propagation', { orderId });
    }

    const detailsDiv = document.getElementById(`details-${orderId}`);
    if (openOrderId === orderId) {
        detailsDiv.style.display = 'none';
        openOrderId = null;
    } else {
        if (openOrderId) {
            document.getElementById(`details-${openOrderId}`).style.display = 'none';
        }
        detailsDiv.style.display = 'block';
        openOrderId = orderId;
        const order = currentOrders.find(o => o.OrderID === orderId);
        if (order && order.ParticipantName) {
            searchInput.value = order.ParticipantName;
            manualSearchActive = true;
            lastSearchTerm = order.ParticipantName;
            showLoading(true);
            google.script.run
                .withSuccessHandler(results => {
                    showLoading(false);
                    currentSuggestionsData = results;
                    if (!isWaiverView) {
                        displayResults(results);
                    }
                    // Ensure drawer stays open after search
                    const ordersDrawer = document.getElementById('ordersDrawer');
                    if (ordersDrawer && !ordersDrawer.classList.contains('open')) {
                        ordersDrawer.classList.add('open');
                        activeDrawer = 'orders';
                        updateBottomBarButtons();
                        console.log('toggleOrderDetails: Re-opened ordersDrawer after search');
                    }
                })
                .withFailureHandler(error => {
                    showLoading(false);
                    showError('Failed to search participant: ' + error.message);
                })
                .searchSheet(order.ParticipantName);
        }
    }
    updateOrdersDrawer();
}

function markOrderTransferred(orderId, orderData) {
    console.log('markOrderTransferred called with OrderID:', orderId, 'OrderData:', orderData);
    showLoading(true);
    google.script.run
        .withSuccessHandler(response => {
            showLoading(false);
            if (response.success) {
                console.log('Order marked as transferred:', orderId);
                pendingOrdersCount--;
                transferredOrdersCount++;
                currentOrders = currentOrders.filter(o => o.OrderID !== orderId);
                transferredOrders.push(orderData);
                if (openOrderId === orderId) {
                    openOrderId = null;
                }
                updateOrderNotification();
                updateOrdersDrawer();
            } else {
                console.error('Failed to mark order as transferred:', response.error);
                showError('Failed to mark order as transferred: ' + response.error);
            }
        })
        .withFailureHandler(error => {
            showLoading(false);
            console.error('Failed to mark order as transferred:', error);
            showError('Failed to mark order as transferred: ' + error.message);
        })
        .markOrderTransferred(orderId, orderData);
}

function refreshData() {
    const searchTerm = searchInput.value.trim();
    console.log('refreshData: Starting', {
        searchTerm,
        isWaiverView,
        isOrdersView,
        activeMembershipFilter,
        manualSearchActive,
        previousScreenState
    });
    showLoading(true);
    allData = [];

    if (isOrdersView) {
        fetchOnlineOrders();
        showOrders();
    } else if (activeMembershipFilter) {
        previousScreenState = 'filter';
        google.script.run
            .withSuccessHandler((results) => {
                console.log('refreshData: Fetched filtered memberships:', results);
                currentSuggestionsData = results;
                if (!isWaiverView) {
                    displayResults(results);
                }
                fetchTodayLogs();
                fetchStats();
                fetchOnlineOrders();
                closeHistoryDrawer();
                showLoading(false);
                updateBottomBarButtons();
            })
            .withFailureHandler((error) => {
                console.error('refreshData: Error fetching filtered memberships:', error);
                showLoading(false);
                showError('Failed to refresh filtered memberships: ' + error.message);
                updateBottomBarButtons();
            })
            .filterByMembershipType(activeMembershipFilter, searchTerm && lastSearchTerm ? lastSearchTerm : null);
    } else if (!searchTerm) {
        manualSearchActive = false;
        previousScreenState = 'eci';
        google.script.run
            .withSuccessHandler((suggestedMembers) => {
                console.log('refreshData: Fetched suggested check-ins:', suggestedMembers);
                currentSuggestionsData = suggestedMembers;
                if (!isWaiverView) {
                    displayResults(suggestedMembers);
                }
                fetchTodayLogs();
                fetchStats();
                fetchOnlineOrders();
                closeHistoryDrawer();
                showLoading(false);
                updateBottomBarButtons();
            })
            .withFailureHandler((error) => {
                console.error('refreshData: Error fetching suggested check-ins:', error);
                showLoading(false);
                searchError(error);
                updateBottomBarButtons();
            })
            .getSuggestedCheckIns();
    } else {
        manualSearchActive = true;
        lastSearchTerm = searchTerm;
        previousScreenState = 'search';
        google.script.run
            .withSuccessHandler((results) => {
                console.log('refreshData: Fetched search results:', results);
                currentSuggestionsData = results;
                if (!isWaiverView) {
                    displayResults(results);
                }
                fetchTodayLogs();
                fetchStats();
                fetchOnlineOrders();
                closeHistoryDrawer();
                showLoading(false);
                updateBottomBarButtons();
            })
            .withFailureHandler((error) => {
                console.error('refreshData: Error fetching search results:', error);
                manualSearchActive = false;
                showLoading(false);
                searchError(error);
                updateBottomBarButtons();
            })
            .searchSheet(searchTerm);
    }
}

function groupOrdersByOrderID(orders) {
    const grouped = {};
    orders.forEach((order, index) => {
        const orderId = order.OrderID || `unknown-${index}`;
        console.log('groupOrdersByOrderID: Processing order', { index, orderId, order: JSON.stringify(order, null, 2) });
        if (!grouped[orderId]) {
            grouped[orderId] = {
                OrderID: orderId,
                PurchaseDate: order.PurchaseDate || 'N/A',
                CustomerName: order.CustomerName || 'N/A',
                ReferenceID: order.ReferenceID || 'N/A',
                ReceiptID: order.ReceiptID || 'N/A',
                Status: order.Status || 'N/A',
                Amount: order.Amount || 'N/A',
                Quantity: order.Quantity || 'N/A',
                Items: []
            };
        }
        const participantName = order.ParticipantName || 'Unknown Participant';
        grouped[orderId].Items.push({
            ParticipantName: participantName,
            PassType: order.PassType || 'Unknown',
            VariationName: order.VariationName || '',
            Notes: order.Notes || 'N/A'
        });
    });
    const result = Object.values(grouped);
    console.log('groupOrdersByOrderID: Final grouped orders count:', result.length, JSON.stringify(result, null, 2));
    return result;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Visual feedback handled by event listener
    }).catch(err => {
        console.error('Failed to copy name:', err);
        alert('Failed to copy name. Please copy it manually.');
    });
}
