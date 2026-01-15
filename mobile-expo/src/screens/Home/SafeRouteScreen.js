import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    TextInput,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { dangerAPI } from '../../api/dangerAPI';

const { width, height } = Dimensions.get('window');

// Custom Map Style (Dark/Tactical)
const mapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
    { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
    { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#263c3f" }] },
    { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b9a76" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
    { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
    { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
    { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] },
    { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f3d19c" }] },
    { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#2f3948" }] },
    { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
    { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
    { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] }
];

const SafeRouteScreen = ({ navigation }) => {
    const [location, setLocation] = useState(null);
    const [destination, setDestination] = useState('');
    const [suggestions, setSuggestions] = useState([]); // Search suggestions
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const mapRef = useRef(null);
    const searchTimeout = useRef(null); // For debounce

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            let location = await Location.getCurrentPositionAsync({});
            setLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
        })();
    }, []);

    // 1. Fetch Suggestions from OpenStreetMap (Nominatim)
    const fetchSuggestions = (text) => {
        setDestination(text);

        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (!text || text.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        searchTimeout.current = setTimeout(async () => {
            try {
                // Focused on Bangladesh (countrycodes=bd)
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=bd&limit=5&addressdetails=1`;
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'NirapottaApp/1.0' // Required by OSM
                    }
                });
                const data = await response.json();
                setSuggestions(data);
                setShowSuggestions(true);
            } catch (error) {
                console.error('Search Error:', error);
            }
        }, 800); // 800ms debounce
    };

    // 2. Select a Location
    const handleSelectLocation = (place) => {
        setDestination(place.display_name.split(',')[0]); // Show only main name
        setSuggestions([]);
        setShowSuggestions(false);

        // Use Real Coordinates
        const destCoords = {
            latitude: parseFloat(place.lat),
            longitude: parseFloat(place.lon)
        };

        handleSearch(destCoords);
    };

    // Fetch real routes from OSRM (Open Source Routing Machine) - FREE & OPEN SOURCE
    const fetchOSRMRoutes = async (startLoc, endLoc) => {
        try {
            // OSRM URL: coordinates in 'lon,lat' format
            const url = `https://router.project-osrm.org/route/v1/driving/${startLoc.longitude},${startLoc.latitude};${endLoc.longitude},${endLoc.latitude}?overview=full&geometries=geojson&alternatives=true`;

            const response = await fetch(url);
            const json = await response.json();

            if (!json.routes || json.routes.length === 0) throw new Error('No routes');

            // Transform OSRM routes to our App format
            return json.routes.map((route, index) => {
                // OSRM returns [lon, lat], map needs {latitude, longitude}
                const coordinates = route.geometry.coordinates.map(coord => ({
                    latitude: coord[1],
                    longitude: coord[0]
                }));

                // Calculate time (seconds to minutes)
                const durationMins = Math.round(route.duration / 60);

                return {
                    id: index + 1,
                    // Name the first one Fastest, others Alternative
                    name: index === 0 ? 'Route A (Standard)' : `Route ${String.fromCharCode(65 + index)} (Alternative)`,
                    type: 'unknown', // Will be determined by AI Analysis
                    time: `${durationMins} min`,
                    coordinates: coordinates,
                    distance: (route.distance / 1000).toFixed(1) + ' km'
                };
            });
        } catch (error) {
            console.error('OSRM Error:', error);
            // Fallback to simulated if API fails
            return []; // Fail gracefully
        }
    };

    const handleSearch = async (specificDest = null) => {
        if (!location) return;
        setAnalyzing(true);
        setRoutes([]);
        setSelectedRoute(null);

        // If specificDest is passed (from dropdown), use it. 
        // Otherwise ignore (user must select from list for accurate routing)
        if (!specificDest) {
            setAnalyzing(false);
            return;
        }

        try {
            // 1. Get Real Routes
            const potentialRoutes = await fetchOSRMRoutes(location, specificDest);

            if (potentialRoutes.length === 0) {
                Alert.alert('Route Error', 'Could not find a route to this location.');
                setAnalyzing(false);
                return;
            }

            // 2. Analyze with Backend AI
            const analyzedRoutes = await Promise.all(potentialRoutes.map(async (route) => {
                const analysis = await dangerAPI.analyzeRoute(route.coordinates);
                return { ...route, ...analysis.data };
            }));

            // 3. Classify & Sort
            analyzedRoutes.sort((a, b) => parseInt(a.time) - parseInt(b.time));
            if (analyzedRoutes.length > 0) analyzedRoutes[0].type = 'fastest';

            let bestSafety = -1, safestIdx = -1;
            analyzedRoutes.forEach((r, i) => {
                if (r.safetyScore > bestSafety) { bestSafety = r.safetyScore; safestIdx = i; }
            });
            if (safestIdx !== -1) {
                analyzedRoutes[safestIdx].type = 'safest';
                analyzedRoutes[safestIdx].name = 'Safest Alternative';
            }

            setRoutes(analyzedRoutes);
            const safest = analyzedRoutes[safestIdx] || analyzedRoutes[0];
            setSelectedRoute(safest);

            // Fit map
            mapRef.current.fitToCoordinates(safest.coordinates, {
                edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
                animated: true
            });
        } catch (e) {
            Alert.alert('Error', 'Failed to analyze routes');
            console.error(e);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.mapContainer}>
                {location && (
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        provider={PROVIDER_GOOGLE}
                        customMapStyle={mapStyle}
                        initialRegion={location}
                        showsUserLocation={true}
                    >
                        {/* Routes */}
                        {routes.map(route => {
                            const isSelected = selectedRoute?.id === route.id;
                            // Safest gets Green, others get standard colors
                            const color = route.type === 'safest' ? '#10b981' : '#94a3b8';
                            const zIndex = isSelected ? 10 : 1;

                            return (
                                <Polyline
                                    key={route.id}
                                    coordinates={route.coordinates}
                                    strokeColor={color}
                                    strokeWidth={isSelected ? 6 : 4}
                                    // Removed lineDashPattern for fastest as it's not in the diff
                                    tappable={true}
                                    onPress={() => setSelectedRoute(route)}
                                    style={{ zIndex }}
                                />
                            );
                        })}

                        {/* Destination Marker */}
                        {routes.length > 0 && (
                            <Marker coordinate={routes[0].coordinates[routes[0].coordinates.length - 1]}>
                                <View style={styles.destMarker}><Ionicons name="location" size={20} color="#fff" /></View>
                            </Marker>
                        )}
                    </MapView>
                )}

                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                {/* Search Panel (Floating) */}
                <View style={styles.searchPanel}>
                    {/* From Field */}
                    <View style={styles.inputRow}>
                        <View style={[styles.dot, { backgroundColor: '#38bdf8' }]} />
                        <Text style={styles.staticInput}>Current Location</Text>
                    </View>

                    {/* Connector Line */}
                    <View style={styles.connectorLine} />

                    {/* To Field */}
                    <View style={styles.inputRow}>
                        <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
                        <TextInput
                            style={styles.inputField}
                            placeholder="Where to? (Type to search)"
                            placeholderTextColor="#64748b"
                            value={destination}
                            onChangeText={fetchSuggestions}
                        />
                    </View>

                    {/* Autocomplete List */}
                    {showSuggestions && suggestions.length > 0 && (
                        <View style={styles.suggestionsList}>
                            {suggestions.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.suggestionItem}
                                    onPress={() => handleSelectLocation(item)}
                                >
                                    <Ionicons name="location-outline" size={20} color="#94a3b8" />
                                    <View style={styles.suggestionTextContainer}>
                                        <Text style={styles.suggestionTitle} numberOfLines={1}>
                                            {item.display_name.split(',')[0]}
                                        </Text>
                                        <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                                            {item.display_name}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Route Selection / Result Card */}
                {selectedRoute && (
                    <View style={styles.resultCard}>
                        <Text style={styles.recommendationText}>
                            {selectedRoute.type === 'safest' ? '✨ RECOMMENDED SAFE ROUTE' : '⚠️ SHORTEST BUT RISKIER'}
                        </Text>

                        <View style={styles.routeHeader}>
                            <View>
                                <Text style={styles.routeTitle}>{selectedRoute.name}</Text>
                                <Text style={styles.routeTime}>{selectedRoute.hotspots.length} Risk Zones</Text>
                            </View>
                            <View style={styles.scoreBadge}>
                                <Text style={[styles.scoreValue, { color: selectedRoute.safetyScore > 80 ? '#10b981' : '#f59e0b' }]}>
                                    {selectedRoute.safetyScore}%
                                </Text>
                                <Text style={styles.scoreLabel}>Safety</Text>
                            </View>
                        </View>

                        {/* Comparison Buttons */}
                        <View style={styles.routeOptions}>
                            {routes.map(r => (
                                <TouchableOpacity
                                    key={r.id}
                                    style={[
                                        styles.optionBtn,
                                        selectedRoute.id === r.id ? styles.optionSelected : styles.optionUnselected
                                    ]}
                                    onPress={() => setSelectedRoute(r)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        selectedRoute.id === r.id ? { color: '#fff' } : { color: '#94a3b8' }
                                    ]}>
                                        {r.type === 'safest' ? 'Safest' : 'Fastest'} ({r.time})
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.startBtn} onPress={() => Alert.alert('Navigation', `Starting navigation on ${selectedRoute.name}...`)}>
                            <Text style={styles.startBtnText}>START NAVIGATION</Text>
                            <Ionicons name="navigate" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}

                {analyzing && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#38bdf8" />
                        <Text style={styles.loadingText}>Analyzing Route Safety...</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    mapContainer: {
        flex: 1,
    },
    map: {
        width: width,
        height: height,
    },
    backButton: {
        position: 'absolute',
        top: 20, // Adjusted relative to map container, inside SafeAreaView it might need more padding if not handled, but SafeAreaView handles it.
        left: 20,
        width: 44,
        height: 44,
        backgroundColor: '#1e293b',
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#334155',
        zIndex: 50,
    },
    searchPanel: {
        position: 'absolute',
        top: 80, // Moved down to make space for back button (was 50)
        left: 20,
        right: 20,
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#334155',
        zIndex: 40,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 40,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 12,
    },
    connectorLine: {
        width: 2,
        height: 20,
        backgroundColor: '#334155',
        marginLeft: 4,
        marginVertical: 4,
    },
    staticInput: {
        color: '#94a3b8',
        fontSize: 16,
        fontWeight: '500',
    },
    inputField: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    resultCard: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: '#1e293b',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#334155',
    },
    recommendationText: {
        color: '#10b981',
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    routeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    routeTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    routeTime: {
        color: '#94a3b8',
        fontSize: 14,
    },
    scoreBadge: {
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        padding: 8,
        borderRadius: 8,
        minWidth: 60,
    },
    scoreValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    scoreLabel: {
        color: '#94a3b8',
        fontSize: 10,
    },
    routeOptions: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    optionBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
    },
    optionSelected: {
        backgroundColor: '#334155',
        borderColor: '#475569',
    },
    optionUnselected: {
        backgroundColor: 'transparent',
        borderColor: '#334155',
    },
    optionText: {
        fontWeight: '600',
        fontSize: 13,
    },
    startBtn: {
        backgroundColor: '#38bdf8',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 10,
    },
    startBtnText: {
        color: '#0f172a',
        fontWeight: 'bold',
        fontSize: 16,
    },
    destMarker: {
        backgroundColor: '#ef4444',
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fff',
    },
    suggestionsList: {
        marginTop: 10,
        backgroundColor: '#1e293b',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
        maxHeight: 200,
        overflow: 'hidden'
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    suggestionTextContainer: {
        marginLeft: 10,
        flex: 1,
    },
    suggestionTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    suggestionSubtitle: {
        color: '#94a3b8',
        fontSize: 12,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600'
    }
});

export default SafeRouteScreen;
