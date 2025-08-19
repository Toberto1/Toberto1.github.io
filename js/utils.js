import * as global from './globals.js';



export function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

//This function only works on elements that can have children
export function whiteFlash(elementID) {
    const element = document.getElementById(elementID);
    if (!element) return;

    // Create overlay div
    const flashOverlay = document.createElement('div');
    flashOverlay.style.position = 'absolute';
    flashOverlay.style.top = '0';
    flashOverlay.style.left = '0';
    flashOverlay.style.width = '100%';
    flashOverlay.style.height = '100%';
    flashOverlay.style.backgroundColor = 'white';
    flashOverlay.style.opacity = '0.9';
    flashOverlay.style.pointerEvents = 'none';
    flashOverlay.style.zIndex = '1000';
    flashOverlay.style.transition = 'opacity 0.5s ease';

    // Make sure parent is positioned relatively
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.position === 'static') {
        element.style.position = 'relative';
    }

    // Append overlay
    element.appendChild(flashOverlay);

    // Trigger opacity fade out
    requestAnimationFrame(() => {
        flashOverlay.style.opacity = '0';
    });

    // Remove overlay after transition ends
    flashOverlay.addEventListener('transitionend', () => {
        if (flashOverlay.parentElement) {
            flashOverlay.parentElement.removeChild(flashOverlay);
        }
    }, { once: true });
}


export function daysBetweenISO(date1, date2) {
    const toDateOnly = iso => {
        const d = new Date(iso);
        // Get date parts in local time zone
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };

    const d1 = toDateOnly(date1);
    const d2 = toDateOnly(date2);

    const diffTime = d2 - d1;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}




export function calculateEndDate(startDate, addedDays, totalDaysPaused) {
    if (!startDate || addedDays <= 0) {
        return startDate;
    }

    const startDateObj = new Date(startDate);
    if (isNaN(startDateObj.getTime())) {
        return startDate;
    }
    console.log("addedDays:", addedDays);
    const totalDays = addedDays + totalDaysPaused;

    const endDate = new Date(startDateObj);
    endDate.setDate(startDateObj.getDate() + totalDays - 1); // Subtract 1 to include the start date in the count

    return endDate.toISOString().split('T')[0];
}

export function inputMissing(elementID) {
    document.getElementById(elementID).classList.add('missing');
}

export function clearAll(parent, classType) {
    parent.querySelectorAll(classType).forEach((element) => {
        if ((element.tagName === 'INPUT' && ['button', 'submit', 'reset'].includes(element.type)) || element.tagName === 'BUTTON')
            return;
        element.value = '';
    });
}

export function clearMemberships(parentId) {
    document.getElementById(parentId).querySelectorAll(`.membership-row`).forEach((element) => {
        element.remove();
    });
}

export function clearAddAccountTab() {
    clearAll(document.getElementById('addAccount-container'), 'input, select, textarea');
    clearMemberships("addAccount-container");
    global.resetMembershipCounter("add");

    const firstRadio = document.getElementById('addAccount-container').querySelector('input[type="radio"]');
    if (firstRadio) {
        firstRadio.checked = true;
        firstRadio.dispatchEvent(new Event('change'));
    }
}

export function kick() {
    window.location.href = '/auth.html';
}

