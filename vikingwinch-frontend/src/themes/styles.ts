import type {SxProps, Theme} from '@mui/material/styles';
import {alpha} from '@mui/material/styles';
import {appTheme} from './theme';
import type {MenuProps} from "@mui/material";


export const appBackgroundSx: SxProps<Theme> = {
  flexGrow: 1,
  background: 'radial-gradient(circle at top right, #1e1b4b, #0f172a)', // Consider moving these to theme palette eventually
  backgroundAttachment: 'fixed',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  p: 2,
  pt: 4,
  position: 'relative',
};

export const glassPanelSx: SxProps<Theme> = {
  p: {xs: 4, sm: 5},
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  backgroundColor: 'surface.card',
  backdropFilter: 'blur(20px)',
  borderRadius: '24px',
  color: 'text.primary',
  border: 1,
  borderColor: 'surface.border',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  width: '100%',
  position: 'relative'
};

export const glowingPrimaryButtonSx: SxProps<Theme> = {
  backgroundColor: 'primary.main',
  color: 'primary.contrastText',
  py: 1.5,
  fontSize: '16px',
  fontWeight: 600,
  textTransform: 'none',
  borderRadius: '12px',
  boxShadow: (theme) => `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.39)}`,
  '&:hover': {
    backgroundColor: 'primary.dark',
    boxShadow: (theme) => `0 6px 20px ${alpha(theme.palette.primary.main, 0.23)}`
  }
};

export const errorBannerSx: SxProps<Theme> = {
  textAlign: 'center',
  p: 1,
  mb: 2,
  borderRadius: 2,
  width: '100%',
  backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
  color: 'error.main', // or error.light depending on theme setup
};

export const getTabButtonStyles = (isActive: boolean): SxProps<Theme> => ({
  py: 1.5,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '16px',
  borderRadius: '12px',
  backgroundColor: isActive ? 'primary.main' : 'secondary.main',
  color: isActive ? 'primary.contrastText' : 'text.secondary',
  border: 1,
  borderColor: isActive ? 'primary.main' : 'surface.border',
  boxShadow: isActive ? `0 2px 8px ${alpha(appTheme.palette.primary.main, 0.5)}` : 'none',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: isActive ? 'primary.dark' : 'secondary.dark',
    color: 'primary.contrastText',
    borderColor: isActive ? 'primary.main' : 'surface.border',
  },
});

export const darkTextFieldStyles: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'background.default',
    color: 'text.primary',
    borderRadius: 2,
    '& fieldset': {borderColor: 'surface.border'},
    '&:hover fieldset': {borderColor: 'text.secondary'},
    '&.Mui-focused fieldset': {borderColor: 'primary.main'},
  },
};

export const darkSelectStyles: SxProps<Theme> = {
  backgroundColor: 'background.default',
  color: 'text.primary',
  borderRadius: 2,
  '& .MuiOutlinedInput-notchedOutline': {borderColor: 'surface.border'},
  '&:hover .MuiOutlinedInput-notchedOutline': {borderColor: 'text.secondary'},
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {borderColor: 'primary.main'},
  '& .MuiSvgIcon-root': {color: 'text.secondary'},
};

export const darkMenuStyles: Partial<MenuProps> = {
  sx: {
    "&& .MuiPaper-root": {
      backgroundColor: 'background.default',
      color: 'text.primary',
      border: 1,
      borderColor: 'surface.border',
      borderRadius: 2
    }
  }
};

export const skylogCardStyle: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  p: 3,
  borderRadius: '16px',
  backgroundColor: 'surface.card',
  border: 1,
  borderColor: 'surface.border',
  boxSizing: 'border-box',
  transition: 'all 0.2s ease-in-out',
  cursor: 'default',
  '&:hover': {
    transform: 'scale(1.02)',
    backgroundColor: 'background.default',
  },
};

export const skylogTotalCardStyle: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  p: 3,
  borderRadius: '16px',
  backgroundColor: (theme) => `${theme.palette.primary.main}26`,
  border: 1,
  borderColor: 'primary.main',
  boxSizing: 'border-box',
  transition: 'all 0.2s ease-in-out',
  cursor: 'default',
  '&:hover': {
    transform: 'scale(1.02)',
  },
};

export const cardSurfaceSx: SxProps<Theme> = {
  backgroundColor: 'surface.card',
  border: 1,
  borderColor: 'surface.border',
  borderRadius: '24px',
};

export const toggleContainerSx: SxProps<Theme> = {
  position: 'relative',
  p: '4px',
  borderRadius: '14px',
  backgroundColor: 'background.default',
  border: '1px solid rgba(255,255,255,0.08)',
};

export const getSlidingPillBackgroundSx = (isSecondOptionActive: boolean): SxProps<Theme> => ({
  position: 'absolute',
  top: '4px',
  bottom: '4px',
  left: '4px',
  width: 'calc(50% - 4px)',
  borderRadius: '10px',
  backgroundColor: 'primary.main',
  boxShadow: '0 4px 12px rgba(41,112,255,0.35)',
  transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
  transform: isSecondOptionActive ? 'translateX(100%)' : 'translateX(0)',
  zIndex: 0,
});


