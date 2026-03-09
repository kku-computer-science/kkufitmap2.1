import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, useIonViewWillEnter, useIonToast } from '@ionic/react';
import { Search, CloudSun, MapPin, Star, Heart, X, Sun, CloudRain, Users, Clock, Navigation, Phone, Share2 } from 'lucide-react';
import { useHistory } from 'react-router-dom'; 
import './Home.css';

// 🌟 Import Firebase
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface Place {
  id: string;
  name: string;
  address: string;
  rating: number;
  imageUrl: string;
  category: 'outdoor' | 'indoor' | 'unknown';
  lat?: number;        
  lng?: number;        
  openHours?: string;  
}

const HomeTab: React.FC = () => {
  const history = useHistory(); 
  const [presentToast] = useIonToast(); 
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(''); 

  const [activeTab, setActiveTab] = useState<'all' | 'outdoor' | 'indoor'>('all');
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [userLocation, setUserLocation] = useState({ lat: 16.4743, lng: 102.8231 });

  const [weather, setWeather] = useState({
    temp: 0,
    description: 'กำลังโหลด...',
    location: 'กำลังหาตำแหน่ง...',
    aqi: 0,
    icon: <CloudSun size={54} color="white" />
  });

  const currentDate = new Date().toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);

  useIonViewWillEnter(() => {
    const email = localStorage.getItem('current_user_email');
    if (!email) {
      history.push('/welcome');
      return;
    }
    setCurrentUserEmail(email);
    fetchSavedPlacesFromFirebase(email); // 🌟 โหลดจาก Firebase
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

  // 🌟 บันทึก/ยกเลิก สถานที่โปรด ลง Firebase
  const toggleSave = async (place: Place, e: React.MouseEvent) => {
    e.stopPropagation();
    let updatedSaved = [...savedPlaces];
    const isAlreadySaved = updatedSaved.some(p => p.id === place.id);
    
    if (isAlreadySaved) {
      updatedSaved = updatedSaved.filter(p => p.id !== place.id);
    } else {
      updatedSaved = [place, ...updatedSaved];
    }
    
    setSavedPlaces(updatedSaved);

    try {
      await updateDoc(doc(db, "users", currentUserEmail), {
        savedPlaces: updatedSaved
      });
    } catch (error) {
      console.error("Error updating save status", error);
    }
  };

  // 🌟 บันทึกประวัติการกดเข้าไปดู (Explored) ลง Firebase
  const saveExploredPlace = async (placeId: string) => {
    try {
      const userRef = doc(db, "users", currentUserEmail);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        let explored = userDoc.data().exploredPlaces || [];
        if (!explored.includes(placeId)) {
          explored.push(placeId);
          await updateDoc(userRef, { exploredPlaces: explored });
        }
      }
    } catch (error) {
      console.error("Error saving explored places", error);
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

  const getDistanceNum = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 0.5 - Math.cos(dLat)/2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * (1 - Math.cos(dLon))/2;
    return R * 2 * Math.asin(Math.sqrt(a));
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

  useEffect(() => {
    const fetchWeatherAndLocation = async (lat: number, lon: number, fallbackLocation: string) => {
      try {
        let currentLocationName = fallbackLocation;
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=th`);
          const geoData = await geoRes.json();
          if (geoData && geoData.address) {
            const district = geoData.address.county || geoData.address.city || geoData.address.town || '';
            const province = geoData.address.state || geoData.address.province || '';
            if (district || province) {
              const formatDist = district.replace('อำเภอ', 'อ.');
              const formatProv = province.replace('จังหวัด', 'จ.');
              currentLocationName = `${formatDist}, ${formatProv}`.replace(/^, /, '').replace(/, $/, '');
            }
          }
        } catch (error) { console.error("Geocoding error:", error); }

        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`);
        const weatherData = await weatherRes.json();
        
        const aqiRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`);
        const aqiData = await aqiRes.json();

        const code = weatherData.current.weather_code;
        let desc = 'ท้องฟ้าแจ่มใส';
        let weatherIcon = <Sun size={54} color="white" />;
        if (code > 0 && code <= 3) { desc = 'มีเมฆบางส่วน'; weatherIcon = <CloudSun size={54} color="white" />; }
        if (code >= 45 && code <= 48) { desc = 'มีหมอก'; weatherIcon = <CloudSun size={54} color="white" />; }
        if (code >= 51 && code <= 67) { desc = 'ฝนตก'; weatherIcon = <CloudRain size={54} color="white" />; }
        if (code >= 80) { desc = 'ฝนตกหนัก'; weatherIcon = <CloudRain size={54} color="white" />; }

        setWeather({
          temp: Math.round(weatherData.current.temperature_2m),
          description: desc,
          location: currentLocationName,
          aqi: Math.round(aqiData.current.us_aqi),
          icon: weatherIcon
        });
      } catch (error) { console.error("Weather error:", error); }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          let lat = position.coords.latitude;
          let lng = position.coords.longitude;
          const distFromKKU = getDistanceNum(lat, lng, 16.4743, 102.8231);
          if (distFromKKU > 150) {
            lat = 16.4743; lng = 102.8231;
            fetchWeatherAndLocation(lat, lng, 'อ.เมืองขอนแก่น (ตำแหน่งจำลอง)');
          } else {
            fetchWeatherAndLocation(lat, lng, 'ตำแหน่งปัจจุบัน');
          }
          setUserLocation({ lat, lng });
        },
        (error) => {
          fetchWeatherAndLocation(16.4743, 102.8231, 'ม.ขอนแก่น (KKU)');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      fetchWeatherAndLocation(16.4743, 102.8231, 'ม.ขอนแก่น (KKU)');
    }
  }, []);

  useEffect(() => {
    const fetchGooglePlaces = async () => {
      setIsLoading(true);
      try {
        const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        const url = 'https://places.googleapis.com/v1/places:searchText';
        const keywords = [
          "ฟิตเนส กังสดาล ขอนแก่น", "ฟิตเนส หลังมอ ขอนแก่น", "ฟิตเนส โนนม่วง ขอนแก่น", 
          "KKU Fitness", "สนามกีฬา มหาวิทยาลัยขอนแก่น", "บึงสีฐาน ขอนแก่น", "สระว่ายน้ำ ขอนแก่น"
        ];

        const fetchPromises = keywords.map(keyword => {
          return fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': GOOGLE_API_KEY,
              'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.types,places.photos,places.location,places.regularOpeningHours'
            },
            body: JSON.stringify({ textQuery: keyword, languageCode: "th" })
          }).then(res => res.json());
        });

        const results = await Promise.all(fetchPromises);
        let allRawPlaces: any[] = [];
        results.forEach(apiData => {
          if (apiData && apiData.places) allRawPlaces = [...allRawPlaces, ...apiData.places];
        });

        const uniquePlaces = Array.from(new Map(allRawPlaces.map(item => [item.id, item])).values());

        if (uniquePlaces.length > 0) {
          const realPlaces: Place[] = uniquePlaces.map((place: any) => {
            const types = place.types || [];
            let placeCategory: 'outdoor' | 'indoor' | 'unknown' = 'outdoor'; 
            if (types.includes('gym')) placeCategory = 'indoor';

            let photoUrl = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=400';
            if (place.photos && place.photos.length > 0) {
              photoUrl = `https://places.googleapis.com/v1/${place.photos[0].name}/media?key=${GOOGLE_API_KEY}&maxHeightPx=400&maxWidthPx=400`;
            }

            let openHoursStr = '10.00-22.00';
            if (place.regularOpeningHours && place.regularOpeningHours.weekdayDescriptions) {
              const day = new Date().getDay();
              const googleDayIndex = day === 0 ? 6 : day - 1; 
              const desc = place.regularOpeningHours.weekdayDescriptions[googleDayIndex];
              if (desc) {
                const timeParts = desc.split(': ');
                if (timeParts.length > 1) openHoursStr = timeParts.slice(1).join(': ');
              }
            }

            return {
              id: place.id,
              name: place.displayName?.text || 'ไม่ทราบชื่อสถานที่',
              address: place.formattedAddress || 'ขอนแก่น',
              rating: place.rating || 4.5,
              imageUrl: photoUrl,
              category: placeCategory,
              lat: place.location?.latitude,   
              lng: place.location?.longitude,  
              openHours: openHoursStr          
            };
          });
          setPlaces(realPlaces);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Places error:", error);
        setIsLoading(false);
      }
    };
    fetchGooglePlaces();
  }, []);

  const filteredPlaces = places.filter(place => {
    const matchesTab = activeTab === 'all' || place.category === activeTab;
    const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          place.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  }).sort((a, b) => {
    const aSaved = savedPlaces.some(p => p.id === a.id);
    const bSaved = savedPlaces.some(p => p.id === b.id);
    if (aSaved && !bSaved) return -1; 
    if (!aSaved && bSaved) return 1;  
    return 0; 
  });

  const isSelectedPlaceSaved = selectedPlace ? savedPlaces.some(p => p.id === selectedPlace.id) : false;

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="app-container">
          
          <header className="soft-header">
            <div className="header-top">
              <h1>KKU FitMap</h1>
              <div className="weather-badge">{weather.temp}°C | AQI {weather.aqi}</div>
            </div>
            <div className="search-container">
              <input 
                type="text" 
                placeholder="ค้นหาสถานที่ออกกำลังกาย..." 
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="search-icon" size={20} />
            </div>
          </header>

          <main className="main-content">
            <section className="weather-card interactive-card">
              <div className="weather-info">
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', opacity: 0.9 }}>{currentDate}</p>
                <p style={{ margin: 0, opacity: 0.9, fontWeight: 500 }}>{weather.location}</p>
                <div className="temp-display">
                  <span style={{ fontSize: '42px', fontWeight: 'bold' }}>{weather.temp}°</span>
                  <span style={{ fontSize: '16px', opacity: 0.9 }}>{weather.description}</span>
                </div>
              </div>
              {weather.icon}
            </section>

            <section className="category-filter">
              <button className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>สถานที่ทั้งหมด</button>
              <button className={`filter-btn ${activeTab === 'outdoor' ? 'active' : ''}`} onClick={() => setActiveTab('outdoor')}>กลางแจ้ง</button>
              <button className={`filter-btn ${activeTab === 'indoor' ? 'active' : ''}`} onClick={() => setActiveTab('indoor')}>ในร่ม</button>
            </section>

            <section className="places-section">
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
                {searchQuery !== '' ? 'ผลการค้นหา' : 'สถานที่แนะนำ'}
              </h2>
              
              <div className="places-grid">
                {isLoading ? ( <p>กำลังโหลด...</p> ) : (
                  filteredPlaces.map((place) => {
                    const isSaved = savedPlaces.some(p => p.id === place.id);
                    return (
                      <div 
                        key={place.id} 
                        className="place-card interactive-card" 
                        onClick={() => {
                          saveExploredPlace(place.id); // 🌟 ใช้ฟังก์ชัน Firebase 🌟
                          setSelectedPlace(place);
                        }} 
                        style={{ position: 'relative', cursor: 'pointer' }}
                      >
                        <div className="like-btn" onClick={(e) => toggleSave(place, e)}>
                          <Heart size={20} color={isSaved ? "#ef4444" : "#94a3b8"} fill={isSaved ? "#ef4444" : "none"} />
                        </div>
                        <div className="place-image-placeholder" style={{ backgroundImage: `url(${place.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
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
                    )
                  })
                )}
              </div>
            </section>
          </main>
        </div>
      </IonContent>

      <IonModal isOpen={!!selectedPlace} onDidDismiss={() => setSelectedPlace(null)} className="place-detail-modal">
        <IonContent className="custom-modal-content">
          {selectedPlace && (
            <div>
              <div className="modal-hero-section">
                <img src={selectedPlace.imageUrl} alt={selectedPlace.name} className="modal-hero-image" />
                
                <div className="modal-floating-actions">
                  <button className="circle-btn" onClick={(e) => toggleSave(selectedPlace, e)}>
                    <Heart size={22} color={isSelectedPlaceSaved ? "#ef4444" : "#64748b"} fill={isSelectedPlaceSaved ? "#ef4444" : "none"} />
                  </button>
                  <button className="circle-btn" onClick={() => setSelectedPlace(null)}>
                    <X size={22} color="#64748b" />
                  </button>
                </div>
              </div>

              <div className="modal-body-padded">
                
                <span className="category-badge">
                  {selectedPlace.category === 'indoor' ? 'ฟิตเนสในร่ม (Indoor)' : 'พื้นที่กลางแจ้ง (Outdoor)'}
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
                      <p className="info-value">{selectedPlace.openHours}</p>
                    </div>
                  </div>
                </div>

                <div className="modal-section">
                  <h3 className="section-title">About</h3>
                  <p className="section-desc">
                    สถานที่ออกกำลังกายที่เพียบพร้อมไปด้วยอุปกรณ์และพื้นที่ที่เหมาะสมสำหรับการดูแลสุขภาพของคุณ {selectedPlace.name} เปิดให้บริการสำหรับทุกคนที่ต้องการฟิตร่างกายในบรรยากาศที่ดี
                  </p>
                </div>

                <div className="modal-section">
                  <h3 className="section-title">Amenities</h3>
                  <div className="amenities-flex">
                    <span className="amenity-tag">อุปกรณ์ครบครัน</span>
                    <span className="amenity-tag">พื้นที่กว้างขวาง</span>
                    {selectedPlace.category === 'indoor' ? <span className="amenity-tag">เครื่องปรับอากาศ</span> : <span className="amenity-tag">บรรยากาศธรรมชาติ</span>}
                    <span className="amenity-tag">ที่จอดรถ</span>
                  </div>
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

export default HomeTab;