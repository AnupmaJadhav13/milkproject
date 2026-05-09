import React from 'react';
import { View, Text } from 'react-native';

const AllPaysScreen = ({ route }) => {
  const { centerId, centerName } = route.params || {};

  return (
    <View>
      <Text>All Pays Screen</Text>
      <Text>{centerName}</Text>
      <Text>{centerId}</Text>
    </View>
  );
};

export default AllPaysScreen;