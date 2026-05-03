let medicines = JSON.parse(localStorage.getItem('medicines')) || [];
let selectedSymptoms = [];
let currentEditId = null;

const symptomDatabase = {
    '头痛': {
        recommend: ['布洛芬缓释胶囊', '对乙酰氨基酚片', '阿司匹林肠溶片'],
        tips: '注意休息，避免强光刺激，多喝水'
    },
    '发烧': {
        recommend: ['布洛芬缓释胶囊', '对乙酰氨基酚片', '感冒灵颗粒'],
        tips: '多喝温水，物理降温，如持续高烧请及时就医'
    },
    '咳嗽': {
        recommend: ['川贝枇杷膏', '右美沙芬口服液', '复方甘草片'],
        tips: '保持室内湿润，避免辛辣食物，多喝温水'
    },
    '腹泻': {
        recommend: ['蒙脱石散', '黄连素片', '益生菌'],
        tips: '补充水分和电解质，清淡饮食，如严重请就医'
    },
    '胃痛': {
        recommend: ['奥美拉唑肠溶胶囊', '铝碳酸镁片', '健胃消食片'],
        tips: '避免辛辣刺激食物，规律饮食，不要暴饮暴食'
    },
    '过敏': {
        recommend: ['氯雷他定片', '盐酸西替利嗪片', '炉甘石洗剂'],
        tips: '远离过敏原，如出现呼吸困难请立即就医'
    },
    '失眠': {
        recommend: ['褪黑素', '安神补脑液', '谷维素'],
        tips: '规律作息，睡前放松，避免使用电子产品'
    },
    '肌肉酸痛': {
        recommend: ['布洛芬缓释胶囊', '双氯芬酸钠乳膏', '活血止痛膏'],
        tips: '适当休息，热敷按摩，避免剧烈运动'
    }
};

const interactionDatabase = {
    '布洛芬缓释胶囊+对乙酰氨基酚片': {
        level: 'danger',
        message: '这两种药物不能同时服用！它们都属于解热镇痛药，同时使用会增加肝肾负担，可能造成严重不良反应。'
    },
    '布洛芬缓释胶囊+阿司匹林肠溶片': {
        level: 'warning',
        message: '同时使用可能降低阿司匹林的心血管保护作用，并增加胃肠道出血风险。如需合用请咨询医生。'
    },
    '头孢类+酒精': {
        level: 'danger',
        message: '服用头孢类药物期间及停药后一周内严禁饮酒！可能引起双硫仑样反应，严重时危及生命。'
    },
    '安眠药+酒精': {
        level: 'danger',
        message: '安眠药与酒精合用会严重抑制中枢神经系统，可能导致昏迷甚至死亡！'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initPage();
    initEventListeners();
    updateStats();
    renderMedicineList();
    updateMedicineSelectors();
});

function initPage() {
    const today = new Date();
    const expiryInput = document.getElementById('med-expiry');
    expiryInput.min = today.toISOString().split('T')[0];
}

function initEventListeners() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchPage(btn.dataset.page));
    });

    document.querySelectorAll('.alert-tab').forEach(tab => {
        tab.addEventListener('click', () => switchAlertTab(tab.dataset.alert));
    });

    document.querySelectorAll('.consult-tab').forEach(tab => {
        tab.addEventListener('click', () => switchConsultTab(tab.dataset.consult));
    });

    document.querySelectorAll('.symptom-tag').forEach(tag => {
        tag.addEventListener('click', () => toggleSymptom(tag));
    });

    document.getElementById('medicine-search').addEventListener('input', filterMedicines);
    document.getElementById('category-filter').addEventListener('change', filterMedicines);
    document.getElementById('add-medicine-form').addEventListener('submit', handleAddMedicine);

    document.getElementById('add-modal').addEventListener('click', (e) => {
        if (e.target.id === 'add-modal') closeAddModal();
    });
    document.getElementById('detail-modal').addEventListener('click', (e) => {
        if (e.target.id === 'detail-modal') closeDetailModal();
    });
}

function switchPage(pageName) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === pageName);
    });
    document.querySelectorAll('.page').forEach(page => {
        page.classList.toggle('active', page.id === pageName);
    });

    if (pageName === 'alert') {
        renderAlertList();
    }
}

