// Function to handle loading of the page
function onLoad() {
    loadSearchHistory();
}

// Function to load search history
function loadSearchHistory() {
    // Your logic to load search history here
}

// Function to handle search input
function onSearchInput(event) {
    const inputValue = event.detail.value;
    performSearch(inputValue);
}

// Function to perform search
function performSearch(query) {
    // Your logic to perform search here
}

// Function to handle history tap
function onHistoryTap(event) {
    const fundData = e.currentTarget.dataset.item;
    // Logic to handle fund data selection from history
}

// Function to clear history
function onClearHistory() {
    // Your logic to clear search history here
}

// Function to handle fund tap
function onFundTap(e) {
    const fundData = e.currentTarget.dataset.item; // Get fund data correctly
    // Your logic to handle fund tap action here
}

// Function to toggle favorite status
function onToggleFavorite(itemId) {
    // Your logic to toggle favorite status
}

// Function to handle cancel action
function onCancel() {
    // Your logic to handle cancel action
}

// Function to clear input
function onClear() {
    // Your logic to clear input
}