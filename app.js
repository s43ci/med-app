document.addEventListener('DOMContentLoaded', function() {
    // عناصر DOM
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const addMedicineBtn = document.getElementById('addMedicineBtn');
    const categoryModal = document.getElementById('categoryModal');
    const medicineModal = document.getElementById('medicineModal');
    const closeButtons = document.querySelectorAll('.close-btn');
    const categoryForm = document.getElementById('categoryForm');
    const medicineForm = document.getElementById('medicineForm');
    const categoriesList = document.getElementById('categoriesList');
    const medicinesList = document.getElementById('medicinesList');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const categoryContent = document.getElementById('categoryContent');
    const currentCategoryTitle = document.getElementById('currentCategoryTitle');
    const searchInput = document.getElementById('searchInput');
    
    // بيانات التطبيق
    let categories = JSON.parse(localStorage.getItem('medicalCategories')) || [];
    let currentCategoryId = null;
    let isEditing = false;
    let currentEditingId = null;
    
    // تهيئة التطبيق
    initApp();
    
    // أحداث النقر
    addCategoryBtn.addEventListener('click', () => openCategoryModal());
    addMedicineBtn.addEventListener('click', () => openMedicineModal());
    
    // إغلاق النوافذ المنبثقة
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryModal.style.display = 'none';
            medicineModal.style.display = 'none';
            resetForms();
        });
    });
    
    // إغلاق النافذة المنبثقة عند النقر خارجها
    window.addEventListener('click', (e) => {
        if (e.target === categoryModal) {
            categoryModal.style.display = 'none';
            resetForms();
        }
        if (e.target === medicineModal) {
            medicineModal.style.display = 'none';
            resetForms();
        }
    });
    
    // تقديم نموذج القسم
    categoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const categoryName = document.getElementById('categoryName').value;
        
        if (isEditing) {
            // تعديل القسم الموجود
            const categoryIndex = categories.findIndex(cat => cat.id === currentEditingId);
            if (categoryIndex !== -1) {
                categories[categoryIndex].name = categoryName;
            }
        } else {
            // إضافة قسم جديد
            const newCategory = {
                id: Date.now().toString(),
                name: categoryName,
                medicines: []
            };
            categories.push(newCategory);
        }
        
        saveData();
        renderCategories();
        categoryModal.style.display = 'none';
        resetForms();
    });
    
    // تقديم نموذج العلاج
    medicineForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const medicineData = {
            id: isEditing ? document.getElementById('medicineId').value : Date.now().toString(),
            tradeName: document.getElementById('medicineTradeName').value,
            scientificName: document.getElementById('medicineScientificName').value,
            specs: document.getElementById('medicineSpecs').value,
            contraindications: document.getElementById('medicineContraindications').value,
            dosage: document.getElementById('medicineDosage').value,
            notes: document.getElementById('medicineNotes').value,
            image: document.getElementById('imagePreview').querySelector('img')?.src || ''
        };
        
        const categoryIndex = categories.findIndex(cat => cat.id === currentCategoryId);
        
        if (isEditing) {
            // تعديل العلاج الموجود
            const medicineIndex = categories[categoryIndex].medicines.findIndex(med => med.id === medicineData.id);
            if (medicineIndex !== -1) {
                categories[categoryIndex].medicines[medicineIndex] = medicineData;
            }
        } else {
            // إضافة علاج جديد
            categories[categoryIndex].medicines.push(medicineData);
        }
        
        saveData();
        renderMedicines(currentCategoryId);
        medicineModal.style.display = 'none';
        resetForms();
    });
    
    // معاينة الصورة
    document.getElementById('medicineImage').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const imagePreview = document.getElementById('imagePreview');
                imagePreview.innerHTML = '';
                const img = document.createElement('img');
                img.src = event.target.result;
                imagePreview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
    
    // البحث
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        if (!searchTerm) {
            renderCategories();
            return;
        }
        
        const filteredCategories = categories.map(category => {
            const filteredMedicines = category.medicines.filter(medicine => 
                medicine.tradeName.toLowerCase().includes(searchTerm) || 
                medicine.scientificName.toLowerCase().includes(searchTerm)
            );
            return {...category, medicines: filteredMedicines};
        }).filter(category => category.medicines.length > 0);
        
        renderFilteredCategories(filteredCategories);
    });
    
    // وظائف التطبيق
    function initApp() {
        renderCategories();
        
        if (categories.length > 0) {
            currentCategoryId = categories[0].id;
            showCategoryContent(currentCategoryId);
        }
    }
    
    function renderCategories() {
        categoriesList.innerHTML = '';
        
        if (categories.length === 0) {
            categoriesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>لا توجد أقسام متاحة</p>
                </div>
            `;
            return;
        }
        
        categories.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.className = `category-item ${currentCategoryId === category.id ? 'active' : ''}`;
            categoryElement.innerHTML = `
                <span>${category.name}</span>
                <div class="actions">
                    <button class="edit-category" data-id="${category.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-category" data-id="${category.id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            categoryElement.addEventListener('click', () => showCategoryContent(category.id));
            categoriesList.appendChild(categoryElement);
        });
        
        // إضافة أحداث لأزرار التعديل والحذف
        document.querySelectorAll('.edit-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                editCategory(e.target.closest('button').dataset.id);
            });
        });
        
        document.querySelectorAll('.delete-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteCategory(e.target.closest('button').dataset.id);
            });
        });
    }
    
    function renderFilteredCategories(filteredCategories) {
        categoriesList.innerHTML = '';
        
        if (filteredCategories.length === 0) {
            categoriesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>لا توجد نتائج مطابقة للبحث</p>
                </div>
            `;
            return;
        }
        
        filteredCategories.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'category-item';
            categoryElement.innerHTML = `
                <span>${category.name} (${category.medicines.length})</span>
            `;
            categoryElement.addEventListener('click', () => showCategoryContent(category.id));
            categoriesList.appendChild(categoryElement);
        });
    }
    
    function renderMedicines(categoryId) {
        medicinesList.innerHTML = '';
        const category = categories.find(cat => cat.id === categoryId);
        
        if (!category || category.medicines.length === 0) {
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
                    ${medicine.notes ? `<div class="medicine-notes"><strong>ملاحظة:</strong> ${medicine.notes}</div>` : ''}
                </div>
            `;
            medicinesList.appendChild(medicineElement);
        });
        
        // إضافة أحداث لأزرار التعديل والحذف
        document.querySelectorAll('.edit-medicine').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                editMedicine(e.target.closest('button').dataset.id);
            });
        });
        
        document.querySelectorAll('.delete-medicine').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteMedicine(e.target.closest('button').dataset.id);
            });
        });
    }
    
    function showCategoryContent(categoryId) {
        currentCategoryId = categoryId;
        const category = categories.find(cat => cat.id === categoryId);
        
        welcomeScreen.style.display = 'none';
        categoryContent.style.display = 'block';
        currentCategoryTitle.textContent = category.name;
        
        renderCategories();
        renderMedicines(categoryId);
    }
    
    function openCategoryModal(categoryId = null) {
        isEditing = categoryId !== null;
        currentEditingId = categoryId;
        
        const modalTitle = document.getElementById('categoryModalTitle');
        const categoryNameInput = document.getElementById('categoryName');
        
        if (isEditing) {
            modalTitle.textContent = 'تعديل القسم';
            const category = categories.find(cat => cat.id === categoryId);
            categoryNameInput.value = category.name;
        } else {
            modalTitle.textContent = 'إضافة قسم جديد';
            categoryNameInput.value = '';
        }
        
        categoryModal.style.display = 'flex';
    }
    
    function openMedicineModal(medicineId = null) {
        if (!currentCategoryId) return;
        
        isEditing = medicineId !== null;
        currentEditingId = medicineId;
        
        const modalTitle = document.getElementById('medicineModalTitle');
        const category = categories.find(cat => cat.id === currentCategoryId);
        
        if (isEditing) {
            modalTitle.textContent = 'تعديل العلاج';
            const medicine = category.medicines.find(med => med.id === medicineId);
            
            document.getElementById('medicineId').value = medicine.id;
            document.getElementById('medicineTradeName').value = medicine.tradeName;
            document.getElementById('medicineScientificName').value = medicine.scientificName;
            document.getElementById('medicineSpecs').value = medicine.specs;
            document.getElementById('medicineContraindications').value = medicine.contraindications;
            document.getElementById('medicineDosage').value = medicine.dosage;
            document.getElementById('medicineNotes').value = medicine.notes;
            
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
        }
        
        document.getElementById('medicineCategoryId').value = currentCategoryId;
        medicineModal.style.display = 'flex';
    }
    
    function editCategory(categoryId) {
        openCategoryModal(categoryId);
    }
    
    function deleteCategory(categoryId) {
        if (confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع العلاجات الموجودة فيه.')) {
            categories = categories.filter(cat => cat.id !== categoryId);
            saveData();
            renderCategories();
            
            if (currentCategoryId === categoryId) {
                welcomeScreen.style.display = 'flex';
                categoryContent.style.display = 'none';
                currentCategoryId = null;
            }
        }
    }
    
    function editMedicine(medicineId) {
        openMedicineModal(medicineId);
    }
    
    function deleteMedicine(medicineId) {
        if (confirm('هل أنت متأكد من حذف هذا العلاج؟')) {
            const categoryIndex = categories.findIndex(cat => cat.id === currentCategoryId);
            if (categoryIndex !== -1) {
                categories[categoryIndex].medicines = categories[categoryIndex].medicines.filter(med => med.id !== medicineId);
                saveData();
                renderMedicines(currentCategoryId);
            }
        }
    }
    
    function resetForms() {
        document.getElementById('categoryForm').reset();
        document.getElementById('medicineForm').reset();
        document.getElementById('imagePreview').innerHTML = '';
        isEditing = false;
        currentEditingId = null;
    }
    
    function saveData() {
        localStorage.setItem('medicalCategories', JSON.stringify(categories));
    }
});