function switchAlertTab(tabName) {
    document.querySelectorAll('.alert-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.alert === tabName);
    });
    document.getElementById('expiring-list').style.display = tabName === 'expiring' ? 'flex' : 'none';
    document.getElementById('expired-list').style.display = tabName === 'expired' ? 'flex' : 'none';
}

function switchConsultTab(tabName) {
    document.querySelectorAll('.consult-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.consult === tabName);
    });
    document.getElementById('symptom-consult').style.display = tabName === 'symptom' ? 'block' : 'none';
    document.getElementById('interaction-consult').style.display = tabName === 'interaction' ? 'block' : 'none';
    document.getElementById('taboo-consult').style.display = tabName === 'taboo' ? 'block' : 'none';
}

function toggleSymptom(tag) {
    tag.classList.toggle('selected');
    const symptom = tag.dataset.symptom;
    if (tag.classList.contains('selected')) {
        selectedSymptoms.push(symptom);
    } else {
        selectedSymptoms = selectedSymptoms.filter(s => s !== symptom);
    }
}

function openAddModal() {
    currentEditId = null;
    document.getElementById('add-medicine-form').reset();
    document.getElementById('add-modal').classList.add('active');
}

function closeAddModal() {
    document.getElementById('add-modal').classList.remove('active');
    currentEditId = null;
}

function openEditModal(id) {
    const medicine = medicines.find(m => m.id === id);
    if (!medicine) return;

    currentEditId = id;
    document.getElementById('med-name').value = medicine.name;
    document.getElementById('med-category').value = medicine.category;
    document.getElementById('med-expiry').value = medicine.expiry;
    document.getElementById('med-spec').value = medicine.spec || '';
    document.getElementById('med-quantity').value = medicine.quantity || '';
    document.getElementById('med-indication').value = medicine.indication || '';
    document.getElementById('med-usage').value = medicine.usage || '';
    document.getElementById('med-taboo').value = medicine.taboo || '';
    document.getElementById('med-notes').value = medicine.notes || '';

    document.getElementById('add-modal').classList.add('active');
}

function closeDetailModal() {
    document.getElementById('detail-modal').classList.remove('active');
}

function handleAddMedicine(e) {
    e.preventDefault();

    const medicine = {
        id: currentEditId || Date.now(),
        name: document.getElementById('med-name').value,
        category: document.getElementById('med-category').value,
        expiry: document.getElementById('med-expiry').value,
        spec: document.getElementById('med-spec').value,
        quantity: document.getElementById('med-quantity').value,
        indication: document.getElementById('med-indication').value,
        usage: document.getElementById('med-usage').value,
        taboo: document.getElementById('med-taboo').value,
        notes: document.getElementById('med-notes').value,
        createdAt: currentEditId ? medicines.find(m => m.id === currentEditId)?.createdAt : new Date().toISOString()
    };

    if (currentEditId) {
        const index = medicines.findIndex(m => m.id === currentEditId);
        if (index !== -1) medicines[index] = medicine;
    } else {
        medicines.push(medicine);
    }

    saveMedicines();
    closeAddModal();
    renderMedicineList();
    updateStats();
    updateMedicineSelectors();
}

function saveMedicines() {
    localStorage.setItem('medicines', JSON.stringify(medicines));
}

function getExpiryStatus(expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'expired', days: diffDays };
    if (diffDays <= 30) return { status: 'expiring', days: diffDays };
    return { status: 'normal', days: diffDays };
}

function updateStats() {
    const total = medicines.length;
    let expiring = 0;
    let expired = 0;

    medicines.forEach(m => {
        const { status } = getExpiryStatus(m.expiry);
        if (status === 'expiring') expiring++;
        if (status === 'expired') expired++;
    });

    document.getElementById('total-medicine').textContent = total;
    document.getElementById('expiring-soon').textContent = expiring;
    document.getElementById('expired').textContent = expired;
}

