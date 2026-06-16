// ====================================================
// TOAST NOTIFICATION UTILITY
// ====================================================
const TOAST_ICONS = {
    success: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
    error: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`,
    warning: `<svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`,
    info: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`
};

function showToast(message, type = 'info', duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconDiv = document.createElement('div');
    iconDiv.className = 'toast-icon';
    iconDiv.innerHTML = TOAST_ICONS[type] || TOAST_ICONS.info;
    toast.appendChild(iconDiv);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'toast-content';
    contentDiv.innerHTML = message.replace(/\n/g, '<br>');
    toast.appendChild(contentDiv);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.title = 'Close notification';
    closeBtn.addEventListener('click', () => {
        dismissToast(toast);
    });
    toast.appendChild(closeBtn);

    container.appendChild(toast);

    const timeoutId = setTimeout(() => {
        dismissToast(toast);
    }, duration);

    toast.dataset.timeoutId = timeoutId;
}

function dismissToast(toast) {
    if (toast.classList.contains('toast-fade-out')) return;
    
    if (toast.dataset.timeoutId) {
        clearTimeout(parseInt(toast.dataset.timeoutId, 10));
    }

    toast.classList.add('toast-fade-out');
    toast.addEventListener('animationend', () => {
        toast.remove();
    });
}

document.addEventListener('DOMContentLoaded', () => { 
    // 1. Initialize Profile Upload Component
    const uploader = ProfileUploader('#profilePic', '#profilePreview', '#profilePreviewBtn', '#fileNameDisplay');
    
    // 2. Initialize Country-State-City Cascading Dropdowns
    const locationSelector = LocationSelector({
        country: '#country', customCountry: '#customCountry', customCountryWrapper: '#customCountryWrapper', toggleCountry: '#toggleCountry',
        state: '#state', customState: '#customState', customStateWrapper: '#customStateWrapper', toggleState: '#toggleState',
        city: '#city', customCity: '#customCity', customCityWrapper: '#customCityWrapper', toggleCity: '#toggleCity'
    });

    // 3. Initialize Global Form Validation and Review Logic
    FormManager('#registrationForm', uploader, locationSelector);
});

// ====================================================
// 1. PROFILE UPLOADER CONSTRUCTOR & PROTOTYPES
// ====================================================
function ProfileUploader(inputId, previewId, btnId, nameDisplayId) {
    const input = document.querySelector(inputId);
    const preview = document.querySelector(previewId);
    const btn = document.querySelector(btnId);
    const nameDisplay = document.querySelector(nameDisplayId);
    const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a0aec0'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

    function init() {
        if (btn && input) {
            btn.addEventListener('click', () => input.click());
        }
        const customBtn = document.querySelector('#customUploadBtn');
        if (customBtn && input) {
            customBtn.addEventListener('click', () => input.click());
        }
        if (input) {
            input.addEventListener('change', (e) => handleFileChange(e));
        }
    }

    function handleFileChange(e) {
        const file = e.target.files[0];
        
        if (!file) {
            reset();
            return;
        }

        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file (PNG, JPG, or GIF).', 'error');
            reset();
            return;
        }

        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            showToast('File size exceeds 2MB limit. Please choose a smaller image.', 'error');
            reset();
            return;
        }  

        if (nameDisplay) nameDisplay.textContent = file.name;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (preview) preview.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function reset() {
        if (input) input.value = '';
        if (preview) preview.src = defaultAvatar;
        if (nameDisplay) nameDisplay.textContent = "No file chosen";
    }

    init();

    return {
        getPreview: () => preview,
        getNameDisplay: () => nameDisplay,
        reset: reset
    };
}


