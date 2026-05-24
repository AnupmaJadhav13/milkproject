import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../theme';

/**
 * SearchBar
 * Props:
 *   value          – controlled value
 *   onChangeText   – preferred handler name
 *   onChange       – alias (legacy screens use this)
 *   placeholder    – placeholder text
 *   autoFocus      – optional
 */
const SearchBar = ({
  value = '',
  onChangeText,
  onChange,
  placeholder = 'Search...',
  autoFocus = false,
}) => {
  const handleChange = onChangeText || onChange || (() => {});
  const hasValue = value && value.length > 0;

  return (
    <View style={styles.wrapper}>
      <Search size={16} color={colors.primary} strokeWidth={2.5} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textDisabled}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="never"
        autoFocus={autoFocus}
        underlineColorAndroid="transparent"
      />
      {hasValue && (
        <TouchableOpacity
          onPress={() => handleChange('')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.clearBtn}
        >
          <X size={14} color={colors.textMuted} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    height: 48,
    shadowColor: '#1A2B28',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  icon: {
    marginRight: spacing.xs,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    height: 48,
    color: colors.text,
    fontSize: typography.body,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  clearBtn: {
    marginLeft: spacing.xs,
    padding: 4,
    flexShrink: 0,
  },
});

export default SearchBar;