function renderMedicineList(filteredMedicines = null) {
    const list = document.getElementById('medicine-list');
    const empty = document.getElementById('medicine-empty');
    const meds = filteredMedicines || medicines;

    if (meds.length === 0) {
        list.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    list.style.display = 'grid';
    empty.style.display = 'none';

    list.innerHTML = meds.map(medicine => {
        const { status, days } = getExpiryStatus(medicine.expiry);
        let statusBadge = '';
        let cardClass = '';

        if (status === 'expiring') {
            statusBadge = `<span class="status-badge expiring">${days}天后过期</span>`;
            cardClass = 'expiring';
        } else if (status === 'expired') {
            statusBadge = `<span class="status-badge expired">已过期${Math.abs(days)}天</span>`;
            cardClass = 'expired';
        }

        return `
            <div class="medicine-card ${cardClass}" onclick="showMedicineDetail(${medicine.id})">
                ${statusBadge}
                <h3 class="medicine-name">${medicine.name}</h3>
                <span class="medicine-category">${medicine.category}</span>
                ${medicine.spec ? `<p class="medicine-info">规格：${medicine.spec}</p>` : ''}
                ${medicine.quantity ? `<p class="medicine-info">数量：${medicine.quantity}</p>` : ''}
                <p class="medicine-info">保质期至：${medicine.expiry}</p>
            </div>
        `;
    }).join('');
}

function filterMedicines() {
    const search = document.getElementById('medicine-search').value.toLowerCase();
    const category = document.getElementById('category-filter').value;

    let filtered = medicines;

    if (search) {
        filtered = filtered.filter(m => 
            m.name.toLowerCase().includes(search) ||
            m.category.toLowerCase().includes(search) ||
            (m.indication && m.indication.toLowerCase().includes(search))
        );
    }

    if (category) {
        filtered = filtered.filter(m => m.category === category);
    }

    renderMedicineList(filtered);
}

function showMedicineDetail(id) {
    const medicine = medicines.find(m => m.id === id);
    if (!medicine) return;

    const { status, days } = getExpiryStatus(medicine.expiry);
    let statusText = '';
    if (status === 'expiring') statusText = `<span style="color: #f6ad55; font-weight: 600;">${days}天后过期</span>`;
    else if (status === 'expired') statusText = `<span style="color: #fc8181; font-weight: 600;">已过期${Math.abs(days)}天</span>`;
    else statusText = `还有${days}天过期`;

    document.getElementById('detail-title').textContent = medicine.name;
    document.getElementById('detail-content').innerHTML = `
        <div class="detail-section">
            <div class="detail-row">
                <span class="detail-label">分类</span>
                <span class="detail-value">${medicine.category}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">保质期至</span>
                <span class="detail-value">${medicine.expiry} (${statusText})</span>
            </div>
            ${medicine.spec ? `
            <div class="detail-row">
                <span class="detail-label">规格</span>
                <span class="detail-value">${medicine.spec}</span>
            </div>` : ''}
            ${medicine.quantity ? `
            <div class="detail-row">
                <span class="detail-label">数量</span>
                <span class="detail-value">${medicine.quantity}</span>
            </div>` : ''}
            ${medicine.indication ? `
            <div class="detail-row">
                <span class="detail-label">适应症</span>
                <span class="detail-value">${medicine.indication}</span>
            </div>` : ''}
            ${medicine.usage ? `
            <div class="detail-row">
                <span class="detail-label">用法用量</span>
                <span class="detail-value">${medicine.usage}</span>
            </div>` : ''}
            ${medicine.taboo ? `
            <div class="detail-row">
                <span class="detail-label">禁忌</span>
                <span class="detail-value" style="color: #fc8181;">${medicine.taboo}</span>
            </div>` : ''}
            ${medicine.notes ? `
            <div class="detail-row">
                <span class="detail-label">备注</span>
                <span class="detail-value">${medicine.notes}</span>
            </div>` : ''}
        </div>
        <div class="detail-actions">
            <button class="btn-secondary" onclick="openEditModal(${medicine.id}); closeDetailModal();">编辑</button>
            <button class="btn-danger" onclick="deleteMedicine(${medicine.id})">删除</button>
            <button class="btn-secondary" onclick="closeDetailModal()">关闭</button>
        </div>
    `;

    document.getElementById('detail-modal').classList.add('active');
}

function deleteMedicine(id) {
    if (!confirm('确定要删除这个药品吗？')) return;
    medicines = medicines.filter(m => m.id !== id);
    saveMedicines();
    closeDetailModal();
    renderMedicineList();
    updateStats();
    updateMedicineSelectors();
}

function renderAlertList() {
    const expiringList = document.getElementById('expiring-list');
    const expiredList = document.getElementById('expired-list');
    const empty = document.getElementById('alert-empty');

    let expiringMeds = [];
    let expiredMeds = [];

    medicines.forEach(m => {
        const { status, days } = getExpiryStatus(m.expiry);
        if (status === 'expiring') expiringMeds.push({ ...m, days });
        if (status === 'expired') expiredMeds.push({ ...m, days: Math.abs(days) });
    });

    if (expiringMeds.length === 0 && expiredMeds.length === 0) {
        empty.style.display = 'block';
        expiringList.style.display = 'none';
        expiredList.style.display = 'none';
        return;
    }

    empty.style.display = 'none';

    expiringList.innerHTML = expiringMeds.map(m => `
        <div class="alert-item expiring">
            <div class="alert-item-info">
                <h4>${m.name}</h4>
                <p>${m.category} · 保质期至 ${m.expiry}</p>
            </div>
            <span style="color: #f6ad55; font-weight: 600;">${m.days}天后过期</span>
        </div>
    `).join('');

    expiredList.innerHTML = expiredMeds.map(m => `
        <div class="alert-item expired">
            <div class="alert-item-info">
                <h4>${m.name}</h4>
                <p>${m.category} · 保质期至 ${m.expiry}</p>
            </div>
            <span style="color: #fc8181; font-weight: 600;">已过期${m.days}天</span>
        </div>
    `).join('');

    expiringList.style.display = 'flex';
}

function searchSymptom() {
    const resultDiv = document.getElementById('symptom-result');
    const customSymptom = document.getElementById('custom-symptom').value.trim();
    
    let allSymptoms = [...selectedSymptoms];
    if (customSymptom) {
        allSymptoms.push(customSymptom);
    }
    
    if (allSymptoms.length === 0) {
        resultDiv.innerHTML = `
            <div class="consult-result warning">
                <h4>请先选择或输入您的症状</h4>
                <p>点击上方的症状标签或在输入框中输入症状</p>
            </div>
        `;
        return;
    }

    let html = '';
    allSymptoms.forEach(symptom => {
        const data = symptomDatabase[symptom];
        if (data) {
            const inStock = data.recommend.filter(name => 
                medicines.some(m => m.name === name && getExpiryStatus(m.expiry).status !== 'expired')
            );
            
            html += `
                <div class="consult-result" style="margin-bottom: 15px;">
                    <h4>💊 ${symptom}</h4>
                    <p style="margin-bottom: 10px;"><strong>推荐用药：</strong></p>
                    <ul>
                        ${data.recommend.map(med => {
                            const has = inStock.includes(med);
                            return `<li>${med} ${has ? '✅ 家中有药' : ''}</li>`;
                        }).join('')}
                    </ul>
                    <p style="margin-top: 10px; color: #667eea;"><strong>💡 温馨提示：</strong>${data.tips}</p>
                </div>
            `;
        } else {
            html += `
                <div class="consult-result warning" style="margin-bottom: 15px;">
                    <h4>💊 ${symptom}</h4>
                    <p>抱歉，暂时没有该症状的推荐用药数据</p>
                    <p style="margin-top: 10px; color: #718096;">建议您咨询医生或药师获取专业建议</p>
                </div>
            `;
        }
    });

    html += `
        <div class="consult-result danger" style="margin-top: 15px;">
            <h4>⚠️ 重要提醒</h4>
            <ul>
                <li>以上建议仅供参考，不能替代专业医生诊断</li>
                <li>如症状严重或持续，请及时就医</li>
                <li>请仔细阅读药品说明书，按说明书使用</li>
                <li>儿童、孕妇、哺乳期妇女及慢性病患者请在医生指导下用药</li>
            </ul>
        </div>
    `;

    resultDiv.innerHTML = html;
}

function toggleCustomInput(num) {
    const select = document.getElementById(`medicine-${num}-select`);
    const input = document.getElementById(`medicine-${num}-custom`);
    
    if (select.value === 'custom') {
        input.style.display = 'block';
    } else {
        input.style.display = 'none';
    }
}

function toggleTabooCustomInput() {
    const select = document.getElementById('taboo-medicine-select');
    const input = document.getElementById('taboo-medicine-custom');
    
    if (select.value === 'custom') {
        input.style.display = 'block';
    } else {
        input.style.display = 'none';
    }
}

function updateMedicineSelectors() {
    const options = medicines
        .filter(m => getExpiryStatus(m.expiry).status !== 'expired')
        .map(m => `<option value="${m.name}">${m.name}</option>`)
        .join('');

    document.getElementById('medicine-1-select').innerHTML = `<option value="">从药箱选择...</option>${options}<option value="custom">手动输入...</option>`;
    document.getElementById('medicine-2-select').innerHTML = `<option value="">从药箱选择...</option>${options}<option value="custom">手动输入...</option>`;
    document.getElementById('taboo-medicine-select').innerHTML = `<option value="">从药箱选择...</option>${options}<option value="custom">手动输入...</option>`;
}

function checkInteraction() {
    const select1 = document.getElementById('medicine-1-select');
    const select2 = document.getElementById('medicine-2-select');
    const custom1 = document.getElementById('medicine-1-custom');
    const custom2 = document.getElementById('medicine-2-custom');
    
    let med1 = select1.value === 'custom' ? custom1.value.trim() : select1.value;
    let med2 = select2.value === 'custom' ? custom2.value.trim() : select2.value;
    
    const resultDiv = document.getElementById('interaction-result');

    if (!med1 || !med2) {
        resultDiv.innerHTML = `
            <div class="consult-result warning">
                <h4>请选择或输入两种药物</h4>
                <p>请先在下拉菜单中选择或手动输入要检查的两种药物</p>
            </div>
        `;
        return;
    }

    if (med1 === med2) {
        resultDiv.innerHTML = `
            <div class="consult-result warning">
                <h4>请选择两种不同的药物</h4>
                <p>您选择了相同的药物，请选择两种不同的药物进行检查</p>
            </div>
        `;
        return;
    }

    const key1 = `${med1}+${med2}`;
    const key2 = `${med2}+${med1}`;
    const interaction = interactionDatabase[key1] || interactionDatabase[key2];

    if (interaction) {
        resultDiv.innerHTML = `
            <div class="consult-result ${interaction.level}">
                <h4>⚠️ ${interaction.level === 'danger' ? '严重警告' : '注意'}</h4>
                <p style="font-size: 16px; line-height: 1.8;"><strong>${med1}</strong> + <strong>${med2}</strong></p>
                <p style="font-size: 16px; line-height: 1.8; margin-top: 10px;">${interaction.message}</p>
            </div>
        `;
    } else {
        resultDiv.innerHTML = `
            <div class="consult-result">
                <h4>✅ 未发现已知的严重相互作用</h4>
                <p style="margin-bottom: 10px;"><strong>${med1}</strong> + <strong>${med2}</strong></p>
                <ul>
                    <li>根据现有数据，这两种药物没有已知的严重相互作用</li>
                    <li>但每个人的身体状况不同，如有疑虑请咨询医生或药师</li>
                    <li>请仔细阅读两种药物的说明书</li>
                </ul>
            </div>
            <div class="consult-result warning" style="margin-top: 15px;">
                <h4>💡 重要提示</h4>
                <ul>
                    <li>本功能仅供参考，不能替代专业医疗建议</li>
                    <li>如正在服用多种药物，请咨询医生或药师</li>
                    <li>如有不适，请立即停药并就医</li>
                </ul>
            </div>
        `;
    }
}

function checkTaboo() {
    const select = document.getElementById('taboo-medicine-select');
    const custom = document.getElementById('taboo-medicine-custom');
    
    let medName = select.value === 'custom' ? custom.value.trim() : select.value;
    const resultDiv = document.getElementById('taboo-result');

    if (!medName) {
        resultDiv.innerHTML = `
            <div class="consult-result warning">
                <h4>请选择或输入药物</h4>
                <p>请先在下拉菜单中选择或手动输入要查询的药物</p>
            </div>
        `;
        return;
    }

    const medicine = medicines.find(m => m.name === medName);

    let html = `
        <div class="consult-result">
            <h4>📋 ${medName}</h4>
    `;

    if (medicine) {
        if (medicine.indication) {
            html += `<p style="margin-top: 10px;"><strong>适应症：</strong>${medicine.indication}</p>`;
        }

        if (medicine.usage) {
            html += `<p style="margin-top: 10px;"><strong>用法用量：</strong>${medicine.usage}</p>`;
        }

        if (medicine.taboo) {
            html += `
                <div style="margin-top: 15px; padding: 15px; background: #fff5f5; border-radius: 8px; border-left: 4px solid #fc8181;">
                    <strong style="color: #c53030;">⚠️ 禁忌：</strong>
                    <p style="margin-top: 8px; color: #c53030;">${medicine.taboo}</p>
                </div>
            `;
        } else {
            html += `<p style="margin-top: 10px; color: #718096;">暂无禁忌信息，请参考药品说明书</p>`;
        }
    } else {
        html += `<p style="margin-top: 10px; color: #718096;">药箱中没有找到该药物的信息</p>`;
        html += `<p style="margin-top: 10px; color: #718096;">建议您查阅药品说明书获取详细信息</p>`;
    }

    html += `</div>
        <div class="consult-result warning" style="margin-top: 15px;">
            <h4>💡 重要提示</h4>
            <ul>
                <li>请仔细阅读药品说明书</li>
                <li>儿童、孕妇、哺乳期妇女、老年人及慢性病患者应在医生指导下使用</li>
                <li>如正在服用其他药物，请咨询医生或药师</li>
                <li>用药过程中如出现不适，请立即停药并就医</li>
            </ul>
        </div>
    `;

    resultDiv.innerHTML = html;
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const loading = document.getElementById('ocr-loading');
    loading.classList.add('active');

    const reader = new FileReader();
    reader.onload = function(e) {
        const image = new Image();
        image.onload = function() {
            recognizeTextFromImage(e.target.result);
        };
        image.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function recognizeTextFromImage(imageData) {
    Tesseract.recognize(
        imageData,
        'chi_sim+eng',
        {
            logger: m => console.log(m)
        }
    ).then(({ data: { text } }) => {
        console.log('识别结果:', text);
        parseMedicineInfo(text);
        document.getElementById('ocr-loading').classList.remove('active');
    }).catch(err => {
        console.error('识别失败:', err);
        alert('识别失败，请重试或手动输入');
        document.getElementById('ocr-loading').classList.remove('active');
    });
}

function parseMedicineInfo(text) {
    const lines = text.split('\n').filter(line => line.trim());
    
    let medicineName = '';
    let expiryDate = '';
    let spec = '';
    
    for (let line of lines) {
        line = line.trim();
        
        if (!medicineName && line.length > 2 && line.length < 30) {
            const nameKeywords = ['胶囊', '片', '颗粒', '口服液', '膏', '散', '丸', '溶液', '注射液'];
            if (nameKeywords.some(keyword => line.includes(keyword))) {
                medicineName = line;
                continue;
            }
        }
        
        if (!expiryDate) {
            const datePattern = /(\d{4})[-年/](\d{1,2})[-月/](\d{1,2})/;
            const match = line.match(datePattern);
            if (match) {
                expiryDate = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
            }
        }
        
        if (!spec) {
            const specPattern = /(\d+\.?\d*)(g|mg|ml|粒|片|支)/i;
            if (specPattern.test(line)) {
                spec = line;
            }
        }
    }
    
    if (medicineName) {
        document.getElementById('med-name').value = medicineName;
    }
    if (expiryDate) {
        document.getElementById('med-expiry').value = expiryDate;
    }
    if (spec) {
        document.getElementById('med-spec').value = spec;
    }
    
    if (medicineName || expiryDate || spec) {
        alert('🎉 识别成功！已自动填充部分信息，请核对后补充完整');
    } else {
        alert('未能自动识别信息，请手动填写');
    }
}
