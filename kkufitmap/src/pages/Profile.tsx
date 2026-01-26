import React from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar, 
  IonButtons, 
  IonButton, 
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel
} from '@ionic/react';
import { 
  createOutline, 
  bookmark, 
  footsteps, 
  location, 
  heart, 
  informationCircle, 
  settings 
} from 'ionicons/icons';
import './Profile.css'; // อย่าลืม import css ที่เราเพิ่งสร้าง

const Profile: React.FC = () => {
  return (
    <IonPage>
      {/* ส่วนหัวสีเขียว */}
      <IonHeader>
        <IonToolbar className="profile-toolbar">
          <IonTitle className="profile-title">Profile</IonTitle>
          <IonButtons slot="end">
            <IonButton>
              <IonIcon icon={createOutline} slot="icon-only" style={{color: 'black'}} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding" color="light">
        
        {/* ส่วนรูปโปรไฟล์และชื่อ */}
        <div className="profile-section">
          <div className="avatar-container">
            {/* ใส่รูป placeholder ไว้ก่อน */}
            <img 
              src="https://ionicframework.com/docs/img/demos/avatar.svg" 
              alt="Jane Doe" 
              className="avatar-image"
            />
          </div>
          <h2 className="user-name">Jane Doe</h2>
          <p className="user-role">KKU Student</p>
        </div>

        {/* ส่วนแสดงสถิติ (Saved, Visited, Explored) */}
        <IonGrid>
          <IonRow>
            <IonCol size="4">
              <div className="stats-card">
                <IonIcon icon={bookmark} className="stat-icon" />
                <span className="stat-number">12</span>
                <span className="stat-label">Saved</span>
              </div>
            </IonCol>
            <IonCol size="4">
              <div className="stats-card">
                <IonIcon icon={footsteps} className="stat-icon" />
                <span className="stat-number">8</span>
                <span className="stat-label">Visited</span>
              </div>
            </IonCol>
            <IonCol size="4">
              <div className="stats-card">
                <IonIcon icon={location} className="stat-icon" />
                <span className="stat-number">24</span>
                <span className="stat-label">Explored</span>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* เมนูรายการต่างๆ */}
        <IonList lines="none" className="menu-list">
          
          <IonItem detail={true} className="menu-item" button>
            <IonIcon icon={heart} slot="start" color="success" className="menu-icon" />
            <IonLabel>
              <h3>Saved Places</h3>
            </IonLabel>
          </IonItem>

          <IonItem detail={true} className="menu-item" button>
            <IonIcon icon={informationCircle} slot="start" color="medium" className="menu-icon" />
            <IonLabel>
              <h3>About KKU FitMap</h3>
            </IonLabel>
          </IonItem>

          <IonItem detail={true} className="menu-item" button>
            <IonIcon icon={settings} slot="start" color="medium" className="menu-icon" />
            <IonLabel>
              <h3>Settings</h3>
            </IonLabel>
          </IonItem>

        </IonList>

      </IonContent>
    </IonPage>
  );
};

export default Profile;