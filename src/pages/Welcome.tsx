import { IonContent, IonPage, IonModal } from '@ionic/react';
import React, { useState } from 'react';
import { Dumbbell, X, Mail, Lock, LogIn, UserPlus, User, Camera } from 'lucide-react';
import { useHistory } from 'react-router-dom';
import './Welcome.css';

// 🌟 Import Firebase ของจริงเข้ามาใช้งาน
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const Welcome: React.FC = () => {
  const history = useHistory();
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState(''); 
  const [profileImage, setProfileImage] = useState<string>(''); 
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setProfileImage('');
    setErrorMessage('');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          setProfileImage(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // 🌟 ฟังก์ชัน Login ของจริงผ่าน Firebase
  const handleLogin = async () => {
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    setIsLoading(true);
    
    try {
      const userEmailKey = email.toLowerCase().trim();
      
      // ยืนยันตัวตนกับแผนก รปภ. ของ Firebase
      await signInWithEmailAndPassword(auth, userEmailKey, password);
      
      localStorage.setItem('current_user_email', userEmailKey);
      setShowLoginModal(false);
      history.push('/home');
    } catch (error: any) {
      console.error(error);
      setErrorMessage('อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  // 🌟 ฟังก์ชันสมัครสมาชิกของจริงผ่าน Firebase
  const handleRegister = async () => {
    setErrorMessage('');
    if (!email || !password || !confirmPassword || !displayName) {
      setErrorMessage('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsLoading(true);
    try {
      const userEmailKey = email.toLowerCase().trim();
      
      // 1. สร้างบัญชีผู้ใช้ใน Firebase Authentication
      await createUserWithEmailAndPassword(auth, userEmailKey, password);

      // 2. สร้างแฟ้มประวัติเก็บใน Firestore Database
      await setDoc(doc(db, "users", userEmailKey), {
        name: displayName,
        avatar: profileImage, 
        role: 'Cute User♥',
        email: userEmailKey,
        savedPlaces: [],
        activities: [],
        exploredPlaces: []
      });
      
      // บันทึกสถานะว่าล็อกอินแล้วในเครื่อง
      localStorage.setItem('current_user_email', userEmailKey);

      setShowRegisterModal(false);
      history.push('/home'); 
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('อีเมลนี้ถูกใช้งานไปแล้ว');
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      } else {
        setErrorMessage('เกิดข้อผิดพลาด (ไฟล์รูปอาจใหญ่เกินไป)');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="welcome-page-content">
        <div className="welcome-container">
          <div className="welcome-image-section">
            <div className="welcome-fade"></div>
          </div>
          <div className="welcome-content">
            <div className="welcome-icon-box"><Dumbbell size={32} /></div>
            <h1 className="welcome-title">KKU FitMap</h1>
            <p className="welcome-subtitle">
              ค้นหาสถานที่ออกกำลังกายใกล้คุณ พร้อมเช็คสภาพอากาศและค่าฝุ่นแบบเรียลไทม์
            </p>
            <div className="action-buttons-group">
              <button className="btn-primary" onClick={() => { resetForm(); setShowLoginModal(true); }}>
                <LogIn size={20} className="btn-icon" /><span>เข้าสู่ระบบ</span>
              </button>
              <button className="btn-outline" onClick={() => { resetForm(); setShowRegisterModal(true); }}>
                <UserPlus size={20} className="btn-icon" /><span>สมัครสมาชิกใหม่</span>
              </button>
            </div>
          </div>
        </div>

        {/* Login Modal */}
        <IonModal isOpen={showLoginModal} onDidDismiss={() => { setShowLoginModal(false); resetForm(); }} className="modern-form-modal">
          <div className="modal-scroll-wrapper">
            <div className="modal-form-header">
                <button className="modal-close-btn" onClick={() => setShowLoginModal(false)}><X size={24} /></button>
                <div className="form-header-text">
                    <h2 className="modal-title-modern">เข้าสู่ระบบ</h2>
                </div>
            </div>
            <div className="modal-form-body">
              {errorMessage && <div className="form-error-banner" style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{errorMessage}</div>}
              <div className="form-input-group">
                <Mail size={18} className="input-field-icon" /><input type="email" className="custom-input-modern" placeholder="อีเมล (Email)" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-input-group">
                <Lock size={18} className="input-field-icon" /><input type="password" className="custom-input-modern" placeholder="รหัสผ่าน (Password)" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <button className="save-activity-btn-modern" onClick={handleLogin} disabled={isLoading}><span>{isLoading ? 'กำลังโหลด...' : 'เข้าสู่ระบบ'}</span></button>
            </div>
          </div>
        </IonModal>

        {/* Register Modal */}
        <IonModal isOpen={showRegisterModal} onDidDismiss={() => { setShowRegisterModal(false); resetForm(); }} className="modern-form-modal">
          <div className="modal-scroll-wrapper">
            <div className="modal-form-header">
                <button className="modal-close-btn" onClick={() => setShowRegisterModal(false)}><X size={24} /></button>
                <div className="form-header-text">
                    <h2 className="modal-title-modern">สมัครสมาชิก</h2>
                </div>
            </div>
            <div className="modal-form-body">
              {errorMessage && <div className="form-error-banner" style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{errorMessage}</div>}
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: '#f1f5f9', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                  {profileImage ? <img src={profileImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={40} color="#94a3b8" />}
                </div>
                <label style={{ marginTop: '10px', color: '#10b981', fontWeight: '700', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Camera size={16} /> เลือกรูปจากเครื่อง
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
              </div>

              <div className="form-input-group"><User size={18} className="input-field-icon" /><input type="text" className="custom-input-modern" placeholder="ชื่อที่ต้องการให้แสดง" value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
              <div className="form-input-group"><Mail size={18} className="input-field-icon" /><input type="email" className="custom-input-modern" placeholder="อีเมล (Email)" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="form-input-group"><Lock size={18} className="input-field-icon" /><input type="password" className="custom-input-modern" placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <div className="form-input-group"><Lock size={18} className="input-field-icon" /><input type="password" className="custom-input-modern" placeholder="ยืนยันรหัสผ่าน" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
              <button className="save-activity-btn-modern" onClick={handleRegister} disabled={isLoading}><span>{isLoading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}</span></button>
            </div>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Welcome;