// ====================================================
// 2. LOCATION SELECTOR CONSTRUCTOR & PROTOTYPES
// ====================================================
function LocationSelector(els) {
    const dom = {};
    for (let key in els) {
        dom[key] = document.querySelector(els[key]);
    }

    const countryStateMap = {
        "India": ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "Gujarat", "Rajasthan", "West Bengal", "Telangana", "Kerala"],
        "United States": ["California", "Texas", "New New York", "Florida", "Illinois", "Pennsylvania", "Ohio", "Georgia", "North Carolina", "Washington"],
        "United Kingdom": ["England", "Scotland", "Wales", "Northern Ireland"],
        "Canada": ["Ontario", "Quebec", "British Columbia", "Alberta", "Manitoba", "Saskatchewan", "Nova Scotia", "New Brunswick"],
        "Australia": ["New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia", "Tasmania"]
    };

    const stateCityMap = {
        "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik"],
        "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"],
        "Karnataka": ["Bengaluru", "Mysore", "Mangalore", "Hubli", "Belgaum"],
        "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem"],
        "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Ghaziabad", "Varanasi", "Agra"],
        "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
        "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Jhunjhunu"],
        "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Durgapur", "Siliguri"],
        "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
        "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Alappuzha"],
        "California": ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento"],
        "Texas": ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth"],
        "England": ["London", "Birmingham", "Manchester", "Liverpool", "Leeds"],
        "Ontario": ["Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton"],
        "New South Wales": ["Sydney", "Newcastle", "Wollongong", "Maitland", "Albury"]
    };

    function init() {
        if (!dom.country || !dom.state || !dom.city) return;

        dom.country.addEventListener('change', () => {
            if (dom.country.value === 'Other') {
                toggleCustom('country', true);
                toggleCustom('state', true);
                toggleCustom('city', true);
            } else {
                updateStateDropdown();
            }
        });

        dom.state.addEventListener('change', () => {
            if (dom.state.value === 'Other') {
                toggleCustom('state', true);
                toggleCustom('city', true);
            } else {
                updateCityDropdown();
            }
        });

        dom.city.addEventListener('change', () => {
            if (dom.city.value === 'Other') {
                toggleCustom('city', true);
            }
        });

        dom.toggleCountry.addEventListener('click', () => {
            toggleCustom('country', false);
            updateStateDropdown();
        });

        dom.toggleState.addEventListener('click', () => {
            toggleCustom('state', false);
            updateCityDropdown();
        });

        dom.toggleCity.addEventListener('click', () => {
            toggleCustom('city', false);
        });
    }

    function toggleCustom(prefix, showCustom) {
        const selectEl = dom[prefix];
        const wrapperEl = dom[`custom${prefix.charAt(0).toUpperCase() + prefix.slice(1)}Wrapper`];
        const inputEl = dom[`custom${prefix.charAt(0).toUpperCase() + prefix.slice(1)}`];

        if (showCustom) {
            selectEl.style.display = 'none';
            selectEl.required = false;
            wrapperEl.style.display = 'flex';
            inputEl.required = true;
            selectEl.value = 'Other';
            inputEl.focus();
        } else {
            wrapperEl.style.display = 'none';
            inputEl.required = false;
            inputEl.value = '';
            selectEl.style.display = 'block';
            selectEl.required = true;
            selectEl.value = '';
        }
    }

    function updateStateDropdown() {
        const selectedCountry = dom.country.value;
        
        toggleCustom('state', false);
        toggleCustom('city', false);

        dom.state.innerHTML = '';
        dom.city.innerHTML = '';
        dom.city.disabled = true;

        const placeholderCityOpt = document.createElement('option');
        placeholderCityOpt.value = '';
        placeholderCityOpt.disabled = true;
        placeholderCityOpt.selected = true;
        placeholderCityOpt.textContent = 'Select State First';
        dom.city.appendChild(placeholderCityOpt);

        if (selectedCountry && countryStateMap[selectedCountry]) {
            dom.state.disabled = false;

            const placeholderOpt = document.createElement('option');
            placeholderOpt.value = '';
            placeholderOpt.disabled = true;
            placeholderOpt.selected = true;
            placeholderOpt.textContent = 'Select State';
            dom.state.appendChild(placeholderOpt);

            countryStateMap[selectedCountry].forEach(state => {
                const option = document.createElement('option');
                option.value = state;
                option.textContent = state;
                dom.state.appendChild(option);
            });

            const otherOpt = document.createElement('option');
            otherOpt.value = 'Other';
            otherOpt.textContent = 'Other';
            dom.state.appendChild(otherOpt);
        } else {
            dom.state.disabled = true;
            const placeholderOpt = document.createElement('option');
            placeholderOpt.value = '';
            placeholderOpt.disabled = true;
            placeholderOpt.selected = true;
            placeholderOpt.textContent = 'Select Country First';
            dom.state.appendChild(placeholderOpt);
        }
    }

    function updateCityDropdown() {
        const selectedState = dom.state.value;
        
        toggleCustom('city', false);
        dom.city.innerHTML = '';

        if (selectedState && stateCityMap[selectedState]) {
            dom.city.disabled = false;

            const placeholderOpt = document.createElement('option');
            placeholderOpt.value = '';
            placeholderOpt.disabled = true;
            placeholderOpt.selected = true;
            placeholderOpt.textContent = 'Select City';
            dom.city.appendChild(placeholderOpt);

            stateCityMap[selectedState].forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                dom.city.appendChild(option);
            });

            const otherOpt = document.createElement('option');
            otherOpt.value = 'Other';
            otherOpt.textContent = 'Other';
            dom.city.appendChild(otherOpt);
        } else {
            dom.city.disabled = true;
            const placeholderOpt = document.createElement('option');
            placeholderOpt.value = '';
            placeholderOpt.disabled = true;
            placeholderOpt.selected = true;
            placeholderOpt.textContent = 'Select State First';
            dom.city.appendChild(placeholderOpt);
        }
    }

    function resetAll() {
        ['country', 'state', 'city'].forEach(p => toggleCustom(p, false));
        if (dom.state) {
            dom.state.innerHTML = '<option value="" disabled selected>Select Country First</option>';
            dom.state.disabled = true;
        }
        if (dom.city) {
            dom.city.innerHTML = '<option value="" disabled selected>Select State First</option>';
            dom.city.disabled = true;
        }
    }

    init();

    return {
        getDom: () => dom,
        getCountryStateMap: () => countryStateMap,
        getStateCityMap: () => stateCityMap,
        toggleCustom: toggleCustom,
        updateStateDropdown: updateStateDropdown,
        updateCityDropdown: updateCityDropdown,
        resetAll: resetAll
    };
}


