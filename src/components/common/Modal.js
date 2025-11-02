import React from 'react';
import { Modal as MuiModal, Box } from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  p: 4,
  borderRadius: 0,
  width: '100vw',
};

const Modal = ({ open, onClose, children }) => (
  <MuiModal open={open} onClose={onClose}>
    <Box sx={style}>{children}</Box>
  </MuiModal>
);

export default Modal;
