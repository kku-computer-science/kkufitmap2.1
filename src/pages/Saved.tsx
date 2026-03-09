import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, useIonViewWillEnter, IonModal, useIonToast } from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { MapPin, Star, HeartCrack, Heart, X, Users, Clock, Navigation, Phone, Share2 } from 'lucide-react';
import { useHistory } from 'react-router-dom';
import './Home.css'; 

// 🌟 Import Firebase 🌟
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface Place {
  id: string;
  name: string;
  address: string;
  rating: number;
  imageUrl: string;
  category?: 'outdoor' | 'indoor' | 'unknown';
  lat?: number;        
  lng?: number;        
  openHours?: string;  
}

const Saved: React.FC = () => {
  const history = useHistory(); 
  const [presentToast] = useIonToast(); 
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(''); 
  const [userLocation, setUserLocation] = useState({ lat: 16.4743, lng: 102.8231 }); 

  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // 🌟 โหลดข้อมูลตอนเปิดหน้านี้
  useIonViewWillEnter(() => {
    const email = localStorage.getItem('current_user_email');
    if (!email) {
      history.push('/welcome');
      return;
    }
    setCurrentUserEmail(email);
    fetchSavedPlacesFromFirebase(email); // ดึงจากคลาวด์
  });

  const fetchSavedPlacesFromFirebase = async (email: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", email));
      if (userDoc.exists()) {
        setSavedPlaces(userDoc.data().savedPlaces || []);
      }
    } catch (e) {
      console.error("Error fetching saved places:", e);
    }
  };

  useEffect(() => {
    const getDistanceNum = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; 
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 0.5 - Math.cos(dLat)/2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * (1 - Math.cos(dLon))/2;
      return R * 2 * Math.asin(Math.sqrt(a));
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          let lat = position.coords.latitude;
          let lng = position.coords.longitude;
          
          if (getDistanceNum(lat, lng, 16.4743, 102.8231) > 150) {
            lat = 16.4743;
            lng = 102.8231;
          }
          setUserLocation({ lat, lng });
        },
        (error) => console.error("GPS access denied in Saved", error),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // 🌟 ฟังก์ชันลบสถานที่และอัปเดตลง Firebase 🌟
  const removeSaved = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); 
    const updated = savedPlaces.filter(p => p.id !== id);
    setSavedPlaces(updated); // อัปเดตหน้าจอทันที
    
    if (selectedPlace && selectedPlace.id === id) {
      setSelectedPlace(null);
    }

    try {
      // ส่งคำสั่งลบไปอัปเดตบนคลาวด์
      await updateDoc(doc(db, "users", currentUserEmail), {
        savedPlaces: updated
      });
    } catch (error) {
      console.error("Error removing saved place", error);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2?: number, lon2?: number) => {
    if (!lat2 || !lon2) return 'ไม่ทราบระยะทาง';
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 0.5 - Math.cos(dLat)/2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * (1 - Math.cos(dLon))/2;
    const d = R * 2 * Math.asin(Math.sqrt(a));
    return d.toFixed(1) + ' km';
  };

  const handleShare = (place: Place) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " " + place.address)}`;
    navigator.clipboard.writeText(url).then(() => {
      presentToast({
        message: 'ก็อปปี้ลิ้งค์เรียบร้อยแล้ว',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#10b981' }}>
          <IonTitle style={{ color: 'white', fontWeight: 'bold' }}>สถานที่ที่บันทึกไว้</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen style={{ '--background': '#f8fafc' }}>
        <div className="main-content" style={{ marginTop: '20px', paddingBottom: '40px' }}>
          
          {savedPlaces.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '100px', color: '#94a3b8' }}>
              <HeartCrack size={64} style={{ margin: '0 auto', marginBottom: '20px', opacity: 0.5 }} />
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#475569' }}>ยังไม่มีสถานที่ที่ถูกใจ</h2>
              <p style={{ fontSize: '14px' }}>กดรูปหัวใจในหน้าแรกเพื่อบันทึกสถานที่ที่คุณชอบไว้ที่นี่</p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#1e293b' }}>
                รายการโปรดของคุณ ({savedPlaces.length})
              </h2>
              
              <div className="places-grid">
                {savedPlaces.map((place) => (
                  <div 
                    key={place.id} 
                    className="place-card interactive-card" 
                    style={{ position: 'relative' }}
                    onClick={() => setSelectedPlace(place)}
                  >
                    
                    <div className="like-btn" onClick={(e) => removeSaved(place.id, e)}>
                      <Heart size={20} color="#ef4444" fill="#ef4444" />
                    </div>

                    <div 
                      className="place-image-placeholder" 
                      style={{ 
                        backgroundImage: `url(${place.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="rating-badge"><Star size={14} fill="#F59E0B" color="#F59E0B" /> {place.rating}</div>
                    </div>
                    
                    <div className="place-details">
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', color: '#1E293B' }}>{place.name}</h3>
                      
                      <div className="address-row">
                        <div className="address-icon">
                          <MapPin size={14} />
                        </div>
                        <span className="address-text">
                          {place.address}
                        </span>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </IonContent>

      <IonModal isOpen={!!selectedPlace} onDidDismiss={() => setSelectedPlace(null)} className="place-detail-modal">
        <IonContent className="custom-modal-content">
          {selectedPlace && (
            <div>
              <div className="modal-hero-section">
                <img src={selectedPlace.imageUrl} alt={selectedPlace.name} className="modal-hero-image" />
                
                <div className="modal-floating-actions">
                  <button className="circle-btn" onClick={(e) => removeSaved(selectedPlace.id, e)}>
                    <Heart size={22} color="#ef4444" fill="#ef4444" />
                  </button>
                  <button className="circle-btn" onClick={() => setSelectedPlace(null)}>
                    <X size={22} color="#64748b" />
                  </button>
                </div>
              </div>

              <div className="modal-body-padded">
                <span className="category-badge">
                  {selectedPlace.category === 'indoor' ? 'ฟิตเนสในร่ม (Indoor)' : 'พื้นที่ออกกำลังกาย'}
                </span>

                <h1 className="modal-title">{selectedPlace.name}</h1>
                <p className="modal-subtitle">ขอนแก่น (Khon Kaen)</p>

                <div className="modal-stats-row">
                  <div className="rating-pill-green">
                    <Star size={14} fill="#16a34a" /> {selectedPlace.rating} 
                    <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#15803d' }}>(Reviews)</span>
                  </div>
                  <div className="popularity-text">
                    <Users size={16} /> 85% popular
                  </div>
                </div>

                <div className="quick-info-grid">
                  <div className="info-box">
                    <MapPin size={20} color="#10b981" />
                    <div className="info-text-group">
                      <p className="info-label">Distance</p>
                      <p className="info-value">{calculateDistance(userLocation.lat, userLocation.lng, selectedPlace.lat, selectedPlace.lng)}</p>
                    </div>
                  </div>
                  <div className="info-box">
                    <Clock size={20} color="#10b981" />
                    <div className="info-text-group">
                      <p className="info-label">Open Hours</p>
                      <p className="info-value">{selectedPlace.openHours || '10.00-22.00'}</p>
                    </div>
                  </div>
                </div>

                <div className="modal-section">
                  <h3 className="section-title">About</h3>
                  <p className="section-desc">
                    สถานที่ออกกำลังกายที่เพียบพร้อมไปด้วยอุปกรณ์และพื้นที่ที่เหมาะสมสำหรับการดูแลสุขภาพของคุณ {selectedPlace.name} เปิดให้บริการสำหรับทุกคนที่ต้องการฟิตร่างกายในบรรยากาศที่ดี
                  </p>
                </div>

                <div className="bottom-action-bar">
                  <button 
                    className="action-btn"
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.name + " " + selectedPlace.address)}`, '_blank')}
                  >
                    <Navigation size={22} color="#10b981" />
                    <span>Directions</span>
                  </button>
                  <button className="action-btn">
                    <Phone size={22} color="#10b981" />
                    <span>Call</span>
                  </button>

                  <button className="action-btn" onClick={() => handleShare(selectedPlace)}>
                    <Share2 size={22} color="#10b981" />
                    <span>Share</span>
                  </button>
                </div>

              </div>
            </div>
          )}
        </IonContent>
      </IonModal>

    </IonPage>
  );
};

export default Saved;