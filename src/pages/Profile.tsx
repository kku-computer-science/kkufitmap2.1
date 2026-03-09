import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, useIonViewWillEnter, IonModal, useIonAlert } from '@ionic/react';
import React, { useState } from 'react';
import { User, Bookmark, Activity as ActivityIcon, MapPin, ChevronRight, Info, Edit3, X, Dumbbell, LogOut, Camera, Key, Lock } from 'lucide-react';
import { useHistory } from 'react-router-dom';
import './Profile.css';

// 🌟 Import Firebase
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updatePassword, signOut } from 'firebase/auth'; 

const Profile: React.FC = () => {
  const history = useHistory();
  const [presentAlert] = useIonAlert(); 
  const [stats, setStats] = useState({ saved: 0, visited: 0, explored: 0 });
  
  const [userData, setUserData] = useState({ 
    name: 'กำลังโหลด...', 
    avatar: '', 
    role: 'Cute User♥',
    email: '' 
  });
  
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState<string>('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useIonViewWillEnter(() => {
    const email = localStorage.getItem('current_user_email');
    if (!email) {
      history.push('/welcome');
      return;
    }
    loadProfileData(email);
  });

  const loadProfileData = async (userEmail: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userEmail));
      if (userDoc.exists()) {
        const data = userDoc.data();
        
        setUserData({
          name: data.name || 'ผู้ใช้งาน',
          avatar: data.avatar || '',
          role: data.role || 'Cute User♥',
          email: userEmail
        });
        setEditName(data.name || '');
        setEditImage(data.avatar || '');

        // 🌟 ดึงข้อมูลสถิติจาก Firebase ล้วนๆ 🌟
        const savedPlaces = data.savedPlaces || [];
        const activities = data.activities || [];
        const exploredPlaces = data.exploredPlaces || [];
        
        // นับสถานที่ที่ไม่ซ้ำกัน
        const uniqueVisitedLocations = new Set(activities.map((act: any) => act.locationName));

        setStats({
          saved: savedPlaces.length,
          visited: uniqueVisitedLocations.size,
          explored: exploredPlaces.length
        });
      }
    } catch (e) {
      console.error("Error loading profile", e);
    }
  };

  const handleEditFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
          setEditImage(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const userRef = doc(db, "users", userData.email);
      await updateDoc(userRef, {
        name: editName,
        avatar: editImage
      });
      
      setUserData(prev => ({ ...prev, name: editName, avatar: editImage }));
      setShowEditModal(false);
    } catch (error) {
      alert("ไม่สามารถบันทึกได้ เนื่องจากไฟล์รูปใหญ่เกินไป");
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!newPassword || !confirmNewPassword) {
      setPasswordError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    const user = auth.currentUser;
    if (user) {
      try {
        await updatePassword(user, newPassword);
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setShowPasswordModal(false);

        presentAlert({
          header: 'สำเร็จ',
          message: 'เปลี่ยนรหัสผ่านของคุณเรียบร้อยแล้ว',
          buttons: ['ตกลง']
        });
      } catch (error: any) {
        if (error.code === 'auth/requires-recent-login') {
          setPasswordError('เพื่อความปลอดภัย กรุณา Log out แล้วเข้าสู่ระบบใหม่อีกครั้งเพื่อเปลี่ยนรหัสผ่าน');
        } else {
          setPasswordError('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
        }
      }
    } else {
      setPasswordError('ไม่พบเซสชันการยืนยันตัวตน กรุณาล็อกอินใหม่');
    }
  };

  const handleLogOut = () => {
    presentAlert({
      header: 'ออกจากระบบ',
      message: 'คุณต้องการออกจากระบบใช่หรือไม่?',
      buttons: [
        { text: 'ยกเลิก', role: 'cancel', cssClass: 'secondary' },
        { text: 'ยืนยัน', role: 'confirm', handler: async () => {
            await signOut(auth);
            localStorage.removeItem('current_user_email');
            history.push('/welcome');
          }
        },
      ],
    });
  };

  return (
    <IonPage>
      <IonHeader><IonToolbar style={{ '--background': '#10b981' }}><IonTitle style={{ color: 'white', fontWeight: 'bold' }}>โปรไฟล์</IonTitle></IonToolbar></IonHeader>
      <IonContent fullscreen style={{ '--background': '#f8fafc' }}>
        <div className="main-content" style={{ marginTop: '30px', paddingBottom: '40px' }}>
          
          <div className="profile-header">
            <div className="profile-avatar">
              {userData.avatar ? <img src={userData.avatar} alt="profile" style={{ borderRadius: '50%', width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={48} />}
            </div>
            <h1 className="profile-name">{userData.name}</h1>
            <p className="profile-role" style={{ color: '#10b981', fontWeight: 'bold' }}>{userData.role}</p>
          </div>

          <div className="profile-stats-grid">
            <div className="profile-stat-box">
              <Bookmark size={24} color="#10b981" className="stat-icon" /><h3 className="stat-number">{stats.saved}</h3><span className="stat-label-small">Saved</span>
            </div>
            <div className="profile-stat-box">
              <ActivityIcon size={24} color="#10b981" className="stat-icon" /><h3 className="stat-number">{stats.visited}</h3><span className="stat-label-small">Visited</span>
            </div>
            <div className="profile-stat-box">
              <MapPin size={24} color="#10b981" className="stat-icon" /><h3 className="stat-number">{stats.explored}</h3><span className="stat-label-small">Explored</span>
            </div>
          </div>

          <div className="profile-menu-list">
            <div className="profile-menu-item" onClick={() => setShowEditModal(true)}>
              <div className="menu-item-left"><Edit3 size={20} color="#64748b" /><span>แก้ไขโปรไฟล์</span></div><ChevronRight size={20} color="#cbd5e1" />
            </div>

            <div className="profile-menu-item" onClick={() => {
              setOldPassword(''); setNewPassword(''); setConfirmNewPassword(''); setPasswordError(''); setShowPasswordModal(true);
            }}>
              <div className="menu-item-left"><Key size={20} color="#64748b" /><span>เปลี่ยนรหัสผ่าน</span></div><ChevronRight size={20} color="#cbd5e1" />
            </div>

            <div className="profile-menu-item" onClick={() => setShowAboutModal(true)}>
              <div className="menu-item-left"><Info size={20} color="#64748b" /><span>เกี่ยวกับ KKU FitMap</span></div><ChevronRight size={20} color="#cbd5e1" />
            </div>
            <div className="profile-menu-item" onClick={handleLogOut}>
              <div className="menu-item-left"><LogOut size={20} color="#ef4444" /><span style={{ color: '#ef4444' }}>ออกจากระบบ</span></div>
            </div>
          </div>
        </div>
      </IonContent>

      <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)} className="modern-form-modal">
         <div style={{ padding: '30px 24px' }}>
            <h2 className="modal-title-modern">แก้ไขโปรไฟล์</h2>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
               <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #10b981' }}>
                  {editImage ? <img src={editImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={40} />}
               </div>
               <label style={{ marginTop: '10px', color: '#10b981', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                  เปลี่ยนรูปถ่าย <input type="file" accept="image/*" onChange={handleEditFileChange} style={{ display: 'none' }} />
               </label>
            </div>
            <div className="form-input-group">
               <input type="text" className="custom-input-modern" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="ระบุชื่อใหม่" />
            </div>
            <button className="save-activity-btn-modern" onClick={handleUpdateProfile}>บันทึกข้อมูล</button>
            <button onClick={() => setShowEditModal(false)} style={{ width: '100%', marginTop: '10px', background: 'none', color: '#94a3b8', border: 'none' }}>ยกเลิก</button>
         </div>
      </IonModal>

      <IonModal isOpen={showPasswordModal} onDidDismiss={() => setShowPasswordModal(false)} className="modern-form-modal">
         <div style={{ padding: '30px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
               <h2 className="modal-title-modern" style={{ margin: 0 }}>เปลี่ยนรหัสผ่าน</h2>
               <button onClick={() => setShowPasswordModal(false)} style={{ background: 'none', border: 'none' }}><X size={24} color="#64748b" /></button>
            </div>

            {passwordError && <div className="form-error-banner" style={{ color: '#ef4444', textAlign: 'center', marginBottom: '15px', fontSize: '14px', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '8px' }}>{passwordError}</div>}

            <div className="form-input-group" style={{ marginBottom: '15px' }}>
               <Lock size={18} className="input-field-icon" />
               <input type="password" className="custom-input-modern" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="รหัสผ่านเดิม" />
            </div>
            <div className="form-input-group" style={{ marginBottom: '15px' }}>
               <Lock size={18} className="input-field-icon" />
               <input type="password" className="custom-input-modern" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)" />
            </div>
            <div className="form-input-group" style={{ marginBottom: '20px' }}>
               <Lock size={18} className="input-field-icon" />
               <input type="password" className="custom-input-modern" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="ยืนยันรหัสผ่านใหม่" />
            </div>

            <button className="save-activity-btn-modern" onClick={handleChangePassword}>อัปเดตรหัสผ่าน</button>
         </div>
      </IonModal>

      <IonModal isOpen={showAboutModal} onDidDismiss={() => setShowAboutModal(false)} className="modern-form-modal">
        <div style={{ padding: '40px 24px', textAlign: 'center', position: 'relative' }}>
          <button onClick={() => setShowAboutModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={28} color="#64748b" />
          </button>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#dcfce7', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Dumbbell size={40} color="#10b981" />
            </div>
          </div>
          
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '10px' }}>KKU FitMap</h2>
          <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '15px' }}>
            แอปพลิเคชันสำหรับค้นหาสถานที่ออกกำลังกายรอบมหาวิทยาลัยขอนแก่น พร้อมบันทึกสถิติและประวัติกิจกรรมของคุณ
          </p>
          <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '30px' }}>เวอร์ชัน 1.0.0</p>
        </div>
      </IonModal>

    </IonPage>
  );
};

export default Profile;