export function formatPostgresDateForInput(pgDate) {
    if (pgDate === null) return '';
    const date = new Date(pgDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function isExpired(date) {
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return date && new Date(date) < todayDate;
}

export function applyPreset(preset) {
    const startDateInput = document.getElementById("log-start-date");
    const endDateInput = document.getElementById("log-end-date");

    const today = new Date();

    // Helper to format date as 'YYYY-MM-DD' for input[type=date]
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() is 0-based
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    switch (preset) {
        case "today": {
            const todayStr = formatDate(today);
            startDateInput.value = todayStr;
            endDateInput.value = todayStr;
            break;
        }
        case "7": { // Last 7 days
            const end = today;
            const start = new Date(today);
            start.setDate(start.getDate() - 6); // includes today = 7 days total
            startDateInput.value = formatDate(start);
            endDateInput.value = formatDate(end);
            break;
        }
        case "30": { // Last 30 days
            const end = today;
            const start = new Date(today);
            start.setDate(start.getDate() - 29); // 30 days total including today
            startDateInput.value = formatDate(start);
            endDateInput.value = formatDate(end);
            break;
        }
        case "alltime": {
            const end = today;
            const start = new Date(today);
            start.setDate(start.getDate() - 365 * 5); // 30 days total including today
            startDateInput.value = formatDate(start);
            endDateInput.value = formatDate(end);
            break;
        }
        default: {
            // Clear inputs or leave unchanged
            startDateInput.value = "";
            endDateInput.value = "";
        }
    }

    whiteFlash("log-filter-startdate-container");
    whiteFlash("log-filter-enddate-container");
}

export function passDBToReadable(key) {
    switch (key) {
        case 'opengympasses': return 'Open Gym';
        case 'classpasses': return 'Classes';
        case 'privatekidpasses': return 'Private Kid';
        case 'privateadultpasses': return 'Private Adult';
        case 'aerialsilkspasses': return 'Aerial Silks';
    }
    return "";
}

export function toggleElement(id) {
    document.getElementById(id)?.classList.toggle('hidden');
}

const animations = [
    '../animations/loadingAnimation1.json',
    '../animations/loadingAnimation2.json',
    '../animations/loadingAnimation3.json',
    '../animations/loadingAnimation4.json',
    '../animations/loadingAnimation5.json',
    '../animations/loadingAnimation6.json',
    '../animations/loadingAnimation7.json'
]

const latestLoadingIdMap = new Map();

/**
 * Show or hide loading overlay on a target element.
 * @param {string} elementId - The DOM element ID to show the overlay on.
 * @param {boolean} isLoading - true to show, false to hide.
 * @param {string|number} [callId] - Optional unique call ID for controlling which call can stop loading.
 * @returns {string|number|undefined} - Returns the call ID when starting loading; undefined when stopping.
 */
export function isLoading(elementId, isLoading, callId) {
    const target = document.getElementById(elementId);
    if (!target) {
        console.warn(`Element with ID "${elementId}" not found.`);
        return;
    }

    const overlays = target.querySelectorAll('.lottie-overlay');

    if (isLoading) {
        // Generate a unique call ID if none provided
        const newCallId = callId ?? (Date.now() + Math.random());
        latestLoadingIdMap.set(elementId, newCallId);

        // Remove any old overlays immediately and clear fade timers
        overlays.forEach(overlay => {
            if (overlay._fadeTimeout) {
                clearTimeout(overlay._fadeTimeout);
            }
            overlay.remove();
        });

        const animationUrl = animations[Math.floor(Math.random() * animations.length)];

        const overlay = document.createElement('div');
        overlay.className = 'lottie-overlay';
        Object.assign(overlay.style, {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: target.clientHeight + 'px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            transition: 'opacity 0.3s ease'
        });

        const player = document.createElement('lottie-player');
        player.setAttribute('src', animationUrl);
        player.setAttribute('autoplay', '');
        player.setAttribute('loop', '');
        player.style.width = '150px';
        player.style.height = '150px';

        overlay.dataset.loadingId = newCallId.toString();

        overlay.appendChild(player);
        target.style.position = target.style.position || 'relative';
        target.appendChild(overlay);

        return newCallId;

    } else {
        // When stopping, only stop if callId matches the latest
        if (!callId) {
            console.warn('isLoading called to stop loading without callId — ignoring.');
            return;
        }

        overlays.forEach(overlay => {
            const loadingId = overlay.dataset.loadingId;
            const latestId = latestLoadingIdMap.get(elementId);

            if (loadingId !== callId.toString() || latestId !== callId) {
                // Not the latest or callId doesn’t match — ignore
                return;
            }

            overlay.classList.add('fadeOutAni');

            overlay._fadeTimeout = setTimeout(() => {
                // Only remove if still latest and matching callId
                if (latestLoadingIdMap.get(elementId) === callId) {
                    overlay.remove();
                    latestLoadingIdMap.delete(elementId);
                }
            }, 300);
        });
    }
}





window.applyPreset = applyPreset;
window.clearAddAccountTab = clearAddAccountTab;
window.toggleElement = toggleElement;