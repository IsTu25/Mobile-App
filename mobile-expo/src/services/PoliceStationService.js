import api from '../api/apiClient';

class PoliceStationService {
    async getNearestStation(latitude, longitude) {
        try {
            const response = await api.get('/police/nearest', {
                params: { lat: latitude, lon: longitude },
            });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching nearest police station:', error);
            throw error;
        }
    }
}

export default new PoliceStationService();
