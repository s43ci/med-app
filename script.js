document.addEventListener('DOMContentLoaded', function() {
    // عناصر DOM
    const toggleThemeBtn = document.getElementById('toggleTheme');
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.content-section');
    
    // عناصر قسم العلاجات
    const addGroupBtn = document.getElementById('addGroupBtn');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const addMedicineBtn = document.getElementById('addMedicineBtn');
    const groupModal = document.getElementById('groupModal');
    const categoryModal = document.getElementById('categoryModal');
    const medicineModal = document.getElementById('medicineModal');
    
    // عناصر قسم الأمراض
    const addDiseaseCategoryBtn = document.getElementById('addDiseaseCategoryBtn');
    const addDiseaseBtn = document.getElementById('addDiseaseBtn');
    const diseaseCategoryModal = document.getElementById('diseaseCategoryModal');
    const diseaseModal = document.getElementById('diseaseModal');
    
    // قوائم العرض
    const groupsList = document.querySelector('.groups-list');
    const medicinesList = document.getElementById('medicinesList');
    const diseasesCategoriesList = document.querySelector('.categories-list');
    const diseasesList = document.getElementById('diseasesList');
    
    // شاشات الترحيب
    const medicinesWelcome = document.getElementById('medicinesWelcome');
    const medicinesContent = document.getElementById('medicinesContent');
    const diseasesWelcome = document.getElementById('diseasesWelcome');
    const diseasesContent = document.getElementById('diseasesContent');
    
    // حقول البحث
    const medicinesSearch = document.getElementById('medicinesSearch');
    const diseasesSearch = document.getElementById('diseasesSearch');
    
    // بيانات التطبيق
    let appData = JSON.parse(localStorage.getItem('medicalAppData')) || {
        groups: [],
        diseasesCategories: [],
        settings: {
            theme: 'light'
        }
    };

    // تهيئة هيكل البيانات
    appData.groups = appData.groups.map(group => ({
        ...group,
        categories: group.categories || []
    }));

    appData.diseasesCategories = appData.diseasesCategories.map(category => ({
        ...category,
        diseases: category.diseases || []
    }));
    
    let currentSection = 'medicines';
    let currentGroupId = null;
    let currentCategoryId = null;
    let currentDiseaseCategoryId = null;
    let isEditing = false;
    let currentEditingId = null;
    
    // تهيئة التطبيق
    initApp();
    
    // أحداث تغيير السمة
    toggleThemeBtn.addEventListener('click', toggleTheme);
    
    // أحداث التنقل بين الأقسام
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            switchSection(section);
        });
    });
    
    // أحداث قسم العلاجات
    addGroupBtn.addEventListener('click', () => openGroupModal());
    addCategoryBtn.addEventListener('click', () => openCategoryModal());
    addMedicineBtn.addEventListener('click', () => openMedicineModal());
    
    // أحداث قسم الأمراض
    addDiseaseCategoryBtn.addEventListener('click', () => openDiseaseCategoryModal());
    addDiseaseBtn.addEventListener('click', () => openDiseaseModal());
    
    // إغلاق النوافذ المنبثقة
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
            resetForms();
        });
    });
    
    // إغلاق النافذة المنبثقة عند النقر خارجها
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
            resetForms();
        }
    });
    
    // تقديم نماذج البيانات
    document.getElementById('groupForm').addEventListener('submit', handleGroupSubmit);
    document.getElementById('categoryForm').addEventListener('submit', handleCategorySubmit);
    document.getElementById('medicineForm').addEventListener('submit', handleMedicineSubmit);
    document.getElementById('diseaseCategoryForm').addEventListener('submit', handleDiseaseCategorySubmit);
    document.getElementById('diseaseForm').addEventListener('submit', handleDiseaseSubmit);
    
    // معاينة الصور
    document.getElementById('medicineImage').addEventListener('change', function(e) {
        handleImageUpload(e, 'imagePreview', 'fileName');
    });
    
    document.getElementById('diseaseImage').addEventListener('change', function(e) {
        handleImageUpload(e, 'diseaseImagePreview', 'diseaseFileName');
    });
    
    // البحث
    medicinesSearch.addEventListener('input', searchMedicines);
    diseasesSearch.addEventListener('input', searchDiseases);
    
    // وظائف التطبيق
    function initApp() {
        applyTheme(appData.settings.theme);
        switchSection(currentSection);
        renderGroups();
        renderDiseasesCategories();
        
        if (appData.groups.length > 0) {
            currentGroupId = appData.groups[0].id;
            renderCategories(currentGroupId);
            
            const group = appData.groups.find(g => g.id === currentGroupId);
            if (group && group.categories.length > 0) {
                currentCategoryId = group.categories[0].id;
                showMedicinesContent(currentGroupId, currentCategoryId);
            }
        }
        
        if (appData.diseasesCategories.length > 0) {
            currentDiseaseCategoryId = appData.diseasesCategories[0].id;
            showDiseasesContent(currentDiseaseCategoryId);
        }
    }
    
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        appData.settings.theme = theme;
        toggleThemeBtn.innerHTML = theme === 'dark' ? 
            '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        saveData();
    }
    
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    }
    
    function switchSection(section) {
        currentSection = section;
        navBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === section);
        });
        
        sections.forEach(sec => {
            sec.classList.toggle('active', sec.id === `${section}Section`);
        });
    }
    
    // ===== قسم العلاجات =====
    function renderGroups() {
        groupsList.innerHTML = '';
        
        if (appData.groups.length === 0) {
            groupsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-layer-group"></i>
                    <p>لا توجد مجموعات متاحة</p>
                </div>
            `;
            return;
        }
        
        appData.groups.forEach(group => {
            const groupElement = document.createElement('div');
            groupElement.className = `group-item ${currentGroupId === group.id ? 'active' : ''}`;
            groupElement.innerHTML = `
                <span>${group.name}</span>
                <div class="actions">
                    <button class="edit-group" data-id="${group.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-group" data-id="${group.id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            groupElement.addEventListener('click', () => {
                currentGroupId = group.id;
                renderCategories(group.id);
            });
            groupsList.appendChild(groupElement);
        });
        
        document.querySelectorAll('.edit-group').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                editGroup(e.target.closest('button').dataset.id);
            });
        });
        
        document.querySelectorAll('.delete-group').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteGroup(e.target.closest('button').dataset.id);
            });
        });
    }
    
    function renderCategories(groupId) {
        const group = appData.groups.find(g => g.id === groupId);
        if (!group) return;
        
        document.querySelectorAll('.group-item').forEach(item => {
            item.classList.toggle('active', item.querySelector('.edit-group').dataset.id === groupId);
        });
        
        const categoriesContainer = document.createElement('div');
        categoriesContainer.className = 'categories-container';
        
        if (group.categories.length === 0) {
            categoriesContainer.innerHTML = `
                <div class="empty-state small">
                    <i class="fas fa-folder-open"></i>
                    <p>لا توجد أقسام في هذه المجموعة</p>
                </div>
            `;
        } else {
            group.categories.forEach(category => {
                const categoryElement = document.createElement('div');
                categoryElement.className = `category-item ${currentCategoryId === category.id ? 'active' : ''}`;
                categoryElement.innerHTML = `
                    <span>${category.name}</span>
                    <div class="actions">
                        <button class="edit-category" data-id="${category.id}"><i class="fas fa-edit"></i></button>
                        <button class="delete-category" data-id="${category.id}"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                categoryElement.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('edit-category') && !e.target.classList.contains('delete-category')) {
                        currentCategoryId = category.id;
                        showMedicinesContent(groupId, category.id);
                    }
                });
                categoriesContainer.appendChild(categoryElement);
            });
        }
        
        const oldContainer = document.querySelector('.categories-container');
        if (oldContainer) oldContainer.remove();
        
        groupsList.appendChild(categoriesContainer);
    }
    
    function renderMedicines(groupId, categoryId) {
        medicinesList.innerHTML = '';
        const group = appData.groups.find(g => g.id === groupId);
        if (!group) return;
        
        const category = group.categories.find(cat => cat.id === categoryId);
        if (!category) return;
        
        if (!category.medicines || category.medicines.length === 0) {
            medicinesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-pills"></i>
                    <p>لا توجد علاجات في هذا القسم</p>
                </div>
            `;
            return;
        }
        
        category.medicines.forEach(medicine => {
            const medicineElement = document.createElement('div');
            medicineElement.className = 'medicine-card';
            medicineElement.innerHTML = `
                <div class="medicine-image">
                    ${medicine.image ? 
                        `<img src="${medicine.image}" alt="${medicine.tradeName}">` : 
                        `<div class="placeholder"><i class="fas fa-pills"></i></div>`}
                </div>
                <div class="medicine-body">
                    <div class="medicine-title">
                        <span>${medicine.tradeName}</span>
                        <div class="medicine-actions">
                            <button class="btn secondary edit-medicine" data-id="${medicine.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn danger delete-medicine" data-id="${medicine.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="medicine-scientific">${medicine.scientificName}</div>
                    ${medicine.specs ? `<div class="medicine-specs"><strong>المواصفات:</strong> ${medicine.specs}</div>` : ''}
                    ${medicine.contraindications ? `<div class="medicine-contraindications"><strong>الموانع:</strong> ${medicine.contraindications}</div>` : ''}
                    ${medicine.dosage ? `<div class="medicine-dosage">${medicine.dosage}</div>` : ''}
                    ${medicine.form ? `<div class="medicine-form">${medicine.form}</div>` : ''}
                    ${medicine.notes ? `<div class="medicine-notes"><strong>ملاحظة:</strong> ${medicine.notes}</div>` : ''}
                </div>
            `;
            medicinesList.appendChild(medicineElement);
        });
        
        document.querySelectorAll('.edit-medicine').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                editMedicine(groupId, categoryId, e.target.closest('button').dataset.id);
            });
        });
        
        document.querySelectorAll('.delete-medicine').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteMedicine(groupId, categoryId, e.target.closest('button').dataset.id);
            });
        });
    }
    
    function showMedicinesContent(groupId, categoryId) {
        const group = appData.groups.find(g => g.id === groupId);
        if (!group) {
            medicinesWelcome.style.display = 'flex';
            medicinesContent.style.display = 'none';
            return;
        }
        
        const category = group.categories.find(cat => cat.id === categoryId);
        if (!category) {
            medicinesWelcome.style.display = 'flex';
            medicinesContent.style.display = 'none';
            return;
        }
        
        currentGroupId = groupId;
        currentCategoryId = categoryId;
        
        medicinesWelcome.style.display = 'none';
        medicinesContent.style.display = 'block';
        currentCategoryTitle.textContent = category.name;
        currentGroupTitle.textContent = `مجموعة: ${group.name}`;
        
        renderGroups();
        renderMedicines(groupId, categoryId);
    }
    
    function openGroupModal(groupId = null) {
        isEditing = groupId !== null;
        currentEditingId = groupId;
        
        const modalTitle = document.getElementById('groupModalTitle');
        const groupNameInput = document.getElementById('groupName');
        
        if (isEditing) {
            modalTitle.textContent = 'تعديل المجموعة';
            const group = appData.groups.find(g => g.id === groupId);
            groupNameInput.value = group.name;
        } else {
            modalTitle.textContent = 'إضافة مجموعة جديدة';
            groupNameInput.value = '';
        }
        
        groupModal.style.display = 'flex';
    }
    
    function openCategoryModal(categoryId = null) {
        if (!currentGroupId) {
            alert('الرجاء اختيار مجموعة أولاً');
            return;
        }
        
        isEditing = categoryId !== null;
        currentEditingId = categoryId;
        
        const modalTitle = document.getElementById('categoryModalTitle');
        const categoryNameInput = document.getElementById('categoryName');
        const groupSelect = document.getElementById('categoryGroup');
        
        groupSelect.innerHTML = '';
        appData.groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            option.selected = group.id === currentGroupId;
            groupSelect.appendChild(option);
        });
        
        if (isEditing) {
            modalTitle.textContent = 'تعديل القسم';
            const group = appData.groups.find(g => g.id === currentGroupId);
            const category = group.categories.find(cat => cat.id === categoryId);
            categoryNameInput.value = category.name;
        } else {
            modalTitle.textContent = 'إضافة قسم جديد';
            categoryNameInput.value = '';
        }
        
        categoryModal.style.display = 'flex';
    }
    
    function openMedicineModal(medicineId = null) {
        if (!currentGroupId || !currentCategoryId) return;
        
        isEditing = medicineId !== null;
        currentEditingId = medicineId;
        
        const modalTitle = document.getElementById('medicineModalTitle');
        const group = appData.groups.find(g => g.id === currentGroupId);
        const category = group.categories.find(cat => cat.id === currentCategoryId);
        
        if (isEditing) {
            modalTitle.textContent = 'تعديل العلاج';
            const medicine = category.medicines.find(med => med.id === medicineId);
            
            document.getElementById('medicineId').value = medicine.id;
            document.getElementById('medicineTradeName').value = medicine.tradeName;
            document.getElementById('medicineScientificName').value = medicine.scientificName;
            document.getElementById('medicineSpecs').value = medicine.specs;
            document.getElementById('medicineContraindications').value = medicine.contraindications;
            document.getElementById('medicineDosage').value = medicine.dosage;
            document.getElementById('medicineForm').value = medicine.form || '';
            document.getElementById('medicineNotes').value = medicine.notes || '';
            
            const imagePreview = document.getElementById('imagePreview');
            imagePreview.innerHTML = '';
            if (medicine.image) {
                const img = document.createElement('img');
                img.src = medicine.image;
                imagePreview.appendChild(img);
            }
        } else {
            modalTitle.textContent = 'إضافة علاج جديد';
            document.getElementById('medicineForm').reset();
            document.getElementById('imagePreview').innerHTML = '';
            document.getElementById('fileName').textContent = '';
        }
        
        document.getElementById('medicineCategoryId').value = currentCategoryId;
        medicineModal.style.display = 'flex';
    }
    
    function editGroup(groupId) {
        openGroupModal(groupId);
    }
    
    function deleteGroup(groupId) {
        if (confirm('هل أنت متأكد من حذف هذه المجموعة؟ سيتم حذف جميع الأقسام والعلاجات الموجودة فيها.')) {
            appData.groups = appData.groups.filter(g => g.id !== groupId);
            saveData();
            renderGroups();
            
            if (currentGroupId === groupId) {
                currentGroupId = null;
                currentCategoryId = null;
                medicinesWelcome.style.display = 'flex';
                medicinesContent.style.display = 'none';
            }
        }
    }
    
    function editCategory(groupId, categoryId) {
        currentGroupId = groupId;
        openCategoryModal(categoryId);
    }
    
    function deleteCategory(groupId, categoryId) {
        if (confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع العلاجات الموجودة فيه.')) {
            const groupIndex = appData.groups.findIndex(g => g.id === groupId);
            if (groupIndex !== -1) {
                appData.groups[groupIndex].categories = appData.groups[groupIndex].categories.filter(cat => cat.id !== categoryId);
                saveData();
                renderCategories(groupId);
                
                if (currentCategoryId === categoryId) {
                    currentCategoryId = null;
                    medicinesWelcome.style.display = 'flex';
                    medicinesContent.style.display = 'none';
                }
            }
        }
    }
    
    function editMedicine(groupId, categoryId, medicineId) {
        currentGroupId = groupId;
        currentCategoryId = categoryId;
        openMedicineModal(medicineId);
    }
    
    function deleteMedicine(groupId, categoryId, medicineId) {
        if (confirm('هل أنت متأكد من حذف هذا العلاج؟')) {
            const groupIndex = appData.groups.findIndex(g => g.id === groupId);
            if (groupIndex !== -1) {
                const categoryIndex = appData.groups[groupIndex].categories.findIndex(cat => cat.id === categoryId);
                if (categoryIndex !== -1) {
                    appData.groups[groupIndex].categories[categoryIndex].medicines = 
                        appData.groups[groupIndex].categories[categoryIndex].medicines.filter(med => med.id !== medicineId);
                    saveData();
                    renderMedicines(groupId, categoryId);
                }
            }
        }
    }
    
    function handleGroupSubmit(e) {
        e.preventDefault();
        const groupName = document.getElementById('groupName').value.trim();
        
        if (!groupName) {
            alert('الرجاء إدخال اسم المجموعة');
            return;
        }
        
        if (isEditing) {
            const groupIndex = appData.groups.findIndex(g => g.id === currentEditingId);
            if (groupIndex !== -1) {
                appData.groups[groupIndex].name = groupName;
            }
        } else {
            const newGroup = {
                id: Date.now().toString(),
                name: groupName,
                categories: []
            };
            appData.groups.push(newGroup);
            currentGroupId = newGroup.id;
        }
        
        saveData();
        renderGroups();
        groupModal.style.display = 'none';
        resetForms();
        
        if (!isEditing && currentGroupId) {
            renderCategories(currentGroupId);
        }
    }
    
    function handleCategorySubmit(e) {
        e.preventDefault();
        const groupId = document.getElementById('categoryGroup').value;
        const categoryName = document.getElementById('categoryName').value.trim();
        
        if (!categoryName) {
            alert('الرجاء إدخال اسم القسم');
            return;
        }
        
        const groupIndex = appData.groups.findIndex(g => g.id === groupId);
        
        if (groupIndex === -1) {
            alert('لم يتم العثور على المجموعة المحددة');
            return;
        }
        
        if (isEditing) {
            const categoryIndex = appData.groups[groupIndex].categories.findIndex(cat => cat.id === currentEditingId);
            if (categoryIndex !== -1) {
                appData.groups[groupIndex].categories[categoryIndex].name = categoryName;
            }
        } else {
            const newCategory = {
                id: Date.now().toString(),
                name: categoryName,
                medicines: []
            };
            appData.groups[groupIndex].categories.push(newCategory);
            currentCategoryId = newCategory.id;
        }
        
        saveData();
        renderCategories(groupId);
        categoryModal.style.display = 'none';
        resetForms();
        
        if (!isEditing && currentCategoryId) {
            showMedicinesContent(groupId, currentCategoryId);
        }
    }
    
    function handleMedicineSubmit(e) {
        e.preventDefault();
        
        const medicineData = {
            id: isEditing ? document.getElementById('medicineId').value : Date.now().toString(),
            tradeName: document.getElementById('medicineTradeName').value,
            scientificName: document.getElementById('medicineScientificName').value,
            specs: document.getElementById('medicineSpecs').value,
            contraindications: document.getElementById('medicineContraindications').value,
            dosage: document.getElementById('medicineDosage').value,
            form: document.getElementById('medicineForm').value,
            notes: document.getElementById('medicineNotes').value,
            image: document.getElementById('imagePreview').querySelector('img')?.src || ''
        };
        
        const groupIndex = appData.groups.findIndex(g => g.id === currentGroupId);
        const categoryIndex = appData.groups[groupIndex].categories.findIndex(cat => cat.id === currentCategoryId);
        
        if (isEditing) {
            const medicineIndex = appData.groups[groupIndex].categories[categoryIndex].medicines.findIndex(med => med.id === medicineData.id);
            if (medicineIndex !== -1) {
                appData.groups[groupIndex].categories[categoryIndex].medicines[medicineIndex] = medicineData;
            }
        } else {
            appData.groups[groupIndex].categories[categoryIndex].medicines.push(medicineData);
        }
        
        saveData();
        renderMedicines(currentGroupId, currentCategoryId);
        medicineModal.style.display = 'none';
        resetForms();
    }
    
    // ===== قسم الأمراض =====
    function renderDiseasesCategories() {
        diseasesCategoriesList.innerHTML = '';
        
        if (appData.diseasesCategories.length === 0) {
            diseasesCategoriesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>لا توجد أقسام أمراض متاحة</p>
                </div>
            `;
            return;
        }
        
        appData.diseasesCategories.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.className = `category-item ${currentDiseaseCategoryId === category.id ? 'active' : ''}`;
            categoryElement.innerHTML = `
                <span>${category.name}</span>
                <div class="actions">
                    <button class="edit-disease-category" data-id="${category.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-disease-category" data-id="${category.id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            categoryElement.addEventListener('click', () => {
                currentDiseaseCategoryId = category.id;
                showDiseasesContent(category.id);
            });
            diseasesCategoriesList.appendChild(categoryElement);
        });
        
        document.querySelectorAll('.edit-disease-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                editDiseaseCategory(e.target.closest('button').dataset.id);
            });
        });
        
        document.querySelectorAll('.delete-disease-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteDiseaseCategory(e.target.closest('button').dataset.id);
            });
        });
    }
    
    function renderDiseases(categoryId) {
        diseasesList.innerHTML = '';
        const category = appData.diseasesCategories.find(cat => cat.id === categoryId);
        if (!category) return;
        
        if (!category.diseases || category.diseases.length === 0) {
            diseasesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-disease"></i>
                    <p>لا توجد أمراض في هذا القسم</p>
                </div>
            `;
            return;
        }
        
        category.diseases.forEach(disease => {
            const diseaseElement = document.createElement('div');
            diseaseElement.className = 'disease-card';
            diseaseElement.innerHTML = `
                <div class="disease-image">
                    ${disease.image ? 
                        `<img src="${disease.image}" alt="${disease.name}">` : 
                        `<div class="placeholder"><i class="fas fa-disease"></i></div>`}
                </div>
                <div class="disease-body">
                    <div class="disease-title">
                        <span>${disease.name}</span>
                        <div class="disease-actions">
                            <button class="btn secondary edit-disease" data-id="${disease.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn danger delete-disease" data-id="${disease.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    ${disease.scientificName ? `<div class="disease-scientific">${disease.scientificName}</div>` : ''}
                    ${disease.description ? `<div class="disease-description"><strong>شرح عن المرض:</strong> ${disease.description}</div>` : ''}
                    ${disease.symptoms ? `<div class="disease-symptoms"><strong>الأعراض:</strong> ${disease.symptoms}</div>` : ''}
                    ${disease.diagnosis ? `<div class="disease-diagnosis"><strong>التشخيص:</strong> ${disease.diagnosis}</div>` : ''}
                    ${disease.treatment ? `<div class="disease-treatment"><strong>العلاج:</strong> ${disease.treatment}</div>` : ''}
                    ${disease.prevention ? `<div class="disease-prevention"><strong>الوقاية:</strong> ${disease.prevention}</div>` : ''}
                </div>
            `;
            diseasesList.appendChild(diseaseElement);
        });
        
        document.querySelectorAll('.edit-disease').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                editDisease(categoryId, e.target.closest('button').dataset.id);
            });
        });
        
        document.querySelectorAll('.delete-disease').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteDisease(categoryId, e.target.closest('button').dataset.id);
            });
        });
    }
    
    function showDiseasesContent(categoryId) {
        const category = appData.diseasesCategories.find(cat => cat.id === categoryId);
        if (!category) return;
        
        currentDiseaseCategoryId = categoryId;
        
        diseasesWelcome.style.display = 'none';
        diseasesContent.style.display = 'block';
        currentDiseaseCategoryTitle.textContent = category.name;
        
        renderDiseasesCategories();
        renderDiseases(categoryId);
    }
    
    function openDiseaseCategoryModal(categoryId = null) {
        isEditing = categoryId !== null;
        currentEditingId = categoryId;
        
        const modalTitle = document.getElementById('diseaseCategoryModalTitle');
        const categoryNameInput = document.getElementById('diseaseCategoryName');
        
        if (isEditing) {
            modalTitle.textContent = 'تعديل قسم الأمراض';
            const category = appData.diseasesCategories.find(cat => cat.id === categoryId);
            categoryNameInput.value = category.name;
        } else {
            modalTitle.textContent = 'إضافة قسم أمراض';
            categoryNameInput.value = '';
        }
        
        diseaseCategoryModal.style.display = 'flex';
    }
    
    function openDiseaseModal(diseaseId = null) {
        if (!currentDiseaseCategoryId) return;
        
        isEditing = diseaseId !== null;
        currentEditingId = diseaseId;
        
        const modalTitle = document.getElementById('diseaseModalTitle');
        const category = appData.diseasesCategories.find(cat => cat.id === currentDiseaseCategoryId);
        
        if (isEditing) {
            modalTitle.textContent = 'تعديل المرض';
            const disease = category.diseases.find(d => d.id === diseaseId);
            
            document.getElementById('diseaseId').value = disease.id;
            document.getElementById('diseaseName').value = disease.name;
            document.getElementById('diseaseScientificName').value = disease.scientificName || '';
            document.getElementById('diseaseDescription').value = disease.description || '';
            document.getElementById('diseaseSymptoms').value = disease.symptoms || '';
            document.getElementById('diseaseDiagnosis').value = disease.diagnosis || '';
            document.getElementById('diseaseTreatment').value = disease.treatment || '';
            document.getElementById('diseasePrevention').value = disease.prevention || '';
            
            const imagePreview = document.getElementById('diseaseImagePreview');
            imagePreview.innerHTML = '';
            if (disease.image) {
                const img = document.createElement('img');
                img.src = disease.image;
                imagePreview.appendChild(img);
            }
        } else {
            modalTitle.textContent = 'إضافة مرض جديد';
            document.getElementById('diseaseForm').reset();
            document.getElementById('diseaseImagePreview').innerHTML = '';
            document.getElementById('diseaseFileName').textContent = '';
        }
        
        document.getElementById('diseaseCategoryId').value = currentDiseaseCategoryId;
        diseaseModal.style.display = 'flex';
    }
    
    function editDiseaseCategory(categoryId) {
        openDiseaseCategoryModal(categoryId);
    }
    
    function deleteDiseaseCategory(categoryId) {
        if (confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع الأمراض الموجودة فيه.')) {
            appData.diseasesCategories = appData.diseasesCategories.filter(cat => cat.id !== categoryId);
            saveData();
            renderDiseasesCategories();
            
            if (currentDiseaseCategoryId === categoryId) {
                currentDiseaseCategoryId = null;
                diseasesWelcome.style.display = 'flex';
                diseasesContent.style.display = 'none';
            }
        }
    }
    
    function editDisease(categoryId, diseaseId) {
        currentDiseaseCategoryId = categoryId;
        openDiseaseModal(diseaseId);
    }
    
    function deleteDisease(categoryId, diseaseId) {
        if (confirm('هل أنت متأكد من حذف هذا المرض؟')) {
            const categoryIndex = appData.diseasesCategories.findIndex(cat => cat.id === categoryId);
            if (categoryIndex !== -1) {
                appData.diseasesCategories[categoryIndex].diseases = 
                    appData.diseasesCategories[categoryIndex].diseases.filter(d => d.id !== diseaseId);
                saveData();
                renderDiseases(categoryId);
            }
        }
    }
    
    function handleDiseaseCategorySubmit(e) {
        e.preventDefault();
        const categoryName = document.getElementById('diseaseCategoryName').value.trim();
        
        if (!categoryName) {
            alert('الرجاء إدخال اسم القسم');
            return;
        }
        
        if (isEditing) {
            const categoryIndex = appData.diseasesCategories.findIndex(cat => cat.id === currentEditingId);
            if (categoryIndex !== -1) {
                appData.diseasesCategories[categoryIndex].name = categoryName;
            }
        } else {
            const newCategory = {
                id: Date.now().toString(),
                name: categoryName,
                diseases: []
            };
            appData.diseasesCategories.push(newCategory);
            currentDiseaseCategoryId = newCategory.id;
        }
        
        saveData();
        renderDiseasesCategories();
        diseaseCategoryModal.style.display = 'none';
        resetForms();
        
        if (!isEditing && currentDiseaseCategoryId) {
            showDiseasesContent(currentDiseaseCategoryId);
        }
    }
    
    function handleDiseaseSubmit(e) {
        e.preventDefault();
        
        const diseaseData = {
            id: isEditing ? document.getElementById('diseaseId').value : Date.now().toString(),
            name: document.getElementById('diseaseName').value,
            scientificName: document.getElementById('diseaseScientificName').value,
            description: document.getElementById('diseaseDescription').value,
            symptoms: document.getElementById('diseaseSymptoms').value,
            diagnosis: document.getElementById('diseaseDiagnosis').value,
            treatment: document.getElementById('diseaseTreatment').value,
            prevention: document.getElementById('diseasePrevention').value,
            image: document.getElementById('diseaseImagePreview').querySelector('img')?.src || ''
        };
        
        const categoryIndex = appData.diseasesCategories.findIndex(cat => cat.id === currentDiseaseCategoryId);
        
        if (isEditing) {
            const diseaseIndex = appData.diseasesCategories[categoryIndex].diseases.findIndex(d => d.id === diseaseData.id);
            if (diseaseIndex !== -1) {
                appData.diseasesCategories[categoryIndex].diseases[diseaseIndex] = diseaseData;
            }
        } else {
            appData.diseasesCategories[categoryIndex].diseases.push(diseaseData);
        }
        
        saveData();
        renderDiseases(currentDiseaseCategoryId);
        diseaseModal.style.display = 'none';
        resetForms();
    }
    
    function searchMedicines() {
        const searchTerm = this.value.toLowerCase();
        
        if (!searchTerm) {
            if (currentGroupId && currentCategoryId) {
                renderMedicines(currentGroupId, currentCategoryId);
            }
            return;
        }
        
        let resultsFound = false;
        
        appData.groups.forEach(group => {
            group.categories.forEach(category => {
                const filteredMedicines = category.medicines.filter(medicine => 
                    medicine.tradeName.toLowerCase().includes(searchTerm) || 
                    medicine.scientificName.toLowerCase().includes(searchTerm) ||
                    (medicine.specs && medicine.specs.toLowerCase().includes(searchTerm))
                );
                
                if (filteredMedicines.length > 0) {
                    resultsFound = true;
                    medicinesList.innerHTML = '';
                    
                    const resultsHeader = document.createElement('h3');
                    resultsHeader.textContent = `نتائج البحث عن "${searchTerm}"`;
                    resultsHeader.style.margin = '0 0 20px';
                    resultsHeader.style.color = 'var(--primary-color)';
                    medicinesList.appendChild(resultsHeader);
                    
                    filteredMedicines.forEach(medicine => {
                        const medicineElement = document.createElement('div');
                        medicineElement.className = 'medicine-card';
                        medicineElement.innerHTML = `
                            <div class="medicine-image">
                                ${medicine.image ? 
                                    `<img src="${medicine.image}" alt="${medicine.tradeName}">` : 
                                    `<div class="placeholder"><i class="fas fa-pills"></i></div>`}
                            </div>
                            <div class="medicine-body">
                                <div class="medicine-title">
                                    <span>${medicine.tradeName}</span>
                                    <div class="medicine-subtitle">
                                        <span>${category.name} / ${group.name}</span>
                                    </div>
                                </div>
                                <div class="medicine-scientific">${medicine.scientificName}</div>
                                ${medicine.dosage ? `<div class="medicine-dosage">${medicine.dosage}</div>` : ''}
                                <div class="medicine-actions">
                                    <button class="btn primary" onclick="location.hash='#medicines'; currentGroupId='${group.id}'; currentCategoryId='${category.id}'; showMedicinesContent('${group.id}', '${category.id}')">
                                        <i class="fas fa-arrow-left"></i> الانتقال للقسم
                                    </button>
                                </div>
                            </div>
                        `;
                        medicinesList.appendChild(medicineElement);
                    });
                }
            });
        });
        
        if (!resultsFound) {
            medicinesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>لا توجد نتائج مطابقة للبحث</p>
                </div>
            `;
        }
    }
    
    function searchDiseases() {
        const searchTerm = this.value.toLowerCase();
        
        if (!searchTerm) {
            if (currentDiseaseCategoryId) {
                renderDiseases(currentDiseaseCategoryId);
            }
            return;
        }
        
        let resultsFound = false;
        
        appData.diseasesCategories.forEach(category => {
            const filteredDiseases = category.diseases.filter(disease => 
                disease.name.toLowerCase().includes(searchTerm) || 
                (disease.scientificName && disease.scientificName.toLowerCase().includes(searchTerm)) ||
                (disease.description && disease.description.toLowerCase().includes(searchTerm)) ||
                (disease.symptoms && disease.symptoms.toLowerCase().includes(searchTerm))
            );
            
            if (filteredDiseases.length > 0) {
                resultsFound = true;
                diseasesList.innerHTML = '';
                
                const resultsHeader = document.createElement('h3');
                resultsHeader.textContent = `نتائج البحث عن "${searchTerm}"`;
                resultsHeader.style.margin = '0 0 20px';
                resultsHeader.style.color = 'var(--primary-color)';
                diseasesList.appendChild(resultsHeader);
                
                filteredDiseases.forEach(disease => {
                    const diseaseElement = document.createElement('div');
                    diseaseElement.className = 'disease-card';
                    diseaseElement.innerHTML = `
                        <div class="disease-image">
                            ${disease.image ? 
                                `<img src="${disease.image}" alt="${disease.name}">` : 
                                `<div class="placeholder"><i class="fas fa-disease"></i></div>`}
                        </div>
                        <div class="disease-body">
                            <div class="disease-title">
                                <span>${disease.name}</span>
                                <div class="disease-subtitle">
                                    <span>${category.name}</span>
                                </div>
                            </div>
                            ${disease.symptoms ? `<div class="disease-symptoms"><strong>الأعراض:</strong> ${disease.symptoms}</div>` : ''}
                            <div class="disease-actions">
                                <button class="btn primary" onclick="location.hash='#diseases'; currentDiseaseCategoryId='${category.id}'; showDiseasesContent('${category.id}')">
                                    <i class="fas fa-arrow-left"></i> الانتقال للقسم
                                </button>
                            </div>
                        </div>
                    `;
                    diseasesList.appendChild(diseaseElement);
                });
            }
        });
        
        if (!resultsFound) {
            diseasesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>لا توجد نتائج مطابقة للبحث</p>
                </div>
            `;
        }
    }
    
    function handleImageUpload(event, previewId, fileNameId) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById(previewId);
                preview.innerHTML = '';
                const img = document.createElement('img');
                img.src = e.target.result;
                preview.appendChild(img);
                
                document.getElementById(fileNameId).textContent = file.name;
            };
            reader.readAsDataURL(file);
        }
    }
    
    function resetForms() {
        document.querySelectorAll('form').forEach(form => form.reset());
        document.querySelectorAll('.image-preview').forEach(preview => preview.innerHTML = '');
        document.querySelectorAll('.file-name').forEach(el => el.textContent = '');
        isEditing = false;
        currentEditingId = null;
    }
    
    function saveData() {
        localStorage.setItem('medicalAppData', JSON.stringify(appData));
    }
});
