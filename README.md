# 🏃‍♂️ KKU FitMap 

KKU FitMap คือแอปพลิเคชันสำหรับค้นหาสถานที่ออกกำลังกาย ฟิตเนส และสนามกีฬา บริเวณรอบมหาวิทยาลัยขอนแก่น (KKU) พร้อมระบบบันทึกสถานที่โปรดและประวัติการออกกำลังกายส่วนตัว

## 🛠 เทคโนโลยีที่ใช้ (Tech Stack)
* **Frontend:** Ionic Framework, React, TypeScript, Vite
* **Backend/Database:** Firebase (Authentication, Cloud Firestore)
* **API:** Google Maps Places API (New) OpenStreetMap
* **Styling:** CSS, Lucide React (Icons)

---

## 📋 ข้อกำหนดเบื้องต้น (Prerequisites)
ก่อนทำการรันโปรเจกต์ กรุณาตรวจสอบให้แน่ใจว่าเครื่องคอมพิวเตอร์ของคุณติดตั้งโปรแกรมเหล่านี้แล้ว:
1. **Node.js** (แนะนำเวอร์ชัน 18 ขึ้นไป)
2. **npm** (มาพร้อมกับ Node.js)
3. **Ionic CLI** (หากยังไม่ได้ติดตั้ง สามารถรันคำสั่ง: `npm install -g @ionic/cli`)

---

## 🚀 การติดตั้งและรันโปรเจกต์ (Installation & Setup)

ทำตามขั้นตอนด้านล่างนี้เพื่อรันโปรเจกต์ในเครื่อง Local (Localhost):

**1. Clone โปรเจกต์ลงมาที่เครื่อง:**
```bash
git clone [https://github.com/6633803776/kkufitmap2.git](https://github.com/6633803776/kkufitmap2.git)
cd kkufitmap2
```
**2. ติดตั้ง Dependencies ทั้งหมด:**
```bash 
npm install
```
**3. การตั้งค่า Environment Variables (สำคัญมาก 🌟):**
เนื่องจากเหตุผลด้านความปลอดภัย ไฟล์ .env จึงไม่ได้ถูกอัปโหลดขึ้น GitHub ด้วย
คุณจำเป็นต้องสร้างไฟล์ชื่อ .env ไว้ที่โฟลเดอร์นอกสุดของโปรเจกต์ (ระดับเดียวกับ package.json) และใส่ข้อมูล API Key

**4. รันแอปพลิเคชัน:**
เมื่อสร้างไฟล์ .env เสร็จแล้ว สามารถรันโปรเจกต์ได้ด้วยคำสั่ง:
```bash
ionic serve
```

## 📱 ฟีเจอร์หลักของการใช้งาน (Key Features)
Authentication: ระบบสมัครสมาชิกและเข้าสู่ระบบด้วย Email/Password (Firebase Auth)

Home (หน้าหลัก):

แสดงสภาพอากาศปัจจุบันและค่า AQI (ดึงข้อมูลพิกัด GPS)

แสดงรายการสถานที่ออกกำลังกายรอบ มข. ดึงข้อมูลจาก Google Places API

ระบบค้นหาและกรองประเภทสถานที่ (กลางแจ้ง / ในร่ม)

Map (แผนที่): แสดงจุดหมุดสถานที่ออกกำลังกายบนแผนที่

Saved (รายการโปรด): บันทึกสถานที่ที่ชื่นชอบเก็บไว้ดูภายหลัง (เชื่อมต่อกับ Firestore)

Activity (บันทึกกิจกรรม): บันทึกประวัติการออกกำลังกาย (วิ่ง, เดิน, ปั่นจักรยาน, ฟิตเนส) พร้อมสรุปสถิติเวลาและจำนวนวัน

Profile (โปรไฟล์): จัดการข้อมูลส่วนตัว เปลี่ยนรูปภาพ เปลี่ยนรหัสผ่าน และออกจากระบบ

## วิดีโอสาธิตวิธีการใช้งานเบื้องต้น
```bash
https://drive.google.com/file/d/18GmKxAaCO6iFqPHAGBpAjEGF8YCKNX9f/view?usp=sharing
```
