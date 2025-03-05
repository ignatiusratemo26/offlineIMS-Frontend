import React from 'react';
import { Box, Typography, Link, Divider } from '@mui/material';

const Footer = () => {
  return (
    <Box 
      component="footer" 
      sx={{ 
        mt: 'auto', 
        py: 2, 
        px: 2, 
        backgroundColor: (theme) => theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900]
      }}
    >
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Kenyatta University Design Studio
        </Typography>
        <Box>
          <Link href="#" color="inherit" sx={{ mx: 1 }}>
            <Typography variant="body2">Help</Typography>
          </Link>
          <Link href="#" color="inherit" sx={{ mx: 1 }}>
            <Typography variant="body2">Terms</Typography>
          </Link>
          <Link href="#" color="inherit" sx={{ mx: 1 }}>
            <Typography variant="body2">Privacy</Typography>
          </Link>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;