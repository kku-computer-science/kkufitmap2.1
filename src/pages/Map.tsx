import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, useIonViewDidEnter, IonModal, useIonToast, useIonViewWillEnter } from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Star, Heart, X, Users, Clock, Navigation, Phone, Share2 } from 'lucide-react';
import { useHistory } from 'react-router-dom';
import './Map.css';
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

const loadLeaflet = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (window.L) return resolve(window.L);

    if (document.getElementById('leaflet-script')) {
      const interval = setInterval(() => {
        // @ts-ignore
        if (window.L) {
          clearInterval(interval);
          // @ts-ignore
          resolve(window.L);
        }
      }, 100);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.id = 'leaflet-script';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      resolve(window.L);
    };
    script.onerror = () => reject(new Error('ไม่สามารถโหลดแผนที่ได้'));
    document.head.appendChild(script);
  });
};

const MapTab: React.FC = () => {
  const history = useHistory();
  const [presentToast] = useIonToast();
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [userLocation, setUserLocation] = useState({ lat: 16.4743, lng: 102.8231 });
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

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

  const initMapBase = (L: any) => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current).setView([16.4650, 102.8231], 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.featureGroup().addTo(map);
  };

  // 🌟 บันทึกประวัติเข้าดู (Explored) ลง Firebase
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

  const drawMarkers = (L: any) => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    if (userLocation) {
      L.circleMarker([userLocation.lat, userLocation.lng], {
        color: '#fff', fillColor: '#3b82f6', fillOpacity: 1, radius: 8, weight: 2
      }).addTo(markersLayerRef.current).bindPopup('<div style="font-family: Kanit;">คุณอยู่ที่นี่</div>');
    }

    if (places && places.length > 0) {
      const customIcon = L.divIcon({
        className: 'custom-pin',
        html: `<div style="background-color: #10b981; width: 26px; height: 26px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 26]
      });

      places.forEach((place) => {
        if (place.lat && place.lng) {
          const marker = L.marker([place.lat, place.lng], { icon: customIcon });
          marker.on('click', () => {
            setSelectedPlace(place);
            saveExploredPlace(place.id); // 🌟 อัปเดตคลาวด์ 🌟
          });
          marker.addTo(markersLayerRef.current);
        }
      });
    }
  };

  useEffect(() => {
    loadLeaflet().then((L) => {
      initMapBase(L);
      drawMarkers(L);
    }).catch(err => console.error(err));
  }, []);

  useIonViewDidEnter(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize(); 
      }, 150);
    }
  });

  useEffect(() => {
    // @ts-ignore
    if (window.L && mapInstanceRef.current) {
      // @ts-ignore
      drawMarkers(window.L);
    }
  }, [places, userLocation]);

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
            lat = 16.4743; lng = 102.8231; 
          }
          setUserLocation({ lat, lng });
        },
        (error) => console.error("GPS error", error),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    const fetchGooglePlaces = async () => {
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
      } catch (error) {
        console.error("Places error:", error);
      }
    };
    fetchGooglePlaces();
  }, []);

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
      presentToast({ message: 'ก็อปปี้ลิ้งค์เรียบร้อยแล้ว', duration: 2000, color: 'success', position: 'top' });
    });
  };

  const isSelectedPlaceSaved = selectedPlace ? savedPlaces.some(p => p.id === selectedPlace.id) : false;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#10b981' }}>
          <IonTitle style={{ color: 'white', fontWeight: 'bold' }}>แผนที่สถานที่ออกกำลังกาย</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen>
        <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 0 }} />
        
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

      </IonContent>
    </IonPage>
  );
};

export default MapTab;