import { 
  searchAddressByDistrict, 
  searchAddressByAmphoe, 
  searchAddressByProvince
} from 'thai-address-database';

export interface ThaiAddress {
  district: string;
  amphoe: string;
  province: string;
  zipcode: string;
}

export interface AddressOption {
  value: string;
  label: string;
  district?: string;
  amphoe?: string;
  province?: string;
  zipcode?: string;
}

// ดึงข้อมูลจังหวัดทั้งหมด
export const getAllProvinces = (): AddressOption[] => {
  try {
    // ใช้ searchAddressByProvince แทนเพื่อหาจังหวัดทั้งหมด
    const allAddresses = searchAddressByProvince('');
    if (allAddresses.length === 0) {
      // หากไม่ได้ผลลัพธ์ ลองใช้วิธีอื่น
      const commonProvinces = [
        'กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'นครปฐม',
        'ระยอง', 'ชลบุรี', 'เชียงใหม่', 'เชียงราย', 'ขอนแก่น', 'อุดรธานี',
        'นครราชสีมา', 'อุบลราชธานี', 'สุรินทร์', 'บุรีรัมย์', 'ศรีสะเกษ',
        'หาดใหญ่', 'สงขลา', 'ภูเก็ต', 'กระบี่', 'สุราษฎร์ธานี'
      ];
      
      return commonProvinces.map(province => ({
        value: province,
        label: province
      })).sort((a, b) => a.label.localeCompare(b.label, 'th'));
    }
    
    const uniqueProvinces = Array.from(new Set(allAddresses.map(addr => addr.province)));
    return uniqueProvinces.map(province => ({
      value: province,
      label: province
    })).sort((a, b) => a.label.localeCompare(b.label, 'th'));
  } catch (error) {
    console.error('Error loading provinces:', error);
    // Fallback หากมี error
    const fallbackProvinces = [
      'กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'สมุทรสาคร', 'นครปฐม'
    ];
    
    return fallbackProvinces.map(province => ({
      value: province,
      label: province
    }));
  }
};

// ดึงข้อมูลอำเภอตามจังหวัด
export const getAmphoesByProvince = (provinceName: string): AddressOption[] => {
  if (!provinceName) return [];
  
  try {
    const addresses = searchAddressByProvince(provinceName);
    const uniqueAmphoes = Array.from(new Set(addresses.map(a => a.amphoe)));
    
    return uniqueAmphoes.map(amphoe => ({
      value: `${amphoe}, ${provinceName}`,
      label: amphoe,
      amphoe,
      province: provinceName
    })).sort((a, b) => a.label.localeCompare(b.label, 'th'));
  } catch (error) {
    console.error('Error loading amphoes:', error);
    return [];
  }
};

// ดึงข้อมูลตำบลตามอำเภอ
export const getDistrictsByAmphoe = (amphoe: string, province: string): AddressOption[] => {
  if (!amphoe || !province) return [];
  
  try {
    const addresses = searchAddressByAmphoe(amphoe).filter(a => a.province === province);
    
    return addresses.map(address => ({
      value: `${address.district}, ${address.amphoe}, ${address.province} ${address.zipcode}`,
      label: `${address.district} (${address.zipcode})`,
      district: address.district,
      amphoe: address.amphoe,
      province: address.province,
      zipcode: address.zipcode
    })).sort((a, b) => a.label.localeCompare(b.label, 'th'));
  } catch (error) {
    console.error('Error loading districts:', error);
    return [];
  }
};

// ฟอร์แมตที่อยู่สำหรับแสดงผล
export const formatAddress = (address: ThaiAddress): string => {
  return `${address.district} ${address.amphoe} ${address.province} ${address.zipcode}`;
};

// แปลงจาก value เป็น object ที่อยู่
export const parseAddressValue = (value: string): ThaiAddress | null => {
  const parts = value.split(', ');
  if (parts.length >= 3) {
    const district = parts[0];
    const amphoe = parts[1];
    const provinceAndZip = parts[2].split(' ');
    const zipcode = provinceAndZip.pop() || '';
    const province = provinceAndZip.join(' ');
    
    return {
      district,
      amphoe,
      province,
      zipcode
    };
  }
  return null;
};