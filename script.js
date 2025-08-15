document.addEventListener('DOMContentLoaded', () => {
    // ===== عناصر DOM عامة =====
    const toggleThemeBtn = document.getElementById('toggleTheme');
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.content-section');

    // ===== قسم المجموعات والأقسام والأدوية =====
    const addGroupBtn = document.getElementById('addGroupBtn');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const addMedicineBtn = document.getElementById('addMedicineBtn');

    const groupModal = document.getElementById('groupModal');
    const categoryModal = document.getElementById('categoryModal');
    const medicineModal = document.getElementById('medicineModal');

    const groupForm = document.getElementById('groupForm');
    const categoryForm = document.getElementById('categoryForm');
    const medicineForm = document.getElementById('medicineForm');

    const groupsList = document.querySelector('.groups-list');
    const categoriesSelect = document.getElementById('categoryGroupSelect');
    const medicinesList = document.getElementById('medicinesList');

    const medicinesSearch = document.getElementById('medicinesSearch');
    const currentCategoryTitle = document.getElementById('currentCategoryTitle');

    const medicineImageInput = document.getElementById('medicineImage');
    const imagePreview = document.getElementById('imagePreview');
    const fileNameSpan = document.getElementById('fileName');

    // ===== قسم الأمراض =====
    const addDiseaseCategoryBtn = document.getElementById('addDiseaseCategoryBtn');
    const addDiseaseBtn = document.getElementById('addDiseaseBtn');

    const diseaseCategoryModal = document.getElementById('diseaseCategoryModal');
    const diseaseModal = document.getElementById('diseaseModal');

    const diseaseCategoryForm = document.getElementById('diseaseCategoryForm');
    const diseaseForm = document.getElementById('diseaseForm');

    const diseasesCategoriesList = document.querySelector('.categories-list');
    const diseasesList = document.getElementById('diseasesList');

    const diseasesSearch = document.getElementById('diseasesSearch');
    const currentDiseaseCategoryTitle = document.getElementById('currentDiseaseCategoryTitle');

    const diseaseImageInput = document.getElementById('diseaseImage');
    const diseaseImagePreview = document.getElementById('diseaseImagePreview');
    const diseaseFileNameSpan = document.getElementById('diseaseFileName');

    // أزرار إغلاق النوافذ
    const closeButtons = document.querySelectorAll('.close-btn');

    // بيانات التطبيق
    let appData = JSON.parse(localStorage.getItem('medicalAppData')) || {
        groups: [],
        diseasesCategories: [],
        settings: { theme: 'light' }
    };

    let currentSection = 'medicines';
    let currentGroupId = null;
    let currentCategoryId = null;
    let currentDiseaseCategoryId = null;
    let isEditing = false;
    let currentEditingId = null;

    // ===== التخزين =====
    function saveData() {
        localStorage.setItem('medicalAppData', JSON.stringify(appData));
    }

    // ===== الثيم =====
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        appData.settings.theme = theme;
        toggleThemeBtn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        saveData();
    }
    applyTheme(appData.settings.theme);

    toggleThemeBtn.addEventListener('click', () => {
        applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });

    // ===== التنقل بين الأقسام =====
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            currentSection = section;
            sections.forEach(s => s.classList.toggle('active', s.id === section + 'Section'));
            navBtns.forEach(b => b.classList.toggle('active', b.dataset.section === section));
        });
    });

    // ===== إدارة المودالات =====
    function openModal(modal) {
        modal.style.display = 'flex';
    }
    function closeModal(modal) {
        modal.style.display = 'none';
        resetForms();
    }
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(btn.closest('.modal'));
        });
    });

    function resetForms() {
        groupForm.reset();
        categoryForm.reset();
        medicineForm.reset();
        diseaseCategoryForm.reset();
        diseaseForm.reset();
        imagePreview.src = '';
        fileNameSpan.textContent = '';
        diseaseImagePreview.src = '';
        diseaseFileNameSpan.textContent = '';
        isEditing = false;
        currentEditingId = null;
    }

    // ===== CRUD المجموعات =====
    function renderGroups() {
        groupsList.innerHTML = '';
        appData.groups.forEach(group => {
            const li = document.createElement('li');
            li.textContent = group.name;
            li.dataset.id = group.id;
            li.addEventListener('click', () => {
                currentGroupId = group.id;
                renderCategories();
            });
            groupsList.appendChild(li);
        });
        populateCategorySelect();
    }

    function populateCategorySelect() {
        categoriesSelect.innerHTML = '';
        appData.groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            categoriesSelect.appendChild(option);
        });
    }

    addGroupBtn.addEventListener('click', () => openModal(groupModal));

    groupForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = groupForm.groupName.value.trim();
        if (!name) return;

        if (isEditing) {
            const group = appData.groups.find(g => g.id === currentEditingId);
            group.name = name;
        } else {
            const newGroup = { id: Date.now(), name, categories: [] };
            appData.groups.push(newGroup);
        }
        saveData();
        renderGroups();
        closeModal(groupModal);
    });

    // ===== CRUD الأقسام =====
    addCategoryBtn.addEventListener('click', () => {
        if (appData.groups.length === 0) {
            alert('أضف مجموعة أولاً');
            return;
        }
        openModal(categoryModal);
    });

    categoryForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = categoryForm.categoryName.value.trim();
        const groupId = parseInt(categoryForm.categoryGroup.value);
        if (!name) return;

        const group = appData.groups.find(g => g.id === groupId);
        if (!group) return;

        if (isEditing) {
            const category = group.categories.find(c => c.id === currentEditingId);
            category.name = name;
        } else {
            const newCategory = { id: Date.now(), name, medicines: [] };
            group.categories.push(newCategory);
        }
        saveData();
        renderCategories();
        closeModal(categoryModal);
    });

    function renderCategories() {
        const group = appData.groups.find(g => g.id === currentGroupId);
        if (!group) return;
        categoriesSelect.innerHTML = '';
        group.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoriesSelect.appendChild(option);
        });
        currentCategoryTitle.textContent = group.name;
    }

    // ===== CRUD الأدوية =====
    addMedicineBtn.addEventListener('click', () => {
        if (!currentGroupId) {
            alert('اختر مجموعة أولاً');
            return;
        }
        openModal(medicineModal);
    });

    medicineForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = medicineForm.medicineName.value.trim();
        const categoryId = parseInt(medicineForm.categorySelect.value);
        if (!name || !categoryId) return;

        const group = appData.groups.find(g => g.id === currentGroupId);
        if (!group) return;
        const category = group.categories.find(c => c.id === categoryId);
        if (!category) return;

        const imageFile = medicineImageInput.files[0];
        const imageUrl = imageFile ? URL.createObjectURL(imageFile) : '';

        if (isEditing) {
            const medicine = category.medicines.find(m => m.id === currentEditingId);
            medicine.name = name;
            if (imageUrl) medicine.image = imageUrl;
        } else {
            const newMedicine = { id: Date.now(), name, image: imageUrl };
            category.medicines.push(newMedicine);
        }
        saveData();
        renderMedicines();
        closeModal(medicineModal);
    });

    function renderMedicines() {
        medicinesList.innerHTML = '';
        if (!currentGroupId) return;
        const group = appData.groups.find(g => g.id === currentGroupId);
        group.categories.forEach(category => {
            category.medicines.forEach(med => {
                const li = document.createElement('li');
                li.className = 'list-item';
                li.innerHTML = `
                    <span>${med.name}</span>
                    ${med.image ? `<img src="${med.image}" width="40">` : ''}
                `;
                medicinesList.appendChild(li);
            });
        });
    }

    // ===== الصور =====
    medicineImageInput.addEventListener('change', () => {
        const file = medicineImageInput.files[0];
        if (file) {
            fileNameSpan.textContent = file.name;
            imagePreview.src = URL.createObjectURL(file);
        }
    });

    diseaseImageInput.addEventListener('change', () => {
        const file = diseaseImageInput.files[0];
        if (file) {
            diseaseFileNameSpan.textContent = file.name;
            diseaseImagePreview.src = URL.createObjectURL(file);
        }
    });

    // ===== البحث =====
    medicinesSearch.addEventListener('input', () => {
        const query = medicinesSearch.value.toLowerCase();
        document.querySelectorAll('#medicinesList .list-item').forEach(item => {
            const text = item.querySelector('span').textContent.toLowerCase();
            item.style.display = text.includes(query) ? 'flex' : 'none';
        });
    });

    // ===== الأمراض وفئاتها (نسخة مبسطة) =====
    addDiseaseCategoryBtn.addEventListener('click', () => openModal(diseaseCategoryModal));
    addDiseaseBtn.addEventListener('click', () => openModal(diseaseModal));

    diseaseCategoryForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = diseaseCategoryForm.categoryName.value.trim();
        if (!name) return;
        appData.diseasesCategories.push({ id: Date.now(), name, diseases: [] });
        saveData();
        closeModal(diseaseCategoryModal);
    });

    diseaseForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = diseaseForm.diseaseName.value.trim();
        if (!name || !currentDiseaseCategoryId) return;
        const category = appData.diseasesCategories.find(c => c.id === currentDiseaseCategoryId);
        category.diseases.push({ id: Date.now(), name });
        saveData();
        closeModal(diseaseModal);
    });

    renderGroups();
});
