import type {SxProps, Theme} from '@mui/material';

export const getTabButtonStyles = (isActive: boolean): SxProps<Theme> => ({
  textTransform: 'none',
  borderRadius: 2,
  py: 1.5,
  fontWeight: isActive ? 600 : 500,
  backgroundColor: isActive ? '#2970ff' : 'transparent',
  color: isActive ? 'white' : '#8b9bb4',
  borderColor: isActive ? 'transparent' : '#2f3a4e',
  '&:hover': {
    backgroundColor: isActive ? '#1a5ce6' : '#1c2536',
    borderColor: isActive ? 'transparent' : '#8b9bb4',
  },
});

export const darkTextFieldStyles: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#111927',
    color: 'white',
    borderRadius: 2,
    '& fieldset': { borderColor: '#2f3a4e' },
    '&:hover fieldset': { borderColor: '#8b9bb4' },
    '&.Mui-focused fieldset': { borderColor: '#2970ff' },
  },
};

export const darkSelectStyles: SxProps<Theme> = {
  backgroundColor: '#111927',
  color: 'white',
  borderRadius: 2,
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2f3a4e' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8b9bb4' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2970ff' },
  '& .MuiSvgIcon-root': { color: '#8b9bb4' },
};