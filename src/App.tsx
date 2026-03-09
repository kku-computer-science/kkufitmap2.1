/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import {
  IonApp,
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';

import {
  homeOutline,
  mapOutline,
  bookmarkOutline,
  pulseOutline,
  personOutline
} from 'ionicons/icons';

// Import หน้าทั้งหมด
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import Map from './pages/Map';
import Saved from './pages/Saved';
import Activity from './pages/Activity';
import Profile from './pages/Profile';
import "./theme/variables.css";

setupIonicReact();

// 🌟 1. แยกส่วนของ Tabs ออกมาเป็น Component ต่างหาก
const MainTabs: React.FC = () => {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/home" component={Home} />
        <Route exact path="/map" component={Map} />
        <Route exact path="/saved" component={Saved} />
        <Route exact path="/activity" component={Activity} />
        <Route exact path="/profile" component={Profile} />
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="home" href="/home">
          <IonIcon icon={homeOutline} />
          <IonLabel>HOME</IonLabel>
        </IonTabButton>

        <IonTabButton tab="map" href="/map">
          <IonIcon icon={mapOutline} />
          <IonLabel>MAP</IonLabel>
        </IonTabButton>

        <IonTabButton tab="saved" href="/saved">
          <IonIcon icon={bookmarkOutline} />
          <IonLabel>SAVED</IonLabel>
        </IonTabButton>

        <IonTabButton tab="activity" href="/activity">
          <IonIcon icon={pulseOutline} />
          <IonLabel>Activity</IonLabel>
        </IonTabButton>

        <IonTabButton tab="profile" href="/profile">
          <IonIcon icon={personOutline} />
          <IonLabel>PROFILE</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

// 🌟 2. ตัวควบคุมหน้าจอหลักของแอป
const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        
        {/* หน้า Welcome (จะไม่มีแถบเมนูด้านล่างเพราะไม่ได้อยู่ใน MainTabs) */}
        <Route exact path="/welcome" component={Welcome} />

        {/* หน้าอื่นๆ ทั้งหมดที่มีแถบเมนูด้านล่าง ให้วิ่งไปใช้ MainTabs */}
        <Route path={["/home", "/map", "/saved", "/activity", "/profile"]} component={MainTabs} />

        {/* เมื่อเปิดแอปมาครั้งแรก ให้เด้งไปหน้า /welcome ทันที */}
        <Redirect exact from="/" to="/welcome" />

      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;