export const slidingPillSx: SxProps<Theme> = {
  position: 'relative',
  zIndex: 1,
  gap: 0,
  '& .MuiToggleButton-root': {
    color: 'text.secondary',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '10px !important',
    fontWeight: 600,
    textTransform: 'none',
    py: 0.75,
    transition: 'color 0.2s ease',
    '&:hover': {
      backgroundColor: 'transparent',
    },
    '&.Mui-selected': {
      backgroundColor: 'transparent',
      color: 'text.primary',
      '&:hover': {
        backgroundColor: 'transparent',
      },
    },
  },
};


export const darkBlueButton: SxProps<Theme> = {
  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05),
  border: 2,
  borderColor: 'primary.main',
  color: 'text.primary',
  textTransform: 'none',
  borderRadius: '16px',
  py: 1.5,
  px: 2,
  fontSize: '15px',
  fontWeight: 600,
  backdropFilter: 'blur(4px)',
  transition: 'all 0.2s ease',
  mt: 1,
  '&:hover': {
    backgroundColor: 'primary.main',
    color: 'primary.contrastText', // automatically uses white/black based on primary color
    transform: 'scale(1.02)',
    boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.5)}`,
    borderColor: 'transparent'
  },
  '&:disabled': {
    opacity: 0.5,
    color: 'text.disabled',
    borderColor: 'surface.border', // or alpha('#fff', 0.1) if surface.border isn't defined
  }
};


export const elevatedPanel: SxProps<Theme> = {
  mt: 2,
  p: 3,
  backgroundColor: 'secondary.main',
  border: 1,
  borderColor: 'surface.border',
  borderRadius: 3,
};

export const wingPanel = (open: boolean, wingSize: number): SxProps<Theme> => ({
  width: open ? wingSize : 0,
  opacity: open ? 1 : 0,
  overflow: 'hidden',
  flexShrink: 0,
  boxSizing: 'border-box',
  px: 1,
  transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
  backgroundColor: 'surface.card',
  backdropFilter: 'blur(20px)',
  border: open ? 1 : 'none',
  borderColor: 'surface.border',
  borderTopLeftRadius: 0,
  borderBottomLeftRadius: 0,
  borderTopRightRadius: '16px',
  borderBottomRightRadius: '16px',
});

export const wingPanelButton: SxProps<Theme> = {
  position: 'absolute',
  left: 0,
  top: '50%',
  transform: 'translate(0, -50%)',
  width: 25,
  height: 140,
  backgroundColor: 'secondary.main',
  border: 1,
  borderColor: 'surface.border',
  borderLeft: 'none',
  borderTopLeftRadius: 0,
  borderBottomLeftRadius: 0,
  borderTopRightRadius: '10px',
  borderBottomRightRadius: '10px',
  color: 'text.secondary',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  zIndex: 1,
  '&:hover': {color: 'primary.constrastText', backgroundColor: 'secondary.dark',},
}

export const giantLaunchButtonSx = (isLeft: boolean): SxProps<Theme> => (theme) => {
  const baseColor = isLeft ? theme.palette.primary.main : theme.palette.success.main;

  return {
    fontSize: '20px',
    fontWeight: 700,
    flexDirection: 'column',
    gap: 1,
    whiteSpace: 'nowrap',
    textTransform: 'none',
    backgroundColor: baseColor,
    py: 3,
    px: 2,
    border: 1,
    borderColor: 'surface.borderStrong',
    borderRadius: '20px',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: `0 8px 24px ${alpha(baseColor, 0.4)}`,
    '&:hover': {
      boxShadow: `0 12px 32px ${alpha(baseColor, 0.6)}`,
      transform: 'translateY(-4px) scale(1.02)'
    },
  };
};


export const burnButtonSx: SxProps<Theme> = (theme) => ({
  borderRadius: '16px',
  py: 1,
  px: 2,
  border: 1,
  borderColor: 'error.main',
  backgroundColor: alpha(theme.palette.error.main, 0.1),
  color: 'error.main',
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: alpha(theme.palette.error.main, 0.2),
    borderColor: 'error.main',
    color: 'error.main',
    boxShadow: 'none'
  }
});


export const statusPillSx = (color: 'success' | 'error'): SxProps<Theme> => ({
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  py: 0.5,
  px: 1.25,
  borderRadius: '20px',
  backgroundColor: `${color}.dark`,
  color: `${color}.main`,
  fontWeight: 700,
  fontSize: '16px',
  lineHeight: 1,
});

export const launchCountChipSx: SxProps<Theme> = (theme) => ({
  backgroundColor: alpha(theme.palette.common.black, 0.2),
  color: 'primary.contrastText',
  border: 'none',
  px: 1.5, py: 0.5,
  height: 'auto',
  fontSize: '14px',
  fontWeight: 500,
  borderRadius: '12px'
});
