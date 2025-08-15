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
        const categoryName = document.getElementById('categoryName').value.trim();
        if (!categoryName) return alert('الرجاء إدخال اسم القسم');

        if (isEditing) {
            const categoryIndex = categories.findIndex(cat => cat.id === currentEditingId);
            if (categoryIndex !== -1) categories[categoryIndex].name = categoryName;
        } else {
            categories.push({ id: Date.now().toString(), name: categoryName, medicines: [] });
        }

        saveData();
        renderCategories();
        categoryModal.style.display = 'none';
        resetForms();
    });

    // تقديم نموذج العلاج
    medicineForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!currentCategoryId) return alert('الرجاء اختيار قسم أولاً');

        const medicineData = {
            id: isEditing ? document.getElementById('medicineId').value : Date.now().toString(),
            tradeName: document.getElementById('medicineTradeName').value.trim(),
            scientificName: document.getElementById('medicineScientificName').value.trim(),
            specs: document.getElementById('medicineSpecs').value.trim(),
            contraindications: document.getElementById('medicineContraindications').value.trim(),
            dosage: document.getElementById('medicineDosage').value.trim(),
            notes: document.getElementById('medicineNotes').value.trim(),
            image: document.getElementById('imagePreview').querySelector('img')?.src || ''
        };

        const categoryIndex = categories.findIndex(cat => cat.id === currentCategoryId);
        if (isEditing) {
            const medicineIndex = categories[categoryIndex].medicines.findIndex(med => med.id === medicineData.id);
            if (medicineIndex !== -1) categories[categoryIndex].medicines[medicineIndex] = medicineData;
        } else {
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
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = document.createElement('img');
            img.src = event.target.result;
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = '';
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });

    // البحث
    searchInput.addEventListener('input', function() {
        const term = this.value.toLowerCase();
        if (!term) return renderCategories();

        const filtered = categories.map(cat => {
            const meds = cat.medicines.filter(m => m.tradeName.toLowerCase().includes(term) || m.scientificName.toLowerCase().includes(term));
            return { ...cat, medicines: meds };
        }).filter(cat => cat.medicines.length > 0);

        renderFilteredCategories(filtered);
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
        if (!categories.length) {
            categoriesList.innerHTML = `<div class="empty-state"><i class="fas fa-folder-open"></i><p>لا توجد أقسام متاحة</p></div>`;
            return;
        }

        categories.forEach(cat => {
            const el = document.createElement('div');
            el.className = `category-item ${currentCategoryId === cat.id ? 'active' : ''}`;
            el.innerHTML = `<span>${cat.name}</span>
                <div class="actions">
                    <button class="edit-category" data-id="${cat.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-category" data-id="${cat.id}"><i class="fas fa-trash"></i></button>
                </div>`;
            el.addEventListener('click', () => showCategoryContent(cat.id));
            categoriesList.appendChild(el);
        });

        document.querySelectorAll('.edit-category').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                editCategory(btn.dataset.id);
            });
        });
        document.querySelectorAll('.delete-category').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                deleteCategory(btn.dataset.id);
            });
        });
    }

    function renderFilteredCategories(filtered) {
        categoriesList.innerHTML = '';
        if (!filtered.length) {
            categoriesList.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><p>لا توجد نتائج</p></div>`;
            return;
        }
        filtered.forEach(cat => {
            const el = document.createElement('div');
            el.className = 'category-item';
            el.innerHTML = `<span>${cat.name} (${cat.medicines.length})</span>`;
            el.addEventListener('click', () => showCategoryContent(cat.id));
            categoriesList.appendChild(el);
        });
    }

    function renderMedicines(catId) {
        medicinesList.innerHTML = '';
        const cat = categories.find(c => c.id === catId);
        if (!cat || !cat.medicines.length) {
            medicinesList.innerHTML = `<div class="empty-state"><i class="fas fa-pills"></i><p>لا توجد علاجات في هذا القسم</p></div>`;
            return;
        }

        cat.medicines.forEach(med => {
            const card = document.createElement('div');
            card.className = 'medicine-card';
            card.innerHTML = `
                <div class="medicine-image">${med.image? `<img src="${med.image}" alt="${med.tradeName}">`:`<div class="placeholder"><i class="fas fa-pills"></i></div>`}</div>
                <div class="medicine-body">
                    <div class="medicine-title">
                        <span>${med.tradeName}</span>
                        <div class="medicine-actions">
                            <button class="btn secondary edit-medicine" data-id="${med.id}"><i class="fas fa-edit"></i></button>
                            <button class="btn danger delete-medicine" data-id="${med.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="medicine-scientific">${med.scientificName}</div>
                    ${med.specs? `<div class="medicine-specs"><strong>المواصفات:</strong> ${med.specs}</div>`: ''}
                    ${med.contraindications? `<div class="medicine-contraindications"><strong>الموانع:</strong> ${med.contraindications}</div>`: ''}
                    ${med.dosage? `<div class="medicine-dosage">${med.dosage}</div>`: ''}
                    ${med.notes? `<div class="medicine-notes"><strong>ملاحظة:</strong> ${med.notes}</div>`: ''}
                </div>`;
            medicinesList.appendChild(card);
        });

        document.querySelectorAll('.edit-medicine').forEach(btn => btn.addEventListener('click', e => {
            e.stopPropagation();
            editMedicine(btn.dataset.id);
        }));
        document.querySelectorAll('.delete-medicine').forEach(btn => btn.addEventListener('click', e => {
            e.stopPropagation();
            deleteMedicine(btn.dataset.id);
        }));
    }

    function showCategoryContent(catId) {
        currentCategoryId = catId;
        welcomeScreen.style.display = 'none';
        categoryContent.style.display = 'block';
        const cat = categories.find(c => c.id === catId);
        currentCategoryTitle.textContent = cat.name;
        renderCategories();
        renderMedicines(catId);
    }

    function openCategoryModal(catId = null) {
        isEditing = !!catId;
        currentEditingId = catId;
        const modalTitle = document.getElementById('categoryModalTitle');
        const input = document.getElementById('categoryName');
        if (isEditing) {
            modalTitle.textContent = 'تعديل القسم';
            input.value = categories.find(c => c.id === catId).name;
        } else {
            modalTitle.textContent = 'إضافة قسم جديد';
            input.value = '';
        }
        categoryModal.style.display = 'flex';
    }

    function openMedicineModal(medId = null) {
        if (!currentCategoryId) return;
        isEditing = !!medId;
        currentEditingId = medId;
        const modalTitle = document.getElementById('medicineModalTitle');
        const form = document.getElementById('medicineForm');
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = '';
        form.reset();

        if (isEditing) {
            modalTitle.textContent = 'تعديل العلاج';
            const med = categories.find(c => c.id === currentCategoryId).medicines.find(m => m.id === medId);
            document.getElementById('medicineId').value = med.id;
            document.getElementById('medicineTradeName').value = med.tradeName;
            document.getElementById('medicineScientificName').value = med.scientificName;
            document.getElementById('medicineSpecs').value = med.specs;
            document.getElementById('medicineContraindications').value = med.contraindications;
            document.getElementById('medicineDosage').value = med.dosage;
            document.getElementById('medicineNotes').value = med.notes;
            if (med.image) {
                const img = document.createElement('img');
                img.src = med.image;
                preview.appendChild(img);
            }
        } else modalTitle.textContent = 'إضافة علاج جديد';

        medicineModal.style.display = 'flex';
    }

    function editCategory(catId) { openCategoryModal(catId); }
    function deleteCategory(catId) {
        if (!confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع العلاجات.')) return;
        categories = categories.filter(c => c.id !== catId);
        saveData();
        renderCategories();
        if (currentCategoryId === catId) {
            welcomeScreen.style.display = 'flex';
            categoryContent.style.display = 'none';
            currentCategoryId = null;
        }
    }
    function editMedicine(medId) { openMedicineModal(medId); }
    function deleteMedicine(medId) {
        if (!confirm('هل أنت متأكد من حذف هذا العلاج؟')) return;
        const cat = categories.find(c => c.id === currentCategoryId);
        if (!cat) return;
        cat.medicines = cat.medicines.filter(m => m.id !== medId);
        saveData();
        renderMedicines(currentCategoryId);
    }

    function resetForms() {
        categoryForm.reset();
        medicineForm.reset();
        document.getElementById('imagePreview').innerHTML = '';
        isEditing = false;
        currentEditingId = null;
    }

    function saveData() { localStorage.setItem('medicalCategories', JSON.stringify(categories)); }
});        saveData();
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
