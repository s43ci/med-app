document.addEventListener('DOMContentLoaded', () => {
    // ===== عناصر DOM عامة =====
    const toggleThemeBtn = document.getElementById('toggleTheme');
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.content-section');

    // ===== قسم العلاجات =====
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
    const categoriesList = document.querySelector('.categories-list');
    const medicinesList = document.getElementById('medicinesList');

    const medicinesWelcome = document.getElementById('medicinesWelcome');
    const medicinesContent = document.getElementById('medicinesContent');

    const medicinesSearch = document.getElementById('medicinesSearch');

    const currentCategoryTitle = document.getElementById('currentCategoryTitle');
    const currentGroupTitle = document.getElementById('currentGroupTitle');

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

    const diseasesCategoriesList = document.querySelector('.disease-categories-list');
    const diseasesList = document.getElementById('diseasesList');

    const diseasesWelcome = document.getElementById('diseasesWelcome');
    const diseasesContent = document.getElementById('diseasesContent');

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
        diseaseCategories: [],
        settings: { theme: 'light' }
    };

    let currentSection = 'medicines';
    let currentGroupId = null;
    let currentCategoryId = null;
    let currentDiseaseCategoryId = null;

    // ===== التخزين =====
    function saveData() { localStorage.setItem('medicalAppData', JSON.stringify(appData)); }

    // ===== السمات =====
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        appData.settings.theme = theme;
        toggleThemeBtn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        saveData();
    }

    toggleThemeBtn.addEventListener('click', () => {
        applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });

    // ===== التنقل =====
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentSection = btn.dataset.section;
            sections.forEach(s => s.classList.toggle('active', s.id === currentSection + 'Section'));
            navBtns.forEach(b => b.classList.toggle('active', b.dataset.section === currentSection));
        });
    });

    // ===== النوافذ المنبثقة =====
    closeButtons.forEach(btn => btn.addEventListener('click', () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none')));
    function openModal(modal) { modal.style.display = 'block'; }
    function closeModal(modal) { modal.style.display = 'none'; }

    addGroupBtn.addEventListener('click', () => openModal(groupModal));
    addCategoryBtn.addEventListener('click', () => { populateGroupSelect(); openModal(categoryModal); });
    addMedicineBtn.addEventListener('click', () => {
        if (!currentGroupId || !currentCategoryId) { alert("اختر مجموعة وقسم أولاً!"); return; }
        openModal(medicineModal);
    });

    addDiseaseCategoryBtn.addEventListener('click', () => openModal(diseaseCategoryModal));
    addDiseaseBtn.addEventListener('click', () => {
        if (!currentDiseaseCategoryId) { alert("اختر قسم المرض أولاً!"); return; }
        openModal(diseaseModal);
    });

    // ===== إدارة المجموعات والأقسام =====
    function renderGroups() {
        groupsList.innerHTML = '';
        appData.groups.forEach(group => {
            const li = document.createElement('li');
            li.textContent = group.name;
            li.addEventListener('click', () => {
                currentGroupId = group.id;
                currentCategoryId = null;
                renderCategories(group.id);
                currentGroupTitle.textContent = group.name;
            });
            groupsList.appendChild(li);
        });
    }

    function renderCategories(groupId) {
        const group = appData.groups.find(g => g.id === groupId);
        categoriesList.innerHTML = '';
        group.categories.forEach(cat => {
            const li = document.createElement('li');
            li.textContent = cat.name;
            li.addEventListener('click', () => {
                currentCategoryId = cat.id;
                currentCategoryTitle.textContent = cat.name;
                renderMedicines(cat.medicines);
            });
            categoriesList.appendChild(li);
        });
    }

    function renderMedicines(medicines) {
        medicinesList.innerHTML = '';
        if (!medicines || medicines.length === 0) {
            medicinesWelcome.style.display = 'block';
            medicinesContent.style.display = 'none';
            return;
        }
        medicinesWelcome.style.display = 'none';
        medicinesContent.style.display = 'block';
        medicines.forEach(med => {
            const div = document.createElement('div');
            div.classList.add('medicine-item');
            div.innerHTML = `<h4>${med.name}</h4><p>الجرعة: ${med.dose}</p>${med.image ? `<img src="${med.image}" style="max-width:50px;">` : ''}`;
            medicinesList.appendChild(div);
        });
    }

    function populateGroupSelect() {
        const select = categoryForm.querySelector('select[name="group"]');
        select.innerHTML = '';
        appData.groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            select.appendChild(option);
        });
    }

    // ===== الفورمات =====
    groupForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = groupForm.name.value.trim();
        if (!name) return;
        const id = Date.now().toString();
        appData.groups.push({ id, name, categories: [] });
        saveData();
        renderGroups();
        groupForm.reset();
        closeModal(groupModal);
    });

    categoryForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = categoryForm.name.value.trim();
        const groupId = categoryForm.group.value;
        if (!name || !groupId) return;
        const group = appData.groups.find(g => g.id === groupId);
        const id = Date.now().toString();
        group.categories.push({ id, name, medicines: [] });
        saveData();
        renderCategories(groupId);
        categoryForm.reset();
        closeModal(categoryModal);
    });

    medicineForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = medicineForm.name.value.trim();
        const dose = medicineForm.dose.value.trim();
        if (!name || !dose) return;
        const group = appData.groups.find(g => g.id === currentGroupId);
        const category = group.categories.find(c => c.id === currentCategoryId);
        const id = Date.now().toString();
        let image = '';
        if (medicineImageInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = () => {
                image = reader.result;
                category.medicines.push({ id, name, dose, image });
                saveData();
                renderMedicines(category.medicines);
                medicineForm.reset();
                imagePreview.src = '';
                fileNameSpan.textContent = '';
                closeModal(medicineModal);
            };
            reader.readAsDataURL(medicineImageInput.files[0]);
        } else {
            category.medicines.push({ id, name, dose, image });
            saveData();
            renderMedicines(category.medicines);
            medicineForm.reset();
            closeModal(medicineModal);
        }
    });

    medicineImageInput.addEventListener('change', () => {
        if (medicineImageInput.files.length > 0) {
            const file = medicineImageInput.files[0];
            fileNameSpan.textContent = file.name;
            const reader = new FileReader();
            reader.onload = () => { imagePreview.src = reader.result; };
            reader.readAsDataURL(file);
        } else { fileNameSpan.textContent = ''; imagePreview.src = ''; }
    });

    // ===== البحث =====
    medicinesSearch.addEventListener('input', () => {
        const query = medicinesSearch.value.toLowerCase();
        const group = appData.groups.find(g => g.id === currentGroupId);
        if (!group) return;
        const category = group.categories.find(c => c.id === currentCategoryId);
        if (!category) return;
        const filtered = category.medicines.filter(m => m.name.toLowerCase().includes(query));
        renderMedicines(filtered);
    });

    // ===== أمراض =====
    function renderDiseaseCategories() {
        diseasesCategoriesList.innerHTML = '';
        appData.diseaseCategories.forEach(cat => {
            const li = document.createElement('li');
            li.textContent = cat.name;
            li.addEventListener('click', () => {
                currentDiseaseCategoryId = cat.id;
                currentDiseaseCategoryTitle.textContent = cat.name;
                renderDiseases(cat.diseases);
            });
            diseasesCategoriesList.appendChild(li);
        });
    }

    function renderDiseases(diseases) {
        diseasesList.innerHTML = '';
        if (!diseases || diseases.length === 0) {
            diseasesWelcome.style.display = 'block';
            diseasesContent.style.display = 'none';
            return;
        }
        diseasesWelcome.style.display = 'none';
        diseasesContent.style.display = 'block';
        diseases.forEach(d => {
            const div = document.createElement('div');
            div.classList.add('disease-item');
            div.innerHTML = `<h4>${d.name}</h4>${d.image ? `<img src="${d.image}" style="max-width:50px;">` : ''}`;
            diseasesList.appendChild(div);
        });
    }

    diseaseCategoryForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = diseaseCategoryForm.name.value.trim();
        if (!name) return;
        const id = Date.now().toString();
        appData.diseaseCategories.push({ id, name, diseases: [] });
        saveData();
        renderDiseaseCategories();
        diseaseCategoryForm.reset();
        closeModal(diseaseCategoryModal);
    });

    diseaseForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = diseaseForm.name.value.trim();
        if (!name || !currentDiseaseCategoryId) return;
        const category = appData.diseaseCategories.find(c => c.id === currentDiseaseCategoryId);
        const id = Date.now().toString();
        let image = '';
        if (diseaseImageInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = () => {
                image = reader.result;
                category.diseases.push({ id, name, image });
                saveData();
                renderDiseases(category.diseases);
                diseaseForm.reset();
                diseaseImagePreview.src = '';
                diseaseFileNameSpan.textContent = '';
                closeModal(diseaseModal);
            };
            reader.readAsDataURL(diseaseImageInput.files[0]);
        } else {
            category.diseases.push({ id, name, image });
            saveData();
            renderDiseases(category.diseases);
            diseaseForm.reset();
            closeModal(diseaseModal);
        }
    });

    diseaseImageInput.addEventListener('change', () => {
        if (diseaseImageInput.files.length > 0) {
            const file = diseaseImageInput.files[0];
            diseaseFileNameSpan.textContent = file.name;
            const reader = new FileReader();
            reader.onload = () => { diseaseImagePreview.src = reader.result; };
            reader.readAsDataURL(file);
        } else { diseaseFileNameSpan.textContent = ''; diseaseImagePreview.src = ''; }
    });

    diseasesSearch.addEventListener('input', () => {
        const query = diseasesSearch.value.toLowerCase();
        const category = appData.diseaseCategories.find(c => c.id === currentDiseaseCategoryId);
        if (!category) return;
        const filtered = category.diseases.filter(d => d.name.toLowerCase().includes(query));
        renderDiseases(filtered);
    });

    // ===== تهيئة التطبيق =====
    applyTheme(appData.settings.theme);
    renderGroups();
    renderDiseaseCategories();
});
