import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { MapPin, ChevronDown, X } from 'lucide-react-native';
import { CitySearchService } from '../services/citySearch';

const CitySearchInput = ({ placeholder, onCitySelect, selectedCity, style }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredCities, setFilteredCities] = useState([]);

  useEffect(() => {
    const results = CitySearchService.searchCities(searchText);
    setFilteredCities(results);
  }, [searchText]);

  const handleCitySelect = (city) => {
    onCitySelect(city);
    setIsModalVisible(false);
    setSearchText('');
  };

  const renderCityItem = ({ item }) => (
    <TouchableOpacity
      style={styles.cityItem}
      onPress={() => handleCitySelect(item)}
    >
      <MapPin size={16} color="#666" />
      <Text style={styles.cityItemText}>{item.fullName}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.inputButton}
        onPress={() => setIsModalVisible(true)}
      >
        <View style={styles.inputContent}>
          <MapPin size={20} color="#666" />
          <Text style={[
            styles.inputText,
            !selectedCity && styles.placeholderText
          ]}>
            {selectedCity ? selectedCity.fullName : placeholder}
          </Text>
          <ChevronDown size={20} color="#666" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select City</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <X size={24} color="#351C15" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search cities..."
              placeholderTextColor="#999"
              autoFocus
            />
          </View>

          <FlatList
            data={filteredCities}
            renderItem={renderCityItem}
            keyExtractor={(item) => item.id}
            style={styles.cityList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 1,
  },
  inputButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    minHeight: 56,
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#351C15',
    marginLeft: 12,
    marginRight: 8,
  },
  placeholderText: {
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#351C15',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#351C15',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  cityList: {
    flex: 1,
    backgroundColor: '#fff',
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  cityItemText: {
    fontSize: 16,
    color: '#351C15',
    marginLeft: 12,
  },
});

export default CitySearchInput;