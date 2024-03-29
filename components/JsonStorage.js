import AsyncStorage from '@react-native-async-storage/async-storage';

export class JsonStorage {
  static async setItem(key, value) {
    try {
      return await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('AsyncStorage#setItem error: ' + error.message);
    }
  };

  static async getItem(key) {
    return await AsyncStorage.getItem(key)
      .then((result) => {
        if (result) {
          try {
            result = JSON.parse(result);
          } catch (e) {
            console.error('AsyncStorage#getItem error deserializing JSON for key: ' + key, e.message);
          }
        }
        return result;
      });
  };

  static async removeItem(key) {
    return await AsyncStorage.removeItem(key);
  }
}