// ====================================================
// 3. FORM MANAGER CONSTRUCTOR & PROTOTYPES (VALIDATION & REVIEW)
// ====================================================
function FormManager(formId, uploader, location) {
    const form = document.querySelector(formId);
    
    let duplicatePhoneAlerted = false;
    let isTableEditing = false;
    let currentFormData = {};

    const reviewContainer = document.querySelector('#reviewContainer');
    const reviewTableBody = document.querySelector('#reviewTable tbody');
    const tableEditBtn = document.querySelector('#tableEditBtn');
    const finalSubmitBtn = document.querySelector('#finalSubmitBtn');
    const cancelReviewBtn = document.querySelector('#cancelReviewBtn');

    function init() {
        if (!form) return;

        const phoneInputEl = document.querySelector('#phone');
        const altPhoneInputEl = document.querySelector('#altPhone');
        const passwordInput = document.querySelector('#password');
        const confirmPasswordInput = document.querySelector('#confirmPassword');

        // Phone Blur Logic
        if (phoneInputEl && altPhoneInputEl) {
            phoneInputEl.addEventListener('input', () => { duplicatePhoneAlerted = false; });
            altPhoneInputEl.addEventListener('input', () => { duplicatePhoneAlerted = false; });

            altPhoneInputEl.addEventListener('blur', () => {
                if (phoneInputEl.value && altPhoneInputEl.value && phoneInputEl.value === altPhoneInputEl.value) {
                    if (!duplicatePhoneAlerted) {
                        showToast("Both the primary and alternate phone numbers are the same.", "warning");
                        duplicatePhoneAlerted = true;
                    }
                }
            });
        }

        // Password Match Blur Logic
        if (passwordInput && confirmPasswordInput) {
            confirmPasswordInput.addEventListener('blur', () => {
                if (confirmPasswordInput.value && passwordInput.value !== confirmPasswordInput.value) {
                    showToast("Passwords do not match. Please verify and try again.", "error");
                    confirmPasswordInput.focus();
                }
            });
        }

        // Form Events
        form.addEventListener('submit', (e) => handleFormSubmit(e));
        form.addEventListener('reset', () => handleFormReset());

        // Review Actions
        if (tableEditBtn) tableEditBtn.addEventListener('click', () => handleTableInlineEdit());
        if (finalSubmitBtn) finalSubmitBtn.addEventListener('click', () => handleFinalSubmit());
        if (cancelReviewBtn) cancelReviewBtn.addEventListener('click', () => handleCancelReview());
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validatePasswordStrength(pwd) {
        return /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd) && pwd.length >= 8;
    }

    function handleFormSubmit(e) {
        e.preventDefault();

        const firstNameInput = document.querySelector('#firstName');
        const middleNameInput = document.querySelector('#middleName');
        const lastNameInput = document.querySelector('#lastName');
        const phoneInput = document.querySelector('#phone');
        const altPhoneInput = document.querySelector('#altPhone');
        const emailInput = document.querySelector('#email');
        const passwordInput = document.querySelector('#password');
        const confirmPasswordInput = document.querySelector('#confirmPassword');
        const pincodeInput = document.querySelector('#pincode');

        const nameRegex = /^[A-Za-z\s]{2,20}$/;
        if (firstNameInput && !nameRegex.test(firstNameInput.value.trim())) {
            showToast("First Name must be between 2 and 20 characters and contain only letters.", "error");
            firstNameInput.focus();
            return;
        }

        if (middleNameInput && middleNameInput.value.trim() && !/^[A-Za-z\s]{0,20}$/.test(middleNameInput.value.trim())) {
            showToast("Middle Name must contain only letters.", "error");
            middleNameInput.focus();
            return;
        }

        if (lastNameInput && !nameRegex.test(lastNameInput.value.trim())) {
            showToast("Last Name must be between 2 and 20 characters and contain only letters.", "error");
            lastNameInput.focus();
            return;
        }

        if (emailInput && !validateEmail(emailInput.value.trim())) {
            showToast("Please enter a valid email address (e.g., user@example.com).", "error");
            emailInput.focus();
            return;
        }

        if (passwordInput && !validatePasswordStrength(passwordInput.value)) {
            let errMsg = "Password must satisfy all of the following conditions:\n• At least 8 characters long\n• At least 1 capital letter\n• At least 1 number\n• At least 1 special character";
            showToast(errMsg, "error");
            passwordInput.focus();
            return;
        }

        if (passwordInput && confirmPasswordInput && passwordInput.value !== confirmPasswordInput.value) {
            showToast("Passwords do not match. Please verify and try again.", "error");
            confirmPasswordInput.focus();
            return;
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (phoneInput && !phoneRegex.test(phoneInput.value.trim())) {
            showToast("Phone Number must be exactly 10 digits.", "error");
            phoneInput.focus();
            return;
        }

        if (altPhoneInput && !phoneRegex.test(altPhoneInput.value.trim())) {
            showToast("Alternate Phone Number must be exactly 10 digits.", "error");
            altPhoneInput.focus();
            return;
        }

        if (phoneInput && altPhoneInput && phoneInput.value === altPhoneInput.value && !duplicatePhoneAlerted) {
            showToast("Both the primary and alternate phone numbers are the same.", "warning");
            duplicatePhoneAlerted = true;
        }

        const pincodeRegex = /^[0-9]{6}$/;
        if (pincodeInput && !pincodeRegex.test(pincodeInput.value.trim())) {
            showToast("Pin code must be exactly 6 digits.", "error");
            pincodeInput.focus();
            return;
        }

        // Collect Data
        const selectedGender = document.querySelector('input[name="gender"]:checked');
        const checkedHobbies = Array.from(document.querySelectorAll('input[name="hobbies"]:checked')).map(cb => cb.value);

        currentFormData = {
            profilePic: uploader.getPreview().src,
            profilePicName: uploader.getNameDisplay().textContent,
            firstName: document.querySelector('#firstName').value,
            middleName: document.querySelector('#middleName').value,
            lastName: document.querySelector('#lastName').value,
            gender: selectedGender ? selectedGender.value : '',
            email: emailInput.value,
            password: passwordInput.value,
            phone: phoneInput.value,
            altPhone: altPhoneInput.value,
            address: document.querySelector('#address').value,
            country: location.getDom().country.value === 'Other' ? location.getDom().customCountry.value : location.getDom().country.value,
            state: location.getDom().state.value === 'Other' ? location.getDom().customState.value : location.getDom().state.value,
            city: location.getDom().city.value === 'Other' ? location.getDom().customCity.value : location.getDom().city.value,
            pincode: document.querySelector('#pincode').value,
            hobbies: checkedHobbies
        };

        populateReviewTable();
    }

    function populateReviewTable() {
        if (!reviewTableBody || !reviewContainer) return;
        reviewTableBody.innerHTML = '';

        const fields = [
            { key: 'profilePic', label: 'Profile Picture', type: 'image' },
            { key: 'firstName', label: 'First Name', type: 'text' },
            { key: 'middleName', label: 'Middle Name', type: 'text' },
            { key: 'lastName', label: 'Last Name', type: 'text' },
            { key: 'gender', label: 'Gender', type: 'select' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'password', label: 'Password', type: 'password' },
            { key: 'phone', label: 'Phone Number', type: 'tel' },
            { key: 'altPhone', label: 'Alternate Phone Number', type: 'tel' },
            { key: 'address', label: 'Street Address', type: 'text' },
            { key: 'country', label: 'Country', type: 'select' },
            { key: 'state', label: 'State', type: 'text' },
            { key: 'city', label: 'City', type: 'text' },
            { key: 'pincode', label: 'Pin code', type: 'text' },
            { key: 'hobbies', label: 'Hobbies', type: 'text' }
        ];

        fields.forEach(field => {
            const tr = document.createElement('tr');
            tr.dataset.key = field.key;
            tr.dataset.type = field.type;

            const tdLabel = document.createElement('td');
            tdLabel.textContent = field.label;
            tr.appendChild(tdLabel);

            const tdValue = document.createElement('td');
            tdValue.className = 'field-value';

            if (field.type === 'image') {
                const img = document.createElement('img');
                img.src = currentFormData[field.key];
                img.className = 'review-table-pic';
                tdValue.appendChild(img);

                const nameSpan = document.createElement('div');
                nameSpan.className = 'review-table-filename';
                nameSpan.style.fontSize = '0.8rem';
                nameSpan.style.color = 'var(--text-secondary)';
                nameSpan.style.marginTop = '0.25rem';
                nameSpan.textContent = currentFormData.profilePicName || 'No file chosen';
                tdValue.appendChild(nameSpan);
            } else if (field.key === 'gender') {
                const val = currentFormData[field.key];
                tdValue.textContent = val ? val.charAt(0).toUpperCase() + val.slice(1) : '';
            } else if (field.key === 'hobbies') {
                const val = currentFormData[field.key] || [];
                tdValue.textContent = val.map(h => h.charAt(0).toUpperCase() + h.slice(1)).join(', ');
            } else {
                tdValue.textContent = currentFormData[field.key];
            }

            tr.appendChild(tdValue);
            reviewTableBody.appendChild(tr);
        });

        reviewContainer.style.display = 'block';
        reviewContainer.scrollIntoView({ behavior: 'smooth' });
    }

    function handleTableInlineEdit() {
        const rows = reviewTableBody.querySelectorAll('tr');

        if (!isTableEditing) {
            isTableEditing = true;
            tableEditBtn.textContent = 'Save Changes';
            tableEditBtn.classList.remove('btn-secondary');
            tableEditBtn.classList.add('btn-primary');

            rows.forEach(row => {
                const key = row.dataset.key;
                const type = row.dataset.type;
                const tdValue = row.querySelector('.field-value');

                if (type === 'image') {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/*';
                    fileInput.style.display = 'none';

                    const oldNameSpan = tdValue.querySelector('.review-table-filename');
                    if (oldNameSpan) oldNameSpan.remove();

                    const nameSpan = document.createElement('div');
                    nameSpan.className = 'review-table-filename-edit';
                    nameSpan.style.fontSize = '0.8rem';
                    nameSpan.style.color = 'var(--accent-color)';
                    nameSpan.style.marginTop = '0.25rem';
                    nameSpan.style.cursor = 'pointer';
                    nameSpan.style.textDecoration = 'underline';
                    nameSpan.textContent = currentFormData.profilePicName || 'Choose Image';

                    const img = tdValue.querySelector('img');
                    if (img) {
                        img.style.cursor = 'pointer';
                        img.title = 'Click to change image';
                        img.addEventListener('click', () => fileInput.click());
                    }
                    nameSpan.addEventListener('click', () => fileInput.click());

                    fileInput.addEventListener('change', (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            if (!file.type.startsWith('image/')) { showToast('Please select an image file.', 'error'); return; }
                            if (file.size > 2 * 1024 * 1024) { showToast('Image size must be less than 2MB.', 'error'); return; }
                            const reader = new FileReader();
                            reader.onload = (event) => { if (img) img.src = event.target.result; };
                            reader.readAsDataURL(file);
                            nameSpan.textContent = file.name;
                        }
                    });

                    tdValue.appendChild(fileInput);
                    tdValue.appendChild(nameSpan);
                } else if (key === 'gender') {
                    const select = document.createElement('select');
                    [{ value: 'male', text: 'Male' }, { value: 'female', text: 'Female' }, { value: 'other', text: 'Other' }].forEach(opt => {
                        const option = document.createElement('option');
                        option.value = opt.value; option.textContent = opt.text;
                        if (opt.value === currentFormData[key]) option.selected = true;
                        select.appendChild(option);
                    });
                    tdValue.innerHTML = ''; tdValue.appendChild(select);
                } else if (key === 'country') {
                    const select = document.createElement('select');
                    ["India", "United States", "United Kingdom", "Canada", "Australia"].forEach(opt => {
                        const option = document.createElement('option');
                        option.value = opt; option.textContent = opt;
                        if (opt === currentFormData[key]) option.selected = true;
                        select.appendChild(option);
                    });
                    tdValue.innerHTML = ''; tdValue.appendChild(select);
                } else {
                    const input = document.createElement('input');
                    input.type = type;
                    input.value = key === 'hobbies' ? (currentFormData[key] || []).join(', ') : currentFormData[key];
                    input.required = (key !== 'middleName');
                    tdValue.innerHTML = ''; tdValue.appendChild(input);
                }
            });
        } else {
            const tempFormData = { ...currentFormData };
            let hasError = false;

            rows.forEach(row => {
                if (hasError) return;
                const key = row.dataset.key;
                const type = row.dataset.type;
                const tdValue = row.querySelector('.field-value');

                if (type === 'image') {
                    tempFormData[key] = tdValue.querySelector('img').src;
                    const fileInput = tdValue.querySelector('input[type="file"]');
                    if (fileInput && fileInput.files[0]) tempFormData.profilePicName = fileInput.files[0].name;
                } else if (key === 'gender' || key === 'country') {
                    tempFormData[key] = tdValue.querySelector('select').value;
                } else if (key === 'hobbies') {
                    const inputVal = tdValue.querySelector('input').value.trim();
                    tempFormData[key] = inputVal ? inputVal.split(',').map(s => s.trim().toLowerCase()) : [];
                } else {
                    const input = tdValue.querySelector('input');
                    if (key !== 'middleName' && !input.value.trim()) {
                        showToast(`${row.querySelector('td').textContent} is required.`, "error");
                        input.focus(); hasError = true; return;
                    }
                    tempFormData[key] = input.value.trim();
                }
            });

            if (hasError) return;

            const nameRegex = /^[A-Za-z\s]{2,20}$/;
            if (!nameRegex.test(tempFormData.firstName)) {
                showToast("First Name must be between 2 and 20 characters and contain only letters.", "error");
                const firstNameEl = reviewTableBody.querySelector('tr[data-key="firstName"] input');
                if (firstNameEl) firstNameEl.focus(); return;
            }

            if (tempFormData.middleName && !/^[A-Za-z\s]{0,20}$/.test(tempFormData.middleName)) {
                showToast("Middle Name must contain only letters.", "error");
                const middleNameEl = reviewTableBody.querySelector('tr[data-key="middleName"] input');
                if (middleNameEl) middleNameEl.focus(); return;
            }

            if (!nameRegex.test(tempFormData.lastName)) {
                showToast("Last Name must be between 2 and 20 characters and contain only letters.", "error");
                const lastNameEl = reviewTableBody.querySelector('tr[data-key="lastName"] input');
                if (lastNameEl) lastNameEl.focus(); return;
            }

            if (!validateEmail(tempFormData.email)) {
                showToast("Please enter a valid email address.", "error");
                const emailInputEl = reviewTableBody.querySelector('tr[data-key="email"] input');
                if (emailInputEl) emailInputEl.focus(); return;
            }

            if (!validatePasswordStrength(tempFormData.password)) {
                showToast("Password must satisfy all conditions:\n• Minimum 8 characters\n• At least 1 capital letter\n• At least 1 number\n• At least 1 special character", "error");
                const passwordInputEl = reviewTableBody.querySelector('tr[data-key="password"] input');
                if (passwordInputEl) passwordInputEl.focus(); return;
            }

            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(tempFormData.phone)) {
                showToast("Phone Number must be exactly 10 digits.", "error");
                const phoneEl = reviewTableBody.querySelector('tr[data-key="phone"] input');
                if (phoneEl) phoneEl.focus(); return;
            }

            if (!phoneRegex.test(tempFormData.altPhone)) {
                showToast("Alternate Phone Number must be exactly 10 digits.", "error");
                const altPhoneEl = reviewTableBody.querySelector('tr[data-key="altPhone"] input');
                if (altPhoneEl) altPhoneEl.focus(); return;
            }

            if (tempFormData.phone === tempFormData.altPhone) {
                showToast("Both the primary and alternate phone numbers are the same.", "warning");
            }

            const pincodeRegex = /^[0-9]{6}$/;
            if (!pincodeRegex.test(tempFormData.pincode)) {
                showToast("Pin code must be exactly 6 digits.", "error");
                const pincodeEl = reviewTableBody.querySelector('tr[data-key="pincode"] input');
                if (pincodeEl) pincodeEl.focus(); return;
            }

            // Sync back data
            currentFormData = tempFormData;

            document.querySelector('#firstName').value = currentFormData.firstName;
            document.querySelector('#middleName').value = currentFormData.middleName || '';
            document.querySelector('#lastName').value = currentFormData.lastName;
            document.querySelector('#phone').value = currentFormData.phone;
            document.querySelector('#altPhone').value = currentFormData.altPhone;
            document.querySelector('#email').value = currentFormData.email;
            document.querySelector('#password').value = currentFormData.password;
            document.querySelector('#confirmPassword').value = currentFormData.password;
            document.querySelector('#address').value = currentFormData.address;
            document.querySelector('#pincode').value = currentFormData.pincode;
            uploader.getPreview().src = currentFormData.profilePic;
            uploader.getNameDisplay().textContent = currentFormData.profilePicName;

            const genderRadio = document.querySelector(`input[name="gender"][value="${currentFormData.gender}"]`);
            if (genderRadio) genderRadio.checked = true;

            document.querySelectorAll('input[name="hobbies"]').forEach(cb => {
                cb.checked = currentFormData.hobbies.includes(cb.value);
            });

            // Sync Dropdowns
            const countryList = ["India", "United States", "United Kingdom", "Canada", "Australia"];
            if (countryList.includes(currentFormData.country)) {
                location.getDom().country.value = currentFormData.country;
                location.toggleCustom('country', false);
                location.updateStateDropdown();

                if (location.getCountryStateMap()[currentFormData.country]?.includes(currentFormData.state)) {
                    location.getDom().state.value = currentFormData.state;
                    location.toggleCustom('state', false);
                    location.updateCityDropdown();

                    if (location.getStateCityMap()[currentFormData.state]?.includes(currentFormData.city)) {
                        location.getDom().city.value = currentFormData.city;
                        location.toggleCustom('city', false);
                    } else {
                        location.toggleCustom('city', true);
                        location.getDom().customCity.value = currentFormData.city;
                    }
                } else {
                    location.toggleCustom('state', true);
                    location.getDom().customState.value = currentFormData.state;
                    location.toggleCustom('city', true);
                    location.getDom().customCity.value = currentFormData.city;
                }
            } else {
                location.toggleCustom('country', true); location.getDom().customCountry.value = currentFormData.country;
                location.toggleCustom('state', true); location.getDom().customState.value = currentFormData.state;
                location.toggleCustom('city', true); location.getDom().customCity.value = currentFormData.city;
            }

            // Reset Table State
            isTableEditing = false;
            tableEditBtn.textContent = 'Edit';
            tableEditBtn.classList.remove('btn-primary');
            tableEditBtn.classList.add('btn-secondary');

            // Render values back as plain text
            populateReviewTable();
        }
    }

    function handleFinalSubmit() {
        if (isTableEditing) {
            showToast("Please save your changes in the table first.", "warning");
            return;
        }

        const storageKey = `userData_${currentFormData.firstName}_${currentFormData.lastName}`;
        try {
            localStorage.setItem(storageKey, JSON.stringify(currentFormData));
            showToast("Data saved successfully to Local Storage!", "success");
        } catch (err) {
            showToast("Data saved successfully (but Local Storage was full or unavailable)!", "warning");
        }

        if (form) form.reset();
    }

    function handleCancelReview() {
        reviewContainer.style.display = 'none';
        reviewTableBody.innerHTML = '';
        currentFormData = {};
        isTableEditing = false;
        if (tableEditBtn) {
            tableEditBtn.textContent = 'Edit';
            tableEditBtn.classList.remove('btn-primary');
            tableEditBtn.classList.add('btn-secondary');
        }
        document.querySelector('.container').scrollIntoView({ behavior: 'smooth' });
    }

    function handleFormReset() {
        duplicatePhoneAlerted = false;
        uploader.reset();
        location.resetAll();
        
        if (reviewContainer) reviewContainer.style.display = 'none';
        if (reviewTableBody) reviewTableBody.innerHTML = '';
        
        currentFormData = {};
        isTableEditing = false;

        if (tableEditBtn) {
            tableEditBtn.textContent = 'Edit';
            tableEditBtn.classList.remove('btn-primary');
            tableEditBtn.classList.add('btn-secondary');
        }
    }

    init();

    return {
        handleFormReset: handleFormReset
    };
}