const CITIES_KEY = "miwebya_cities";
const BUSINESS_TYPES_KEY = "miwebya_business_types";

export class OptionsRepository {
  // CITIES
  async getCities(): Promise<string[]> {
    const data = localStorage.getItem(CITIES_KEY);
    return data ? JSON.parse(data) : [];
  }

  async saveCity(city: string): Promise<void> {
    if (!city.trim()) return;
    
    const cities = await this.getCities();
    const normalizedCity = city.trim();
    
    // Solo agregar si no existe (case insensitive)
    if (!cities.some(c => c.toLowerCase() === normalizedCity.toLowerCase())) {
      cities.push(normalizedCity);
      cities.sort();
      localStorage.setItem(CITIES_KEY, JSON.stringify(cities));
    }
  }

  async deleteCity(city: string): Promise<void> {
    const cities = await this.getCities();
    const filtered = cities.filter(c => c !== city);
    localStorage.setItem(CITIES_KEY, JSON.stringify(filtered));
  }

  // BUSINESS TYPES
  async getBusinessTypes(): Promise<string[]> {
    const data = localStorage.getItem(BUSINESS_TYPES_KEY);
    return data ? JSON.parse(data) : [];
  }

  async saveBusinessType(businessType: string): Promise<void> {
    if (!businessType.trim()) return;
    
    const businessTypes = await this.getBusinessTypes();
    const normalized = businessType.trim();
    
    // Solo agregar si no existe (case insensitive)
    if (!businessTypes.some(bt => bt.toLowerCase() === normalized.toLowerCase())) {
      businessTypes.push(normalized);
      businessTypes.sort();
      localStorage.setItem(BUSINESS_TYPES_KEY, JSON.stringify(businessTypes));
    }
  }

  async deleteBusinessType(businessType: string): Promise<void> {
    const businessTypes = await this.getBusinessTypes();
    const filtered = businessTypes.filter(bt => bt !== businessType);
    localStorage.setItem(BUSINESS_TYPES_KEY, JSON.stringify(filtered));
  }

  // SEED DATA
  async seedDefaultOptions(): Promise<void> {
    const existingCities = await this.getCities();
    const existingBusinessTypes = await this.getBusinessTypes();

    if (existingCities.length === 0) {
      const defaultCities = ["Buenos Aires", "Córdoba", "Rosario", "Mendoza"];
      for (const city of defaultCities) {
        await this.saveCity(city);
      }
    }

    if (existingBusinessTypes.length === 0) {
      const defaultBusinessTypes = ["Restaurante", "Tienda de ropa", "Consultora", "Gimnasio", "Peluquería"];
      for (const bt of defaultBusinessTypes) {
        await this.saveBusinessType(bt);
      }
    }
  }
}

export const optionsRepository = new OptionsRepository();
