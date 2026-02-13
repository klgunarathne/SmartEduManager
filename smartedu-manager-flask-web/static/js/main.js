// ==================== Global JavaScript ====================

// DOM elements
const flashMessages = document.querySelectorAll('.flash-message');
const flashCloseButtons = document.querySelectorAll('.flash-close');

// Close flash messages
flashCloseButtons.forEach(function(button, index) {
    button.addEventListener('click', function() {
        const message = flashMessages[index];
        message.style.animation = 'fadeOut 0.3s ease';
        setTimeout(function() {
            message.style.display = 'none';
        }, 300);
    });
});

// Auto close flash messages after 5 seconds
flashMessages.forEach(function(message) {
    setTimeout(function() {
        message.style.animation = 'fadeOut 0.3s ease';
        setTimeout(function() {
            message.style.display = 'none';
        }, 300);
    }, 5000);
});

// ==================== Responsive Navigation ====================

// Handle sidebar collapse on small screens
function handleResize() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (window.innerWidth <= 768) {
        sidebar.classList.add('collapsed');
        mainContent.classList.remove('expanded');
    } else {
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('expanded');
    }
}

// Event listener for window resize
window.addEventListener('resize', handleResize);

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    handleResize();
    
    // Add click outside sidebar listener for mobile
    document.addEventListener('click', function(event) {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        
        if (window.innerWidth <= 768 && 
            sidebar && !sidebar.classList.contains('collapsed') &&
            !sidebar.contains(event.target) && 
            !sidebarToggle.contains(event.target)) {
            sidebar.classList.add('collapsed');
            const mainContent = document.getElementById('mainContent');
            if (mainContent) {
                mainContent.classList.remove('expanded');
            }
        }
    });
});

// ==================== Form Validation ====================

// Add form validation on submit
document.querySelectorAll('form').forEach(function(form) {
    form.addEventListener('submit', function(event) {
        // Basic form validation
        const inputs = form.querySelectorAll('[required]');
        let isValid = true;
        
        inputs.forEach(function(input) {
            if (!input.value.trim()) {
                isValid = false;
                showInputError(input, 'This field is required');
            } else {
                clearInputError(input);
            }
        });
        
        // Email validation
        const emailInputs = form.querySelectorAll('[type="email"]');
        emailInputs.forEach(function(input) {
            if (input.value && !isValidEmail(input.value)) {
                isValid = false;
                showInputError(input, 'Please enter a valid email address');
            }
        });
        
        if (!isValid) {
            event.preventDefault();
        }
    });
});

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show input error
function showInputError(input, message) {
    // Remove existing error
    clearInputError(input);
    
    // Add error class
    input.classList.add('input-error');
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.textContent = message;
    
    // Append error message
    input.parentNode.appendChild(errorDiv);
}

// Clear input error
function clearInputError(input) {
    input.classList.remove('input-error');
    const errorDiv = input.parentNode.querySelector('.form-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// ==================== Search Functionality ====================

// Add search functionality to search inputs
document.querySelectorAll('.search-input').forEach(function(input) {
    input.addEventListener('input', function(event) {
        const searchTerm = event.target.value.toLowerCase().trim();
        const table = event.target.closest('.card-content').querySelector('.data-table');
        
        if (table) {
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(function(row) {
                const cells = row.querySelectorAll('td');
                let match = false;
                
                cells.forEach(function(cell, index) {
                    // Skip action buttons column
                    if (index < cells.length - 1) {
                        const text = cell.textContent.toLowerCase();
                        if (text.includes(searchTerm)) {
                            match = true;
                        }
                    }
                });
                
                row.style.display = match || searchTerm === '' ? '' : 'none';
            });
        }
    });
});

// ==================== Table Sorting ====================

// Add sorting functionality to table headers
document.querySelectorAll('.data-table thead th').forEach(function(th, index) {
    th.addEventListener('click', function() {
        const table = th.closest('.data-table');
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        // Skip if it's the action buttons column
        if (index === rows[0].querySelectorAll('td').length - 1) {
            return;
        }
        
        // Toggle sort direction
        const isAscending = !th.classList.contains('sorted-asc');
        th.classList.remove('sorted-asc', 'sorted-desc');
        th.classList.add(isAscending ? 'sorted-asc' : 'sorted-desc');
        
        // Remove sort classes from other headers
        table.querySelectorAll('thead th').forEach(function(otherTh, otherIndex) {
            if (otherIndex !== index) {
                otherTh.classList.remove('sorted-asc', 'sorted-desc');
            }
        });
        
        // Sort rows
        rows.sort(function(rowA, rowB) {
            const cellA = rowA.querySelectorAll('td')[index].textContent.trim();
            const cellB = rowB.querySelectorAll('td')[index].textContent.trim();
            
            // Numeric sorting
            if (!isNaN(cellA) && !isNaN(cellB)) {
                const numA = parseFloat(cellA);
                const numB = parseFloat(cellB);
                return isAscending ? numA - numB : numB - numA;
            }
            
            // Text sorting
            return isAscending 
                ? cellA.localeCompare(cellB) 
                : cellB.localeCompare(cellA);
        });
        
        // Reappend sorted rows
        rows.forEach(function(row) {
            tbody.appendChild(row);
        });
    });
});