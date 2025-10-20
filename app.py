from flask import Flask, render_template, request, jsonify
from flask_cors import CORS  # إضافة هذه المكتبة
import re
import requests
from urllib.parse import urlparse
import time
from datetime import datetime

app = Flask(__name__)
CORS(app)  # إضافة هذا السطر

class LinkGuardian:
    def __init__(self):
        self.trusted_domains = [
            'google.com', 'youtube.com', 'facebook.com', 'twitter.com',
            'instagram.com', 'linkedin.com', 'github.com', 'microsoft.com',
            'apple.com', 'amazon.com', 'example.com'  # أضفت example.com للاختبار
        ]
        
        self.suspicious_keywords = [
            'login', 'signin', 'verify', 'account', 'password', 'banking',
            'paypal', 'ebay', 'amazon', 'secure', 'update', 'confirm'
        ]
        
        self.shortener_domains = [
            'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd'
        ]

    def analyze_url(self, url):
        """تحليل شامل للرابط"""
        try:
            # إصلاح: إضافة scheme إذا لم يكن موجوداً
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url
            
            parsed_url = urlparse(url)
            domain = parsed_url.netloc.lower()
            
            analysis = {
                'url': url,
                'domain': domain,
                'safety_score': 100,
                'threats': [],
                'recommendations': [],
                'analysis_time': datetime.now().isoformat(),
                'status': 'success'  # إضافة حقل status
            }
            
            # التحقق من النطاقات الموثوقة
            if self.is_trusted_domain(domain):
                analysis['safety_score'] = 95
                analysis['recommendations'].append('النطاق معروف وموثوق')
            else:
                analysis['safety_score'] -= 10
                analysis['threats'].append('النطاق غير معروف')
            
            # الكشف عن الروابط المختصرة
            if self.is_shortened_url(domain):
                analysis['safety_score'] -= 30
                analysis['threats'].append('رابط مختصر - قد يخفي عنواناً خبيثاً')
                analysis['recommendations'].append('تجنب فتح الروابط المختصرة من مصادر غير موثوقة')
            
            # الكشف عن الكلمات المشبوهة
            suspicious_words = self.detect_suspicious_keywords(url)
            if suspicious_words:
                analysis['safety_score'] -= len(suspicious_words) * 10
                analysis['threats'].append(f'يحتوي على كلمات مشبوهة: {", ".join(suspicious_words)}')
            
            # فحص طول الرابط
            if len(url) > 100:
                analysis['safety_score'] -= 15
                analysis['threats'].append('الرابط طويل جداً - قد يكون احتيالياً')
            
            # فحص وجود @ في الرابط
            if '@' in url:
                analysis['safety_score'] -= 25
                analysis['threats'].append('الرابط يحتوي على @ - تقنية تصيد شائعة')
            
            # ضمان أن النتيجة بين 0 و 100
            analysis['safety_score'] = max(0, min(100, analysis['safety_score']))
            
            # إضافة توصيات عامة
            if analysis['safety_score'] < 70:
                analysis['recommendations'].append('نوصي بعدم فتح هذا الرابط')
                analysis['recommendations'].append('تحقق من مصدر الرابط قبل الاستخدام')
            else:
                analysis['recommendations'].append('الرابط يبدو آمناً للاستخدام')
            
            return analysis
            
        except Exception as e:
            return {
                'error': f'خطأ في تحليل الرابط: {str(e)}',
                'analysis_time': datetime.now().isoformat(),
                'status': 'error'
            }
    
    def is_trusted_domain(self, domain):
        """التحقق إذا كان النطاق موثوقاً"""
        for trusted in self.trusted_domains:
            if trusted in domain:
                return True
        return False
    
    def is_shortened_url(self, domain):
        """الكشف عن الروابط المختصرة"""
        for shortener in self.shortener_domains:
            if shortener in domain:
                return True
        return False
    
    def detect_suspicious_keywords(self, url):
        """كشف الكلمات المشبوهة في الرابط"""
        found_keywords = []
        for keyword in self.suspicious_keywords:
            if keyword.lower() in url.lower():
                found_keywords.append(keyword)
        return found_keywords

# تهيئة المحلل
guardian = LinkGuardian()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/scan', methods=['POST'])
def scan_url():
    try:
        # إضافة طباعة للتصحيح
        print("📨 Received scan request")
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'لم يتم تقديم بيانات', 'status': 'error'}), 400
        
        url = data.get('url', '').strip()
        print(f"🔍 Scanning URL: {url}")
        
        if not url:
            return jsonify({'error': 'لم يتم تقديم رابط', 'status': 'error'}), 400
        
        # محاكاة وقت المعالجة
        time.sleep(1)
        
        # تحليل الرابط
        result = guardian.analyze_url(url)
        print(f"✅ Scan result: {result}")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({'error': f'خطأ في الخادم: {str(e)}', 'status': 'error'}), 500

@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'LinkGuardian Pro',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("🚀 تشغيل LinkGuardian Pro...")
    print("🎯 أداة كشف الروابط الملغومة")
    print("🌐 الخادم يعمل على: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)