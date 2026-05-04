import * as Yup from 'yup';

export const loginSchema = Yup.object().shape({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required')
});

const collectionHeadSchema = Yup.object().shape({
  fullName: Yup.string().when('username', {
    is: (val) => !!val,
    then: Yup.string().required('Collection head name is required'),
    otherwise: Yup.string()
  }),
  mobileNumber: Yup.string().when('username', {
    is: (val) => !!val,
    then: Yup.string().required('Collection head phone number is required'),
    otherwise: Yup.string()
  }),
  alternativeMobileNumber: Yup.string(),
  username: Yup.string(),
  password: Yup.string().when('username', {
    is: (val) => !!val,
    then: Yup.string().required('Collection head password is required'),
    otherwise: Yup.string()
  })
});

export const centerSchema = Yup.object().shape({
  name: Yup.string().required('Center name is required'),
  centerCode: Yup.string().required('Center code is required'),
  fullAddress: Yup.string().required('Full address is required'),
  village: Yup.string().required('Village is required'),
  taluka: Yup.string().required('Taluka is required'),
  district: Yup.string().required('District is required'),
  state: Yup.string().required('State is required'),
  pincode: Yup.string().required('Pincode is required'),
  collectionHead: collectionHeadSchema
});

export const farmerSchema = Yup.object().shape({
  fullName: Yup.string().required('Farmer full name is required'),
  mobileNumber: Yup.string().required('Mobile number is required'),
  address: Yup.string().required('Address is required'),
  village: Yup.string().required('Village is required'),
  gender: Yup.string().required('Gender is required'),
  bankName: Yup.string().required('Bank name is required'),
  ifscCode: Yup.string().required('IFSC code is required'),
  accountNumber: Yup.string().required('Account number is required'),
  accountHolderName: Yup.string().required('Account holder name is required'),
  branchName: Yup.string().required('Branch name is required'),
  assignedCenter: Yup.string().required('Assigned center is required'),
  animalType: Yup.string().required('Animal type is required')
});

export const foodSchema = Yup.object().shape({
  farmerId: Yup.string().required('Farmer is required'),
  animalType: Yup.string().required('Animal type is required').oneOf(['Cow', 'Buffalo']),
  foodType: Yup.string().required('Food type is required').oneOf(['Cattle Feed', 'Buffalo Feed', 'Mineral Mix', 'Dry Fodder', 'Green Fodder', 'Protein Mix', 'Other']),
  quantity: Yup.number().required('Quantity is required').positive('Quantity must be positive'),
  unit: Yup.string().required('Unit is required').oneOf(['Bag', 'KG', 'Packet', 'Liter']),
  rate: Yup.number().required('Rate is required').positive('Rate must be positive'),
  paymentStatus: Yup.string().required('Payment status is required').oneOf(['Pending', 'Paid']),
  notes: Yup.string()
});
