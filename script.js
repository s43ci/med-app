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

    const diseasesCategoriesList = document.querySelector('.categories-list');
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
        diseasesCategories: [],
        settings: { theme: 'light' }
    };

    let currentSection = 'medicines';
    let currentGroupId = null;
    let currentCategoryId = null;
    let currentDiseaseCategoryId = null;
    let isEditing = false;
    let currentEditingId = null;

    // ======== التخزين ========
    function saveData() {
        localStorage.setItem('medicalAppData', JSON.stringify(appData));
    }

    // ======== السمات ========
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        appData.settings.theme = theme;
        toggleThemeBtn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        saveData();
    }

    toggleThemeBtn.addEventListener('click', () => {
        applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });

    // ======== التنقل بين الأقسام ========
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            currentSection = section;
            sections.forEach(s => s.classList.toggle('active', s.id === section + 'Section'));
            navBtns.forEach(b => b.classList.toggle('active', b.dataset.section === section));
        });
    });

    // ======== النوافذ المنبثقة ========
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
            groupForm.reset(); categoryForm.reset(); medicineForm.reset();
            diseaseCategoryForm.reset(); diseaseForm.reset();
            imagePreview.innerHTML = ''; fileNameSpan.textContent = '';
            diseaseImagePreview.innerHTML = ''; diseaseFileNameSpan.textContent = '';
        });
    });

    window.addEventListener('click', e => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // ======== رفع الصور ========
    medicineImageInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
            fileNameSpan.textContent = file.name;
            const reader = new FileReader();
            reader.onload = () => { imagePreview.innerHTML = `<img src="${reader.result}" />`; };
            reader.readAsDataURL(file);
        } else { imagePreview.innerHTML = ''; fileNameSpan.textContent = ''; }
    });

    diseaseImageInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
            diseaseFileNameSpan.textContent = file.name;
            const reader = new FileReader();
            reader.onload = () => { diseaseImagePreview.innerHTML = `<img src="${reader.result}" />`; };
            reader.readAsDataURL(file);
        } else { diseaseImagePreview.innerHTML = ''; diseaseFileNameSpan.textContent = ''; }
    });

    // ======== المجموعات والأقسام ========
    function renderGroups() {
        groupsList.innerHTML = '';
        if (!appData.groups.length) { groupsList.innerHTML = `<p class="empty-state">لا توجد مجموعات</p>`; return; }
        appData.groups.forEach(group => {
            const div = document.createElement('div');
            div.className = 'group-item';
            div.dataset.id = group.id;
            div.textContent = group.name;
            div.addEventListener('click', () => {
                currentGroupId = group.id;
                currentCategoryId = group.categories[0]?.id || null;
                showMedicinesContent(currentGroupId, currentCategoryId);
            });
            groupsList.appendChild(div);
        });
    }

    function renderCategories(groupId) {
        const group = appData.groups.find(g => g.id === groupId);
        if (!group) return;
        const container = document.createElement('div');
        container.className = 'categories-container';
        if (!group.categories.length) container.innerHTML = `<p class="empty-state">لا توجد أقسام</p>`;
        else group.categories.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'category-item';
            div.dataset.id = cat.id;
            div.textContent = cat.name;
            div.addEventListener('click', () => {
                currentCategoryId = cat.id;
                showMedicinesContent(groupId, cat.id);
            });
            container.appendChild(div);
        });
        const old = document.querySelector('.categories-container'); if (old) old.remove();
        groupsList.appendChild(container);
    }

    function renderMedicines(groupId, categoryId) {
        medicinesList.innerHTML = '';
        const group = appData.groups.find(g => g.id === groupId); if (!group) return;
        const category = group.categories.find(c => c.id === categoryId); if (!category) return;
        category.medicines?.forEach(med => {
            const div = document.createElement('div');
            div.className = 'medicine-card';
            div.innerHTML = `
                <h3>${med.tradeName}</h3>
                <p>${med.scientificName}</p>
                <p>${med.specs || ''}</p>
                ${med.image ? `<img src="${med.image}" />` : ''}
            `;
            medicinesList.appendChild(div);
        });
    }

    function showMedicinesContent(groupId, categoryId) {
        medicinesWelcome.style.display = 'none';
        medicinesContent.style.display = 'block';
        const group = appData.groups.find(g => g.id === groupId);
        const category = group?.categories.find(c => c.id === categoryId);
        currentGroupTitle.textContent = group ? `مجموعة: ${group.name}` : '';
        currentCategoryTitle.textContent = category ? category.name : '';
        renderGroups(); renderCategories(groupId); renderMedicines(groupId, categoryId);
    }

    // ======== إضافة مجموعة ========
    addGroupBtn.addEventListener('click', () => { isEditing = false; currentEditingId = null; groupModal.style.display = 'flex'; });
    groupForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('groupName').value.trim();
        if (!name) return;
        const newGroup = { id: Date.now().toString(), name, categories: [] };
        appData.groups.push(newGroup);
        saveData(); renderGroups(); groupForm.reset(); groupModal.style.display = 'none';
    });

    // ======== إضافة قسم ========
    addCategoryBtn.addEventListener('click', () => {
        if (!currentGroupId) return alert('اختر مجموعة أولاً');
        categoryModal.style.display = 'flex';
    });
    categoryForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('categoryName').value.trim();
        const group = appData.groups.find(g => g.id === currentGroupId); if (!group) return;
        const newCat = { id: Date.now().toString(), name, medicines: [] };
        group.categories.push(newCat);
        saveData(); renderCategories(currentGroupId); categoryForm.reset(); categoryModal.style.display = 'none';
    });

    // ======== إضافة علاج ========
    addMedicineBtn.addEventListener('click', () => {
        if (!currentCategoryId) return alert('اختر قسم أولاً');
        medicineModal.style.display = 'flex';
    });

    medicineForm.addEventListener('submit', e => {
        e.preventDefault();
        const tradeName = document.getElementById('medicineTradeName').value.trim();
        const scientificName = document.getElementById('medicineScientificName').value.trim();
        const specs = document.getElementById('medicineSpecs').value.trim();
        const contraindications = document.getElementById('medicineContraindications').value.trim();
        const dosage = document.getElementById('medicineDosage').value.trim();
        const form = document.getElementById('medicineForm').medicineForm.value;
        const notes = document.getElementById('medicineNotes').value.trim();
        const image = imagePreview.querySelector('img')?.src || '';

        const group = appData.groups.find(g => g.id === currentGroupId);
        const category = group.categories.find(c => c.id === currentCategoryId);
        const newMed = { id: Date.now().toString(), tradeName, scientificName, specs, contraindications, dosage, form, notes, image };
        category.medicines.push(newMed);
        saveData(); renderMedicines(currentGroupId, currentCategoryId);
        medicineForm.reset(); imagePreview.innerHTML = ''; fileNameSpan.textContent = ''; medicineModal.style.display = 'none';
    });

    // ======== البحث ========
    medicinesSearch.addEventListener('input', e => {
        const term = e.target.value.trim().toLowerCase();
        const group = appData.groups.find(g => g.id === currentGroupId); if (!group) return;
        const category = group.categories.find(c => c.id === currentCategoryId); if (!category) return;
        medicinesList.innerHTML = '';
        category.medicines.filter(m => m.tradeName.toLowerCase().includes(term)).forEach(med => {
            const div = document.createElement('div');
            div.className = 'medicine-card';
            div.innerHTML = `<h3>${med.tradeName}</h3><p>${med.scientificName}</p>${med.image ? `<img src="${med.image}" />` : ''}`;
            medicinesList.appendChild(div);
        });
    });

    // ======== الأمراض ========
    function renderDiseaseCategories() {
        diseasesCategoriesList.innerHTML = '';
        if (!appData.diseasesCategories.length) { diseasesCategoriesList.innerHTML = `<p class="empty-state">لا توجد أقسام</p>`; return; }
        appData.diseasesCategories.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'category-item';
            div.dataset.id = cat.id;
            div.textContent = cat.name;
            div.addEventListener('click', () => {
                currentDiseaseCategoryId = cat.id;
                showDiseasesContent(cat.id);
            });
            diseasesCategoriesList.appendChild(div);
        });
    }

    function renderDiseases(categoryId) {
        diseasesList.innerHTML = '';
        const cat = appData.diseasesCategories.find(c => c.id === categoryId); if (!cat) return;
        cat.diseases?.forEach(dis => {
            const div = document.createElement('div');
            div.className = 'disease-card';
            div.innerHTML = `<h3>${dis.name}</h3><p>${dis.scientificName || ''}</p>${dis.image ? `<img src="${dis.image}" />` : ''}`;
            diseasesList.appendChild(div);
        });
    }

    function showDiseasesContent(categoryId) {
        diseasesWelcome.style.display = 'none';
        diseasesContent.style.display = 'block';
        const cat = appData.diseasesCategories.find(c => c.id === categoryId);
        currentDiseaseCategoryTitle.textContent = cat ? cat.name : '';
        renderDiseaseCategories();
        renderDiseases(categoryId);
    }

    // ======== إضافة قسم مرض ========
    addDiseaseCategoryBtn.addEventListener('click', () => diseaseCategoryModal.style.display = 'flex');
    diseaseCategoryForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('diseaseCategoryName').value.trim();
        if (!name) return;
        const newCat = { id: Date.now().toString(), name, diseases: [] };
        appData.diseasesCategories.push(newCat);
        saveData(); renderDiseaseCategories(); diseaseCategoryForm.reset(); diseaseCategoryModal.style.display = 'none';
    });

    // ======== إضافة مرض ========
    addDiseaseBtn.addEventListener('click', () => {
        if (!currentDiseaseCategoryId) return alert('اختر قسم أولاً');
        diseaseModal.style.display = 'flex';
    });

    diseaseForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('diseaseName').value.trim();
        const scientificName = document.getElementById('diseaseScientificName').value.trim();
        const description = document.getElementById('diseaseDescription').value.trim();
        const symptoms = document.getElementById('diseaseSymptoms').value.trim();
        const diagnosis = document.getElementById('diseaseDiagnosis').value.trim();
        const treatment = document.getElementById('diseaseTreatment').value.trim();
        const prevention = document.getElementById('diseasePrevention').value.trim();
        const image = diseaseImagePreview.querySelector('img')?.src || '';

        const cat = appData.diseasesCategories.find(c => c.id === currentDiseaseCategoryId);
        const newDis = { id: Date.now().toString(), name, scientificName, description, symptoms, diagnosis, treatment, prevention, image };
        cat.diseases.push(newDis);
        saveData(); renderDiseases(currentDiseaseCategoryId);
        diseaseForm.reset(); diseaseImagePreview.innerHTML = ''; diseaseFileNameSpan.textContent = ''; diseaseModal.style.display = 'none';
    });

    // ======== البحث بالأمراض ========
    diseasesSearch.addEventListener('input', e => {
        const term = e.target.value.trim().toLowerCase();
        const cat = appData.diseasesCategories.find(c => c.id === currentDiseaseCategoryId);
        if (!cat) return;
        diseasesList.innerHTML = '';
        cat.diseases.filter(d => d.name.toLowerCase().includes(term)).forEach(dis => {
            const div = document.createElement('div');
            div.className = 'disease-card';
            div.innerHTML = `<h3>${dis.name}</h3><p>${dis.scientificName || ''}</p>${dis.image ? `<img src="${dis.image}" />` : ''}`;
            diseasesList.appendChild(div);
        });
    });

    // ======== تهيئة التطبيق ========
    applyTheme(appData.settings.theme);
    renderGroups(); if (appData.groups.length) { currentGroupId = appData.groups[0].id; renderCategories(currentGroupId); }
    renderDiseaseCategories(); if (appData.diseasesCategories.length) { currentDiseaseCategoryId = appData.diseasesCategories[0].id; }
});
