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

export const skylogCardStyle: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  p: 3,
  borderRadius: '16px',
  backgroundColor: '#151c2f',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  boxSizing: 'border-box',
  transition: 'all 0.2s ease-in-out',
  cursor: 'default',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: '#101523',
  }
};

export const skylogTotalCardStyle: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  p: 3,
  borderRadius: '16px',
  backgroundColor: 'rgba(59, 130, 246, 0.15)',
  border: '1px solid #3b82f6',
  boxSizing: 'border-box',
  transition: 'all 0.2s ease-in-out',
  cursor: 'default',
  '&:hover': {
    transform: 'scale(1.02)'
  }
};