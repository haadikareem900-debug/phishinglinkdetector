// عناصر DOM
const urlInput = document.getElementById('urlInput');
const scanBtn = document.getElementById('scanBtn');
const resultsCard = document.getElementById('resultsCard');
const cardFront = document.querySelector('.card-front');
const safetyMeter = document.getElementById('safetyMeter');
const safetyScore = document.getElementById('safetyScore');
const resultBadge = document.getElementById('resultBadge');
const threatList = document.getElementById('threatList');
const recommendationsList = document.getElementById('recommendationsList');
const newScanBtn = document.getElementById('newScanBtn');
const totalScanned = document.getElementById('totalScanned');
const accuracyRate = document.getElementById('accuracyRate');

// التهيئة
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateStats();
    console.log('🚀 LinkGuardian Pro جاهز للتشغيل');
});

function initializeEventListeners() {
    scanBtn.addEventListener('click', startUrlScan);
    newScanBtn.addEventListener('click', resetScan);
    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') startUrlScan();
    });
}

// بدء فحص الرابط
async function startUrlScan() {
    const url = urlInput.value.trim();
    
    if (!url) {
        showNotification('⚠️ يرجى إدخال رابط للفحص', 'warning');
        return;
    }
    
    // التحقق الأساسي من الرابط
    if (!isValidUrl(url)) {
        // محاولة إصلاح الرابط
        const fixedUrl = fixUrl(url);
        if (!isValidUrl(fixedUrl)) {
            showNotification('❌ الرابط غير صحيح', 'error');
            return;
        }
        urlInput.value = fixedUrl;
    }
    
    try {
        // إعداد واجهة المستخدم للفحص
        prepareForScan();
        
        // إجراء الفحص
        const result = await performUrlScan(url);
        
        // عرض النتائج
        displayResults(result);
        
        // تحديث الإحصائيات
        updateStats();
        
    } catch (error) {
        console.error('خطأ في الفحص:', error);
        showNotification('❌ فشل في فحص الرابط: ' + error.message, 'error');
        resetUI();
    }
}

// التحقق من صحة الرابط
function isValidUrl(string) {
    try {
        // قبول الروابط بدون scheme
        if (!string.startsWith('http://') && !string.startsWith('https://')) {
            string = 'https://' + string;
        }
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// إصلاح الرابط
function fixUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return 'https://' + url;
    }
    return url;
}

// إعداد واجهة المستخدم للفحص
function prepareForScan() {
    scanBtn.disabled = true;
    scanBtn.innerHTML = '<span class="btn-text">⏳ جاري الفحص...</span>';
    urlInput.disabled = true;
}

