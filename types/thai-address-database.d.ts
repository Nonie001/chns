declare module 'thai-address-database' {
  export interface Province {
    id: number;
    name_th: string;
    name_en: string;
  }

  export interface Amphoe {
    id: number;
    name_th: string;
    name_en: string;
    province_id: number;
  }

  export interface District {
    id: number;
    name_th: string;
    name_en: string;
    amphoe_id: number;
    province_id: number;
    zip_code: string;
  }

  export interface AddressData {
    district: string;
    amphoe: string;
    province: string;
    zipcode: string;
  }

  export function searchAddressByProvince(query: string): AddressData[];
  export function searchAddressByAmphoe(query: string): AddressData[];
  export function searchAddressByDistrict(query: string): AddressData[];
  export function getProvinces(): Province[];
  export function getAmphoesByProvinceId(provinceId: number): Amphoe[];
  export function getDistrictsByAmphoeId(amphoeId: number): District[];
}