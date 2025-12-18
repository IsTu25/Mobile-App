import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
    Linking,
    PermissionsAndroid,
    Platform,
} from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import { emergencyAPI } from '../../api/emergencyAPI';
import { Ionicons } from '@expo/vector-icons';

const EmergencyContactsScreen = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [relationship, setRelationship] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const result = await emergencyAPI.getContacts();
            setContacts(result.data.contacts);
        } catch (error) {
            console.error('Failed to fetch contacts:', error);
            Alert.alert('Error', 'Failed to load contacts');
        } finally {
            setLoading(false);
        }
    };

    const handleAddContact = async () => {
        if (!name.trim() || !phone.trim()) {
            Alert.alert('Error', 'Name and Phone number are required');
            return;
        }

        setAdding(true);
        try {
            const result = await emergencyAPI.addContact(name, phone, relationship);
            setContacts(result.data.contacts);
            setAddModalVisible(false);
            setName('');
            setPhone('');
            setRelationship('');
            Alert.alert('Success', 'Emergency contact added');
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to add contact';
            Alert.alert('Error', message);
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteContact = async (contactPhone) => {
        Alert.alert(
            'Remove Contact',
            'Are you sure you want to remove this contact?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const result = await emergencyAPI.removeContact(contactPhone);
                            setContacts(result.data.contacts);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to remove contact');
                        }
                    },
                },
            ]
        );
    };

    const handleCallContact = async (phoneNumber) => {
        const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');

        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CALL_PHONE,
                    {
                        title: 'Phone Call Permission',
                        message: 'App needs access to make calls directly.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    },
                );

                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    try {
                        await IntentLauncher.startActivityAsync('android.intent.action.CALL', {
                            data: `tel:${cleanPhone}`
                        });
                    } catch (e) {
                        console.error("Direct call failed, falling back to dialer:", e);
                        Linking.openURL(`tel:${cleanPhone}`);
                    }
                } else {
                    // Fallback if permission denied
                    Linking.openURL(`tel:${cleanPhone}`);
                }
            } catch (err) {
                console.warn(err);
                Linking.openURL(`tel:${cleanPhone}`);
            }
        } else {
            // iOS always confirms
            Linking.openURL(`tel:${cleanPhone}`);
        }
    };

    const renderContactItem = ({ item }) => (
        <View style={styles.contactCard}>
            <TouchableOpacity
                style={styles.contactInfo}
                onPress={() => handleCallContact(item.phone)}
            >
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.contactPhone}>{item.phone}</Text>
                {item.relationship ? (
                    <Text style={styles.contactRelation}>{item.relationship}</Text>
                ) : null}
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteContact(item.phone)}>
                <Ionicons name="trash-outline" size={24} color="#ff4444" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>Emergency Contacts</Text>
            <Text style={styles.subtitle}>
                These contacts will be notified via SMS when you trigger SOS or Emergency Alert.
            </Text>

            {loading ? (
                <ActivityIndicator size="large" color="#e63946" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={contacts}
                    renderItem={renderContactItem}
                    keyExtractor={(item) => item.phone}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No emergency contacts added yet.</Text>
                    }
                    contentContainerStyle={styles.listContainer}
                />
            )}

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setAddModalVisible(true)}>
                <Ionicons name="add" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Add New Contact</Text>
            </TouchableOpacity>

            {/* Add Contact Modal */}
            <Modal
                visible={addModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setAddModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Emergency Contact</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            value={name}
                            onChangeText={setName}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number (+880...)"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Relationship (e.g. Brother)"
                            value={relationship}
                            onChangeText={setRelationship}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn]}
                                onPress={() => setAddModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalBtn, styles.saveBtn]}
                                onPress={handleAddContact}
                                disabled={adding}>
                                {adding ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Save Contact</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f9fa',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    listContainer: {
        paddingBottom: 80,
    },
    contactCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    contactPhone: {
        fontSize: 14,
        color: '#555',
        marginTop: 2,
    },
    contactRelation: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
        fontStyle: 'italic',
    },
    deleteButton: {
        padding: 10,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 30,
        fontSize: 16,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e63946',
        padding: 15,
        borderRadius: 30,
        position: 'absolute',
        bottom: 30,
        right: 20,
        left: 20,
        shadowColor: '#e63946',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    modalBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: '#f1f1f1',
        marginRight: 10,
    },
    saveBtn: {
        backgroundColor: '#e63946',
        marginLeft: 10,
    },
    cancelBtnText: {
        color: '#333',
        fontWeight: '600',
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default EmergencyContactsScreen;