// إجراء فحص الرابط
async function performUrlScan(url) {
    console.log('🔄 جاري فحص الرابط:', url);
    
    const response = await fetch('/scan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url })
    });
    
    console.log('📨 استجابة الخادم:', response.status);
    
    if (!response.ok) {
        throw new Error(`خطأ في الخادم: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('📊 نتيجة الفحص:', result);
    
    if (result.error) {
        throw new Error(result.error);
    }
    
    if (result.status === 'error') {
        throw new Error(result.error || 'خطأ غير معروف');
    }
    
    return result;
}

// عرض النتائج
function displayResults(result) {
    // تحريك البطاقة لعرض النتائج
    cardFront.style.display = 'none';
    resultsCard.style.display = 'block';
    
    // تحديث مؤشر الأمان
    const safetyPercentage = result.safety_score || 0;
    safetyMeter.style.width = safetyPercentage + '%';
    safetyScore.textContent = safetyPercentage + '%';
    
    // تحديث شارة النتيجة
    updateResultBadge(safetyPercentage);
    
    // تحديث قائمة التهديدات
    updateThreatList(result.threats || []);// تحديث التوصيات
    updateRecommendations(result.recommendations || []);
    
    // تأثيرات بصرية
    animateResults();
    
    showNotification('✅ تم فحص الرابط بنجاح', 'success');
}

// تحديث شارة النتيجة
function updateResultBadge(score) {
    let badgeText, badgeColor;
    
    if (score >= 80) {
        badgeText = '🟢 آمن';
        badgeColor = 'var(--success)';
    } else if (score >= 60) {
        badgeText = '🟡 مشبوه';
        badgeColor = 'var(--warning)';
    } else {
        badgeText = '🔴 خطير';
        badgeColor = 'var(--danger)';
    }
    
    resultBadge.textContent = badgeText;
    resultBadge.style.background = badgeColor;
    resultBadge.style.color = 'var(--dark-bg)';
}

// تحديث قائمة التهديدات
function updateThreatList(threats) {
    threatList.innerHTML = '';
    
    if (threats.length === 0) {
        threatList.innerHTML = '<div class="no-threats">✅ لا توجد تهديدات مكتشفة</div>';
        return;
    }
    
    threats.forEach(threat => {
        const threatItem = document.createElement('div');
        threatItem.className = 'threat-item';
        threatItem.innerHTML = `
            <span class="threat-icon">⚠️</span>
            <span class="threat-text">${threat}</span>
        `;
        threatList.appendChild(threatItem);
    });
}

// تحديث التوصيات
function updateRecommendations(recommendations) {
    recommendationsList.innerHTML = '';
    
    const defaultRecommendations = [
        'تأكد من مصدر الرابط قبل النقر',
        'استخدم كلمة مرور قوية',
        'فعّل المصادقة الثنائية',
        'حافظ على تحديث برامج الحماية'
    ];
    
    const finalRecommendations = recommendations.length > 0 ? recommendations : defaultRecommendations;
    
    finalRecommendations.forEach(rec => {
        const recItem = document.createElement('div');
        recItem.className = 'recommendation-item';
        recItem.innerHTML = `
            <span class="rec-icon">💡</span>
            <span class="rec-text">${rec}</span>
        `;
        recommendationsList.appendChild(recItem);
    });
}

// تأثيرات النتائج
function animateResults() {
    const elements = document.querySelectorAll('.threat-item, .recommendation-item');
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.5s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// إعادة تعيين الفحص
function resetScan() {
    cardFront.style.display = 'block';
    resultsCard.style.display = 'none';
    urlInput.value = '';
    urlInput.disabled = false;
    scanBtn.disabled = false;
    scanBtn.innerHTML = '<span class="btn-text">بدء الفحص</span><span class="btn-icon">🚀</span>';
}

// إعادة تعيين واجهة المستخدم
function resetUI() {
    scanBtn.disabled = false;
    scanBtn.innerHTML = '<span class="btn-text">بدء الفحص</span><span class="btn-icon">🚀</span>';
    urlInput.disabled = false;
}

// تحديث الإحصائيات
function updateStats() {
    // في التطبيق الحقيقي، هذه البيانات ستأتي من الخادم
    const newTotal = parseInt(totalScanned.textContent.replace(',', '')) + 1;
    totalScanned.textContent = newTotal.toLocaleString();
}

// عرض الإشعارات
function showNotification(message, type = 'info') {
    // تنفيذ بسيط للإشعارات
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        ${type === 'error' ? 'background: #ff4444;' : ''}
        ${type === 'success' ? 'background: #00ff88; color: #000;' : ''}
        ${type === 'warning' ? 'background: #ffaa00;' : ''}
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}// إضافة أنماط إضافية
const additionalStyles = `
.threat-item, .recommendation-item {
    background: rgba(255, 255, 255, 0.05);
    padding: 0.8rem 1rem;
    margin-bottom: 0.5rem;
    border-radius: 8px;
    border-left: 3px solid var(--primary-green);
    display: flex;
    align-items: center;
    gap: 0.8rem;
}

.threat-item {
    border-left-color: var(--danger);
}

.recommendation-item {
    border-left-color: var(--primary-blue);
}

.no-threats {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
    font-style: italic;
}

.new-scan-btn {
    width: 100%;
    padding: 1rem 2rem;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    color: var(--text-primary);
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 2rem;
}

.new-scan-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
}

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
`;

// إضافة الأنماط الإضافية
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);